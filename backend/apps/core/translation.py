import sys

from django.db import models
from django.db.models import Exists, OuterRef

from .languages import LANGUAGE_CHOICES, admin_language, content_languages, fallback_chain


class TranslationModel(models.Model):
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, db_index=True)

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.master_id}:{self.language}"


class TranslatedFields:
    def __init__(self, **fields):
        self.fields = fields

    def contribute_to_class(self, cls, name):
        model_name = f"{cls.__name__}Translation"
        table_name = f"{cls._meta.db_table}_translation"
        meta = type(
            "Meta",
            (),
            {
                "app_label": cls._meta.app_label,
                "db_table": table_name,
                "verbose_name": f"{cls._meta.verbose_name} translation",
                "constraints": [
                    models.UniqueConstraint(fields=("master", "language"), name=f"{table_name}_unique_language")
                ],
            },
        )
        attributes = {
            "__module__": cls.__module__,
            "Meta": meta,
            "master": models.ForeignKey(cls, on_delete=models.CASCADE, related_name=name),
            **self.fields,
        }
        translation_model = type(model_name, (TranslationModel,), attributes)
        setattr(sys.modules[cls.__module__], model_name, translation_model)
        cls.translation_model = translation_model
        cls.translated_fields = tuple(self.fields)


class TranslatableModel(models.Model):
    translation_required = ()
    display_field = None

    class Meta:
        abstract = True

    def translations_by_language(self):
        return {translation.language: translation for translation in self.translations.all()}

    def translated(self, language, fields=None):
        translations = self.translations_by_language()
        chain = fallback_chain(language)
        values = {}
        for field in fields or self.translated_fields:
            values[field] = ""
            for code in chain:
                translation = translations.get(code)
                value = getattr(translation, field, "") if translation else ""
                if value:
                    values[field] = value
                    break
        return values

    def translated_value(self, field, language=None):
        return self.translated(language or admin_language(), [field])[field]

    def missing_languages(self):
        translations = self.translations_by_language()
        required = self.translation_required or self.translated_fields[:1]
        missing = []
        for code in content_languages():
            translation = translations.get(code)
            if not translation or any(not getattr(translation, field, "") for field in required):
                missing.append(code)
        return missing

    def __str__(self):
        label = self.translated_value(self.display_field) if self.display_field else ""
        return label or getattr(self, "slug", "") or f"#{self.pk}"


def save_translations(instance, translations):
    model = instance.translation_model
    for language, values in translations.items():
        existing = model.objects.filter(master=instance, language=language).first()
        if existing is None:
            if not any(values.values()):
                continue
            existing = model(master=instance, language=language)
        for field, value in values.items():
            setattr(existing, field, value)
        if any(getattr(existing, field) for field in instance.translated_fields):
            existing.save()
        elif existing.pk:
            existing.delete()
    if hasattr(instance, "_prefetched_objects_cache"):
        instance._prefetched_objects_cache.pop("translations", None)


def missing_translation_queryset(queryset, language):
    model = queryset.model
    complete = model.translation_model.objects.filter(master=OuterRef("pk"), language=language)
    for field in model.translation_required or model.translated_fields[:1]:
        complete = complete.exclude(**{field: ""})
    return queryset.annotate(_has_language=Exists(complete)).filter(_has_language=False)


def missing_translation_counts(queryset):
    return {language: missing_translation_queryset(queryset, language).count() for language in content_languages()}

from django.db import transaction
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .languages import admin_language, content_languages, default_language
from .translation import save_translations
from .utils import make_slug, unique_slug


@extend_schema_field(OpenApiTypes.OBJECT)
class TranslationsField(serializers.Field):
    default_error_messages = {"invalid": "Expected an object keyed by language code."}

    def __init__(self, **kwargs):
        kwargs["source"] = "*"
        kwargs.setdefault("required", False)
        super().__init__(**kwargs)

    def to_representation(self, instance):
        fields = instance.translated_fields
        data = {language: {field: "" for field in fields} for language in content_languages()}
        for translation in instance.translations.all():
            if translation.language in data:
                data[translation.language] = {field: getattr(translation, field) or "" for field in fields}
        return data

    def to_internal_value(self, data):
        model = self.parent.Meta.model
        if not isinstance(data, dict):
            self.fail("invalid")
        cleaned = {}
        errors = {}
        for language, values in data.items():
            if language not in content_languages():
                errors[language] = ["Unsupported language."]
                continue
            if not isinstance(values, dict):
                errors[language] = ["Expected an object with translated fields."]
                continue
            language_values = {}
            language_errors = {}
            for field_name in model.translated_fields:
                if field_name not in values:
                    continue
                raw_value = values[field_name]
                value = "" if raw_value is None else str(raw_value).strip()
                max_length = model.translation_model._meta.get_field(field_name).max_length
                if max_length and len(value) > max_length:
                    language_errors[field_name] = [f"Ensure this field has no more than {max_length} characters."]
                language_values[field_name] = value
            if language_errors:
                errors[language] = language_errors
            cleaned[language] = language_values
        if errors:
            raise serializers.ValidationError(errors)
        return {"translations": cleaned}


class TranslatableAdminSerializer(serializers.ModelSerializer):
    translations = TranslationsField()
    display_name = serializers.SerializerMethodField()
    missing_translations = serializers.SerializerMethodField()

    gallery_relation = None
    nested_fields = ()

    def get_display_name(self, instance) -> str:
        return str(instance)

    def get_missing_translations(self, instance) -> list[str]:
        return instance.missing_languages()

    def get_fields(self):
        fields = super().get_fields()
        slug_field = fields.get("slug")
        if slug_field is not None and not slug_field.read_only:
            slug_field.required = False
            slug_field.allow_blank = True
        return fields

    def validate(self, attrs):
        attrs = super().validate(attrs)
        model = self.Meta.model
        required = model.translation_required
        incoming = attrs.get("translations")
        if not required or (incoming is None and self.instance is not None):
            return attrs
        merged = {}
        if self.instance is not None:
            for translation in self.instance.translations.all():
                merged[translation.language] = {field: getattr(translation, field) for field in model.translated_fields}
        for language, values in (incoming or {}).items():
            merged.setdefault(language, {}).update(values)
        errors = {}
        for field in required:
            if not any(merged.get(language, {}).get(field) for language in content_languages()):
                errors[field] = ["This field is required in at least one language."]
        if errors:
            raise serializers.ValidationError({"translations": {admin_language(): errors}})
        return attrs

    def ensure_slug(self, validated_data, translations, instance=None):
        model = self.Meta.model
        if "slug" not in [field.name for field in model._meta.fields]:
            return
        if validated_data.get("slug") or (instance is not None and "slug" not in validated_data):
            return
        source_field = model.display_field or model.translated_fields[0]
        candidates = []
        for language in ("en", "ru", "ky"):
            value = (translations or {}).get(language, {}).get(source_field)
            if not value and instance is not None:
                value = instance.translated(language, [source_field])[source_field]
            if value:
                candidates.append(value)
        base = make_slug(candidates[0]) if candidates else ""
        validated_data["slug"] = unique_slug(model, base or model._meta.model_name, instance.pk if instance else None)

    def extract_related_payload(self, validated_data):
        return {
            "translations": validated_data.pop("translations", None),
            "gallery": validated_data.pop("gallery", None),
            "nested": {name: validated_data.pop(name) for name in self.nested_fields if name in validated_data},
        }

    def save_related_payload(self, instance, payload):
        from apps.media_library.fields import replace_gallery

        if payload["translations"] is not None:
            save_translations(instance, payload["translations"])
        if payload["gallery"] is not None and self.gallery_relation:
            replace_gallery(instance, self.gallery_relation, payload["gallery"])
        for name, items in payload["nested"].items():
            self.save_nested(instance, name, items)

    def save_nested(self, instance, name, items):
        return None

    def create(self, validated_data):
        payload = self.extract_related_payload(validated_data)
        self.ensure_slug(validated_data, payload["translations"])
        with transaction.atomic():
            instance = super().create(validated_data)
            self.save_related_payload(instance, payload)
        return instance

    def update(self, instance, validated_data):
        payload = self.extract_related_payload(validated_data)
        self.ensure_slug(validated_data, payload["translations"], instance)
        with transaction.atomic():
            instance = super().update(instance, validated_data)
            self.save_related_payload(instance, payload)
        return instance


class NestedTranslatableSerializer(serializers.ModelSerializer):
    translations = TranslationsField()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        model = self.Meta.model
        translations = attrs.get("translations") or {}
        for field in model.translation_required:
            if not any(values.get(field) for values in translations.values()):
                raise serializers.ValidationError(
                    {"translations": {admin_language(): {field: ["This field is required in at least one language."]}}}
                )
        return attrs


class LocalizedModelSerializer(serializers.ModelSerializer):
    def get_language(self):
        return self.context.get("language") or default_language()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        fields = getattr(self.Meta, "translated", None) or instance.translated_fields
        data.update(instance.translated(self.get_language(), fields))
        return data


def replace_nested_items(instance, relation, items):
    manager = getattr(instance, relation)
    owner_field = manager.field.name
    manager.all().delete()
    for position, item in enumerate(items):
        translations = item.pop("translations", {}) or {}
        values = {**item, owner_field: instance}
        if "position" in [field.name for field in manager.model._meta.fields]:
            values["position"] = position
        nested = manager.model.objects.create(**values)
        save_translations(nested, translations)
    if hasattr(instance, "_prefetched_objects_cache"):
        instance._prefetched_objects_cache.pop(relation, None)

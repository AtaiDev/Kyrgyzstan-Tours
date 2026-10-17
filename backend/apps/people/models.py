from django.core.validators import MaxValueValidator
from django.db import models

from apps.core.models import ContentModel, SingletonModel, TimeStampedModel
from apps.core.translation import TranslatableModel, TranslatedFields


class SpokenLanguage(TimeStampedModel, TranslatableModel):
    code = models.SlugField(max_length=10, unique=True)
    position = models.PositiveIntegerField(default=0)

    translations = TranslatedFields(name=models.CharField(max_length=60, blank=True))
    translation_required = ("name",)
    display_field = "name"

    class Meta:
        ordering = ("position", "id")


class Guide(ContentModel):
    slug = models.SlugField(max_length=120, unique=True)
    photo = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    languages = models.ManyToManyField(SpokenLanguage, blank=True, related_name="guides")
    regions = models.ManyToManyField("geography.Region", blank=True, related_name="guides")
    travel_styles = models.ManyToManyField("geography.TravelStyle", blank=True, related_name="guides")
    experience_years = models.PositiveSmallIntegerField(default=1, validators=[MaxValueValidator(60)])
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    is_featured = models.BooleanField(default=False, db_index=True)

    translations = TranslatedFields(
        name=models.CharField(max_length=120, blank=True),
        headline=models.CharField(max_length=200, blank=True),
        bio=models.TextField(blank=True),
        specialization=models.TextField(blank=True),
        quote=models.CharField(max_length=255, blank=True),
        seo_title=models.CharField(max_length=120, blank=True),
        seo_description=models.CharField(max_length=320, blank=True),
    )
    translation_required = ("name", "headline")
    display_field = "name"


class TeamMember(ContentModel):
    photo = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    email = models.EmailField(blank=True)

    translations = TranslatedFields(
        name=models.CharField(max_length=120, blank=True),
        role=models.CharField(max_length=120, blank=True),
        bio=models.TextField(blank=True),
    )
    translation_required = ("name", "role")
    display_field = "name"


class FounderProfile(SingletonModel, TranslatableModel):
    guide = models.ForeignKey(Guide, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    photo = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    experience_years = models.PositiveSmallIntegerField(default=0, validators=[MaxValueValidator(70)])
    is_visible = models.BooleanField(default=True)
    is_demo = models.BooleanField(default=False)

    translations = TranslatedFields(
        name=models.CharField(max_length=120, blank=True),
        role=models.CharField(max_length=120, blank=True),
        headline=models.CharField(max_length=200, blank=True),
        bio=models.TextField(blank=True),
        quote=models.TextField(blank=True),
        mission=models.TextField(blank=True),
    )
    translation_required = ("name", "role")
    display_field = "name"

    class Meta:
        verbose_name = "founder profile"

from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
from apps.core.translation import TranslatableModel, TranslatedFields


def asset_upload_path(instance, filename):
    extension = Path(filename).suffix.lower()
    return f"library/{timezone.now():%Y/%m}/{uuid4().hex}{extension}"


def variant_upload_path(instance, filename):
    return f"library/variants/{filename}"


class MediaAsset(TimeStampedModel, TranslatableModel):
    class Kind(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"

    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.IMAGE, db_index=True)
    file = models.FileField(upload_to=asset_upload_path, max_length=255)
    large = models.ImageField(upload_to=variant_upload_path, blank=True, max_length=255)
    medium = models.ImageField(upload_to=variant_upload_path, blank=True, max_length=255)
    thumbnail = models.ImageField(upload_to=variant_upload_path, blank=True, max_length=255)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    file_size = models.PositiveBigIntegerField(default=0)
    original_name = models.CharField(max_length=255, blank=True)
    folder = models.CharField(max_length=60, blank=True, db_index=True)
    author = models.CharField(max_length=255, blank=True)
    license = models.CharField(max_length=120, blank=True)
    license_url = models.URLField(max_length=500, blank=True)
    source_url = models.URLField(max_length=500, blank=True)
    is_demo = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    translations = TranslatedFields(
        alt=models.CharField(max_length=255, blank=True),
        caption=models.CharField(max_length=300, blank=True),
    )
    display_field = "alt"

    class Meta:
        ordering = ("-created_at", "-id")
        verbose_name = "media asset"

    def __str__(self):
        return self.translated_value("alt") or self.original_name or Path(self.file.name).name

    @property
    def url(self):
        return self.file.url if self.file else ""

    @property
    def large_url(self):
        return self.large.url if self.large else self.url

    @property
    def medium_url(self):
        return self.medium.url if self.medium else self.url

    @property
    def thumbnail_url(self):
        return self.thumbnail.url if self.thumbnail else self.medium_url

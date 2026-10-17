from django.db import models

from .translation import TranslatableModel


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ContentModel(TimeStampedModel, TranslatableModel):
    is_published = models.BooleanField(default=True, db_index=True)
    position = models.PositiveIntegerField(default=0, db_index=True)
    is_demo = models.BooleanField(default=False)

    class Meta:
        abstract = True
        ordering = ("position", "id")


class SingletonModel(TimeStampedModel):
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        return 0, {}

    @classmethod
    def load(cls):
        instance, _ = cls.objects.get_or_create(pk=1)
        return instance


class GalleryItem(models.Model):
    asset = models.ForeignKey("media_library.MediaAsset", on_delete=models.CASCADE, related_name="+")
    position = models.PositiveIntegerField(default=0)

    class Meta:
        abstract = True
        ordering = ("position", "id")


class Difficulty(models.TextChoices):
    EASY = "easy", "Easy"
    MODERATE = "moderate", "Moderate"
    CHALLENGING = "challenging", "Challenging"
    EXPERT = "expert", "Expert"

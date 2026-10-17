import math

from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
from apps.core.translation import TranslatableModel, TranslatedFields


class ArticleCategory(TimeStampedModel, TranslatableModel):
    slug = models.SlugField(max_length=80, unique=True)
    position = models.PositiveIntegerField(default=0)

    translations = TranslatedFields(
        name=models.CharField(max_length=80, blank=True),
        description=models.TextField(blank=True),
    )
    translation_required = ("name",)
    display_field = "name"

    class Meta:
        ordering = ("position", "id")
        verbose_name_plural = "article categories"


class Article(TimeStampedModel, TranslatableModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"

    slug = models.SlugField(max_length=140, unique=True)
    category = models.ForeignKey(
        ArticleCategory, null=True, blank=True, on_delete=models.SET_NULL, related_name="articles"
    )
    cover = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    author = models.ForeignKey(
        "people.TeamMember", null=True, blank=True, on_delete=models.SET_NULL, related_name="articles"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    published_at = models.DateTimeField(default=timezone.now, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    is_demo = models.BooleanField(default=False)
    reading_minutes = models.PositiveSmallIntegerField(default=1)
    related_tours = models.ManyToManyField("tours.Tour", blank=True, related_name="articles")

    translations = TranslatedFields(
        title=models.CharField(max_length=200, blank=True),
        excerpt=models.TextField(blank=True),
        body=models.TextField(blank=True),
        seo_title=models.CharField(max_length=120, blank=True),
        seo_description=models.CharField(max_length=320, blank=True),
    )
    translation_required = ("title", "body")
    display_field = "title"

    class Meta:
        ordering = ("-published_at", "-id")

    def update_reading_time(self):
        longest = max((len(translation.body.split()) for translation in self.translations.all()), default=0)
        minutes = max(1, math.ceil(longest / 200))
        if minutes != self.reading_minutes:
            self.reading_minutes = minutes
            Article.objects.filter(pk=self.pk).update(reading_minutes=minutes)

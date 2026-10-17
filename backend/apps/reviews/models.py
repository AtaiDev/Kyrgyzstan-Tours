from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.languages import LANGUAGE_CHOICES
from apps.core.models import TimeStampedModel
from apps.core.translation import TranslatableModel, TranslatedFields


class Review(TimeStampedModel, TranslatableModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    author_name = models.CharField(max_length=120)
    author_country = models.CharField(max_length=80, blank=True)
    author_email = models.EmailField(blank=True)
    avatar = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    tour = models.ForeignKey("tours.Tour", null=True, blank=True, on_delete=models.SET_NULL, related_name="reviews")
    guide = models.ForeignKey("people.Guide", null=True, blank=True, on_delete=models.SET_NULL, related_name="reviews")
    travel_date = models.DateField(null=True, blank=True)
    original_language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    is_featured = models.BooleanField(default=False, db_index=True)
    is_demo = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)

    translations = TranslatedFields(
        title=models.CharField(max_length=200, blank=True),
        text=models.TextField(blank=True),
    )
    translation_required = ("text",)
    display_field = "title"

    class Meta:
        ordering = ("position", "-created_at")
        constraints = [
            models.CheckConstraint(condition=models.Q(rating__gte=1, rating__lte=5), name="review_rating_range")
        ]

    def __str__(self):
        return f"{self.author_name} · {self.rating}★"

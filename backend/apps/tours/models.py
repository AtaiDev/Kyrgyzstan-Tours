from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import ContentModel, Difficulty, GalleryItem, TimeStampedModel
from apps.core.translation import TranslatableModel, TranslatedFields


class Route(ContentModel):
    slug = models.SlugField(max_length=120, unique=True)
    regions = models.ManyToManyField("geography.Region", blank=True, related_name="routes")
    cover = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    distance_km = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(10000)])
    duration_days = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(60)])
    difficulty = models.CharField(max_length=20, choices=Difficulty.choices, default=Difficulty.MODERATE)
    is_featured = models.BooleanField(default=False, db_index=True)

    translations = TranslatedFields(
        title=models.CharField(max_length=160, blank=True),
        summary=models.TextField(blank=True),
        description=models.TextField(blank=True),
        seo_title=models.CharField(max_length=120, blank=True),
        seo_description=models.CharField(max_length=320, blank=True),
    )
    translation_required = ("title", "summary")
    display_field = "title"


class RouteStop(TimeStampedModel, TranslatableModel):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="stops")
    position = models.PositiveIntegerField(default=0)
    attraction = models.ForeignKey(
        "geography.Attraction", null=True, blank=True, on_delete=models.SET_NULL, related_name="route_stops"
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    nights = models.PositiveSmallIntegerField(default=0, validators=[MaxValueValidator(30)])

    translations = TranslatedFields(
        title=models.CharField(max_length=160, blank=True),
        description=models.TextField(blank=True),
    )
    translation_required = ("title",)
    display_field = "title"

    class Meta:
        ordering = ("position", "id")


class Tour(ContentModel):
    class Currency(models.TextChoices):
        USD = "USD", "USD"
        EUR = "EUR", "EUR"
        KGS = "KGS", "KGS"

    slug = models.SlugField(max_length=120, unique=True)
    region = models.ForeignKey("geography.Region", on_delete=models.PROTECT, related_name="tours")
    destinations = models.ManyToManyField("geography.Destination", blank=True, related_name="tours")
    attractions = models.ManyToManyField("geography.Attraction", blank=True, related_name="tours")
    guide = models.ForeignKey("people.Guide", null=True, blank=True, on_delete=models.SET_NULL, related_name="tours")
    route = models.ForeignKey(Route, null=True, blank=True, on_delete=models.SET_NULL, related_name="tours")
    travel_styles = models.ManyToManyField("geography.TravelStyle", blank=True, related_name="tours")
    seasons = models.ManyToManyField("geography.Season", blank=True, related_name="tours")
    cover = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    currency = models.CharField(max_length=3, choices=Currency.choices, default=Currency.USD)
    duration_days = models.PositiveSmallIntegerField(
        default=1, validators=[MinValueValidator(1), MaxValueValidator(60)], db_index=True
    )
    group_size_min = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    group_size_max = models.PositiveSmallIntegerField(default=8, validators=[MinValueValidator(1), MaxValueValidator(100)])
    difficulty = models.CharField(max_length=20, choices=Difficulty.choices, default=Difficulty.MODERATE, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)

    translations = TranslatedFields(
        title=models.CharField(max_length=160, blank=True),
        tagline=models.CharField(max_length=200, blank=True),
        summary=models.TextField(blank=True),
        description=models.TextField(blank=True),
        included=models.TextField(blank=True),
        excluded=models.TextField(blank=True),
        meeting_point=models.CharField(max_length=255, blank=True),
        seo_title=models.CharField(max_length=120, blank=True),
        seo_description=models.CharField(max_length=320, blank=True),
    )
    translation_required = ("title", "summary")
    display_field = "title"

    class Meta(ContentModel.Meta):
        indexes = [models.Index(fields=("price",)), models.Index(fields=("is_published", "position"))]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(group_size_max__gte=models.F("group_size_min")), name="tour_group_size_range"
            )
        ]


class TourDay(TimeStampedModel, TranslatableModel):
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE, related_name="days")
    position = models.PositiveIntegerField(default=0)

    translations = TranslatedFields(
        title=models.CharField(max_length=200, blank=True),
        description=models.TextField(blank=True),
        accommodation=models.CharField(max_length=200, blank=True),
        meals=models.CharField(max_length=120, blank=True),
    )
    translation_required = ("title",)
    display_field = "title"

    class Meta:
        ordering = ("position", "id")


class TourPhoto(GalleryItem):
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE, related_name="gallery_items")

    class Meta(GalleryItem.Meta):
        constraints = [models.UniqueConstraint(fields=("tour", "asset"), name="unique_tour_photo")]

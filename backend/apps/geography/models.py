from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models

from apps.core.models import ContentModel, GalleryItem, TimeStampedModel
from apps.core.translation import TranslatableModel, TranslatedFields

hex_color_validator = RegexValidator(r"^#[0-9a-fA-F]{6}$", "Use a hex color such as #1f6f78.")


def seo_fields():
    return {
        "seo_title": models.CharField(max_length=120, blank=True),
        "seo_description": models.CharField(max_length=320, blank=True),
    }


class Season(TimeStampedModel, TranslatableModel):
    code = models.SlugField(max_length=20, unique=True)
    position = models.PositiveIntegerField(default=0)
    months = models.CharField(max_length=40, blank=True)
    image = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )

    translations = TranslatedFields(
        name=models.CharField(max_length=60, blank=True),
        description=models.TextField(blank=True),
        highlights=models.TextField(blank=True),
    )
    translation_required = ("name",)
    display_field = "name"

    class Meta:
        ordering = ("position", "id")

    def month_numbers(self):
        return [int(value) for value in self.months.split(",") if value.strip().isdigit()]


class TravelStyle(TimeStampedModel, TranslatableModel):
    slug = models.SlugField(max_length=60, unique=True)
    icon = models.CharField(max_length=40, blank=True)
    position = models.PositiveIntegerField(default=0)

    translations = TranslatedFields(
        name=models.CharField(max_length=80, blank=True),
        description=models.TextField(blank=True),
    )
    translation_required = ("name",)
    display_field = "name"

    class Meta:
        ordering = ("position", "id")


class Region(ContentModel):
    class MapCode(models.TextChoices):
        CHUY = "chuy", "Chuy"
        TALAS = "talas", "Talas"
        ISSYK_KUL = "issyk-kul", "Issyk-Kul"
        NARYN = "naryn", "Naryn"
        JALAL_ABAD = "jalal-abad", "Jalal-Abad"
        OSH = "osh", "Osh"
        BATKEN = "batken", "Batken"

    slug = models.SlugField(max_length=120, unique=True)
    map_code = models.CharField(max_length=20, choices=MapCode.choices, unique=True)
    accent_color = models.CharField(max_length=7, default="#2a9d8f", validators=[hex_color_validator])
    cover = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    area_km2 = models.PositiveIntegerField(null=True, blank=True)
    recommended_days_min = models.PositiveSmallIntegerField(default=2, validators=[MinValueValidator(1)])
    recommended_days_max = models.PositiveSmallIntegerField(default=5, validators=[MinValueValidator(1)])
    seasons = models.ManyToManyField(Season, blank=True, related_name="regions")

    translations = TranslatedFields(
        name=models.CharField(max_length=120, blank=True),
        tagline=models.CharField(max_length=200, blank=True),
        description=models.TextField(blank=True),
        nature=models.TextField(blank=True),
        highlights=models.TextField(blank=True),
        key_places=models.CharField(max_length=255, blank=True),
        **seo_fields(),
    )
    translation_required = ("name", "description")
    display_field = "name"

    class Meta(ContentModel.Meta):
        constraints = [
            models.CheckConstraint(
                condition=models.Q(recommended_days_max__gte=models.F("recommended_days_min")),
                name="region_recommended_days_range",
            )
        ]


class RegionPhoto(GalleryItem):
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="gallery_items")

    class Meta(GalleryItem.Meta):
        constraints = [models.UniqueConstraint(fields=("region", "asset"), name="unique_region_photo")]


class Destination(ContentModel):
    slug = models.SlugField(max_length=120, unique=True)
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="destinations")
    cover = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    travel_styles = models.ManyToManyField(TravelStyle, blank=True, related_name="destinations")
    seasons = models.ManyToManyField(Season, blank=True, related_name="destinations")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_featured = models.BooleanField(default=False, db_index=True)

    translations = TranslatedFields(
        name=models.CharField(max_length=160, blank=True),
        tagline=models.CharField(max_length=200, blank=True),
        summary=models.TextField(blank=True),
        description=models.TextField(blank=True),
        **seo_fields(),
    )
    translation_required = ("name", "summary")
    display_field = "name"


class DestinationPhoto(GalleryItem):
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name="gallery_items")

    class Meta(GalleryItem.Meta):
        constraints = [models.UniqueConstraint(fields=("destination", "asset"), name="unique_destination_photo")]


class Attraction(ContentModel):
    class Kind(models.TextChoices):
        LAKE = "lake", "Lake"
        MOUNTAIN = "mountain", "Mountain"
        CANYON = "canyon", "Canyon"
        GORGE = "gorge", "Gorge"
        NATIONAL_PARK = "national_park", "National park"
        HISTORICAL = "historical", "Historical site"
        CULTURAL = "cultural", "Cultural site"
        NATURAL_MONUMENT = "natural_monument", "Natural monument"
        FOREST = "forest", "Forest"

    slug = models.SlugField(max_length=120, unique=True)
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="attractions")
    destination = models.ForeignKey(
        Destination, null=True, blank=True, on_delete=models.SET_NULL, related_name="attractions"
    )
    kind = models.CharField(max_length=30, choices=Kind.choices, default=Kind.NATURAL_MONUMENT, db_index=True)
    cover = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    altitude_m = models.PositiveIntegerField(null=True, blank=True, validators=[MaxValueValidator(8000)])
    seasons = models.ManyToManyField(Season, blank=True, related_name="attractions")
    is_featured = models.BooleanField(default=False, db_index=True)

    translations = TranslatedFields(
        name=models.CharField(max_length=160, blank=True),
        tagline=models.CharField(max_length=200, blank=True),
        description=models.TextField(blank=True),
        visitor_info=models.TextField(blank=True),
        **seo_fields(),
    )
    translation_required = ("name", "description")
    display_field = "name"


class AttractionPhoto(GalleryItem):
    attraction = models.ForeignKey(Attraction, on_delete=models.CASCADE, related_name="gallery_items")

    class Meta(GalleryItem.Meta):
        constraints = [models.UniqueConstraint(fields=("attraction", "asset"), name="unique_attraction_photo")]


class JourneyScene(ContentModel):
    class CameraMotion(models.TextChoices):
        ORBIT = "orbit", "Orbit around the place"
        GLIDE = "glide", "Glide towards the place"
        RISE = "rise", "Rise above the ridges"
        VALLEY = "valley", "Fly along the valley"
        DESCEND = "descend", "Descend from above"
        SWEEP = "sweep", "Sideways sweep"

    slug = models.SlugField(max_length=120, unique=True)
    attraction = models.ForeignKey(
        Attraction, null=True, blank=True, on_delete=models.SET_NULL, related_name="journey_scenes"
    )
    photo = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    sky_color = models.CharField(max_length=7, default="#9fc3d9", validators=[hex_color_validator])
    fog_color = models.CharField(max_length=7, default="#c8d8e0", validators=[hex_color_validator])
    terrain_heightmap = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    terrain_texture = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    terrain_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True, validators=[MinValueValidator(-85), MaxValueValidator(85)]
    )
    terrain_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True, validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    terrain_size_km = models.FloatField(default=30, validators=[MinValueValidator(2), MaxValueValidator(120)])
    terrain_exaggeration = models.FloatField(default=1.3, validators=[MinValueValidator(0.5), MaxValueValidator(4)])
    terrain_far_heightmap = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    terrain_far_texture = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    terrain_far_size_km = models.FloatField(null=True, blank=True, validators=[MinValueValidator(4), MaxValueValidator(400)])
    terrain_captured_on = models.DateField(null=True, blank=True)
    terrain_min_height = models.IntegerField(null=True, blank=True)
    terrain_max_height = models.IntegerField(null=True, blank=True)
    camera_heading = models.PositiveSmallIntegerField(default=0, validators=[MaxValueValidator(359)])
    camera_motion = models.CharField(max_length=20, choices=CameraMotion.choices, default=CameraMotion.ORBIT)

    translations = TranslatedFields(
        title=models.CharField(max_length=160, blank=True),
        subtitle=models.CharField(max_length=200, blank=True),
        description=models.TextField(blank=True),
        cta_label=models.CharField(max_length=60, blank=True),
    )
    translation_required = ("title",)
    display_field = "title"

    @property
    def has_terrain(self):
        return bool(self.terrain_heightmap_id and self.terrain_texture_id)

    @property
    def has_far_terrain(self):
        return bool(self.terrain_far_heightmap_id and self.terrain_far_texture_id and self.terrain_far_size_km)

    def terrain_center(self):
        if self.terrain_latitude is not None and self.terrain_longitude is not None:
            return float(self.terrain_latitude), float(self.terrain_longitude)
        if self.attraction and self.attraction.latitude is not None and self.attraction.longitude is not None:
            return float(self.attraction.latitude), float(self.attraction.longitude)
        return None

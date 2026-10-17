from django.core.validators import MaxValueValidator, RegexValidator
from django.db import models

from apps.core.languages import LANGUAGE_CHOICES
from apps.core.models import ContentModel, SingletonModel, TimeStampedModel
from apps.core.translation import TranslatableModel, TranslatedFields

hex_color_validator = RegexValidator(r"^#[0-9a-fA-F]{6}$", "Use a hex color such as #1f6f78.")

ICON_CHOICES = [
    (name, name)
    for name in (
        "mountain", "mountain-snow", "map", "map-pin", "compass", "route", "tent", "trees", "sun", "snowflake",
        "leaf", "flower", "waves", "camera", "users", "user-check", "shield-check", "star", "heart", "award",
        "sparkles", "clock", "calendar", "globe", "languages", "utensils", "music", "landmark", "footprints",
        "binoculars", "handshake", "message-circle", "headphones", "wallet", "bus", "car",
    )
]


class SiteSettings(SingletonModel, TranslatableModel):
    site_name = models.CharField(max_length=80, default="Kyrgyzstan-Tours")
    logo = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    default_og_image = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    default_language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    whatsapp = models.CharField(max_length=40, blank=True)
    telegram = models.CharField(max_length=80, blank=True)
    instagram_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    office_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    office_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    translations = TranslatedFields(
        tagline=models.CharField(max_length=200, blank=True),
        footer_text=models.TextField(blank=True),
        address=models.CharField(max_length=255, blank=True),
        working_hours=models.CharField(max_length=160, blank=True),
        copyright=models.CharField(max_length=200, blank=True),
    )
    display_field = "tagline"

    class Meta:
        verbose_name = "site settings"

    def __str__(self):
        return self.site_name


class VisualSettings(SingletonModel):
    class Quality(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    enable_3d = models.BooleanField(default=True)
    enable_parallax = models.BooleanField(default=True)
    enable_scroll_animations = models.BooleanField(default=True)
    enable_hero_video = models.BooleanField(default=True)
    enable_map_animations = models.BooleanField(default=True)
    scene_quality = models.CharField(max_length=10, choices=Quality.choices, default=Quality.HIGH)
    parallax_intensity = models.PositiveSmallIntegerField(default=50, validators=[MaxValueValidator(100)])
    hero_overlay_opacity = models.PositiveSmallIntegerField(default=45, validators=[MaxValueValidator(90)])

    class Meta:
        verbose_name = "visual settings"

    def __str__(self):
        return "Visual settings"


class PageSection(TimeStampedModel, TranslatableModel):
    class Page(models.TextChoices):
        HOME = "home", "Home"
        ABOUT = "about", "About"

    page = models.CharField(max_length=20, choices=Page.choices, default=Page.HOME, db_index=True)
    key = models.SlugField(max_length=60)
    position = models.PositiveIntegerField(default=0, db_index=True)
    is_visible = models.BooleanField(default=True)
    background = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    background_video = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    background_video_light = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    primary_link = models.CharField(max_length=255, blank=True)
    secondary_link = models.CharField(max_length=255, blank=True)
    items_limit = models.PositiveSmallIntegerField(default=6, validators=[MaxValueValidator(24)])
    animate = models.BooleanField(default=True)

    translations = TranslatedFields(
        eyebrow=models.CharField(max_length=120, blank=True),
        title=models.CharField(max_length=200, blank=True),
        subtitle=models.TextField(blank=True),
        body=models.TextField(blank=True),
        primary_label=models.CharField(max_length=60, blank=True),
        secondary_label=models.CharField(max_length=60, blank=True),
    )
    translation_required = ("title",)
    display_field = "title"

    class Meta:
        ordering = ("page", "position", "id")
        constraints = [models.UniqueConstraint(fields=("page", "key"), name="unique_section_key_per_page")]

    def __str__(self):
        return f"{self.get_page_display()} · {self.translated_value('title') or self.key}"


class SectionItem(TimeStampedModel, TranslatableModel):
    section = models.ForeignKey(PageSection, on_delete=models.CASCADE, related_name="items")
    position = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    icon = models.CharField(max_length=40, choices=ICON_CHOICES, blank=True)
    image = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    link = models.CharField(max_length=255, blank=True)
    value = models.CharField(max_length=30, blank=True)

    translations = TranslatedFields(
        title=models.CharField(max_length=160, blank=True),
        text=models.TextField(blank=True),
        label=models.CharField(max_length=80, blank=True),
    )
    translation_required = ("title",)
    display_field = "title"

    class Meta:
        ordering = ("position", "id")


class SeoPage(TimeStampedModel, TranslatableModel):
    class Key(models.TextChoices):
        HOME = "home", "Home"
        DESTINATIONS = "destinations", "Destinations"
        REGIONS = "regions", "Regions"
        TOURS = "tours", "Tours"
        ROUTES = "routes", "Routes"
        GUIDES = "guides", "Guides"
        ABOUT = "about", "About"
        REVIEWS = "reviews", "Reviews"
        BLOG = "blog", "Blog"
        CONTACT = "contact", "Contact"
        FAQ = "faq", "FAQ"
        CREDITS = "credits", "Photo credits"

    key = models.CharField(max_length=40, choices=Key.choices, unique=True)
    og_image = models.ForeignKey(
        "media_library.MediaAsset", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    no_index = models.BooleanField(default=False)

    translations = TranslatedFields(
        title=models.CharField(max_length=120, blank=True),
        description=models.CharField(max_length=320, blank=True),
        keywords=models.CharField(max_length=255, blank=True),
    )
    translation_required = ("title", "description")
    display_field = "title"

    class Meta:
        ordering = ("key",)


class StaticPage(TimeStampedModel, TranslatableModel):
    slug = models.SlugField(max_length=80, unique=True)
    is_published = models.BooleanField(default=True)

    translations = TranslatedFields(
        title=models.CharField(max_length=200, blank=True),
        body=models.TextField(blank=True),
        seo_title=models.CharField(max_length=120, blank=True),
        seo_description=models.CharField(max_length=320, blank=True),
    )
    translation_required = ("title", "body")
    display_field = "title"

    class Meta:
        ordering = ("slug",)


class FaqItem(ContentModel):
    class Category(models.TextChoices):
        GENERAL = "general", "General"
        BOOKING = "booking", "Booking"
        TRAVEL = "travel", "Travel"
        SAFETY = "safety", "Safety"

    category = models.CharField(max_length=20, choices=Category.choices, default=Category.GENERAL, db_index=True)

    translations = TranslatedFields(
        question=models.CharField(max_length=255, blank=True),
        answer=models.TextField(blank=True),
    )
    translation_required = ("question", "answer")
    display_field = "question"


class InterfaceString(TimeStampedModel):
    key = models.CharField(max_length=150, unique=True)
    value_ru = models.TextField(blank=True)
    value_en = models.TextField(blank=True)
    value_ky = models.TextField(blank=True)

    class Meta:
        ordering = ("key",)

    def __str__(self):
        return self.key

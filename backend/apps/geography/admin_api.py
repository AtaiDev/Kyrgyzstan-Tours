from rest_framework import serializers

from apps.core.admin_fields import CONTENT_META_FIELDS, READ_ONLY_TIMESTAMPS, TRANSLATABLE_META_FIELDS
from apps.core.serializers import TranslatableAdminSerializer
from apps.core.viewsets import AdminModelViewSet
from apps.media_library.fields import GalleryField, MediaAssetField

from .models import Attraction, Destination, JourneyScene, Region, Season, TravelStyle

GALLERY_PREFETCH = ("gallery_items__asset__translations",)


def validate_coordinates(attrs):
    latitude = attrs.get("latitude")
    longitude = attrs.get("longitude")
    errors = {}
    if latitude is not None and not -90 <= latitude <= 90:
        errors["latitude"] = ["Latitude must be between -90 and 90."]
    if longitude is not None and not -180 <= longitude <= 180:
        errors["longitude"] = ["Longitude must be between -180 and 180."]
    if errors:
        raise serializers.ValidationError(errors)


class SeasonAdminSerializer(TranslatableAdminSerializer):
    image = MediaAssetField()

    class Meta:
        model = Season
        fields = ("id", "code", "position", "months", "image", *TRANSLATABLE_META_FIELDS)
        read_only_fields = READ_ONLY_TIMESTAMPS

    def validate_months(self, value):
        parts = [part.strip() for part in value.split(",") if part.strip()]
        if any(not part.isdigit() or not 1 <= int(part) <= 12 for part in parts):
            raise serializers.ValidationError("Use comma-separated month numbers from 1 to 12.")
        return ",".join(parts)


class SeasonAdminViewSet(AdminModelViewSet):
    queryset = Season.objects.select_related("image").prefetch_related("translations", "image__translations")
    serializer_class = SeasonAdminSerializer
    search_fields = ("code", "translations__name")


class TravelStyleAdminSerializer(TranslatableAdminSerializer):
    class Meta:
        model = TravelStyle
        fields = ("id", "slug", "icon", "position", *TRANSLATABLE_META_FIELDS)
        read_only_fields = READ_ONLY_TIMESTAMPS


class TravelStyleAdminViewSet(AdminModelViewSet):
    queryset = TravelStyle.objects.prefetch_related("translations")
    serializer_class = TravelStyleAdminSerializer
    search_fields = ("slug", "translations__name")


class RegionAdminSerializer(TranslatableAdminSerializer):
    cover = MediaAssetField()
    gallery = GalleryField("gallery_items")
    gallery_relation = "gallery_items"

    class Meta:
        model = Region
        fields = (
            "id",
            "slug",
            "map_code",
            "accent_color",
            "cover",
            "gallery",
            "area_km2",
            "recommended_days_min",
            "recommended_days_max",
            "seasons",
            *CONTENT_META_FIELDS,
        )
        read_only_fields = READ_ONLY_TIMESTAMPS

    def validate(self, attrs):
        attrs = super().validate(attrs)
        minimum = attrs.get("recommended_days_min", getattr(self.instance, "recommended_days_min", 1))
        maximum = attrs.get("recommended_days_max", getattr(self.instance, "recommended_days_max", 1))
        if maximum < minimum:
            raise serializers.ValidationError({"recommended_days_max": ["Must be greater than or equal to the minimum."]})
        return attrs


class RegionAdminViewSet(AdminModelViewSet):
    queryset = Region.objects.select_related("cover").prefetch_related(
        "translations", "seasons", "cover__translations", *GALLERY_PREFETCH
    )
    serializer_class = RegionAdminSerializer
    search_fields = ("slug", "translations__name")
    boolean_filter_fields = ("is_published", "is_demo")

    def choice_extra(self, item):
        return {"slug": item.slug}


class DestinationAdminSerializer(TranslatableAdminSerializer):
    cover = MediaAssetField()
    gallery = GalleryField("gallery_items")
    gallery_relation = "gallery_items"

    class Meta:
        model = Destination
        fields = (
            "id",
            "slug",
            "region",
            "cover",
            "gallery",
            "travel_styles",
            "seasons",
            "latitude",
            "longitude",
            "is_featured",
            *CONTENT_META_FIELDS,
        )
        read_only_fields = READ_ONLY_TIMESTAMPS

    def validate(self, attrs):
        attrs = super().validate(attrs)
        validate_coordinates(attrs)
        return attrs


class DestinationAdminViewSet(AdminModelViewSet):
    queryset = Destination.objects.select_related("cover", "region").prefetch_related(
        "translations", "travel_styles", "seasons", "cover__translations", *GALLERY_PREFETCH
    )
    serializer_class = DestinationAdminSerializer
    filterset_fields = ("region",)
    search_fields = ("slug", "translations__name", "translations__summary")
    boolean_filter_fields = ("is_published", "is_featured", "is_demo")


class AttractionAdminSerializer(TranslatableAdminSerializer):
    cover = MediaAssetField()
    gallery = GalleryField("gallery_items")
    gallery_relation = "gallery_items"

    class Meta:
        model = Attraction
        fields = (
            "id",
            "slug",
            "region",
            "destination",
            "kind",
            "cover",
            "gallery",
            "latitude",
            "longitude",
            "altitude_m",
            "seasons",
            "is_featured",
            *CONTENT_META_FIELDS,
        )
        read_only_fields = READ_ONLY_TIMESTAMPS

    def validate(self, attrs):
        attrs = super().validate(attrs)
        validate_coordinates(attrs)
        region = attrs.get("region", getattr(self.instance, "region", None))
        destination = attrs.get("destination", getattr(self.instance, "destination", None))
        if destination is not None and region is not None and destination.region_id != region.pk:
            raise serializers.ValidationError({"destination": ["The destination belongs to another region."]})
        return attrs


class AttractionAdminViewSet(AdminModelViewSet):
    queryset = Attraction.objects.select_related("cover", "region", "destination").prefetch_related(
        "translations", "seasons", "cover__translations", *GALLERY_PREFETCH
    )
    serializer_class = AttractionAdminSerializer
    filterset_fields = ("region", "destination", "kind")
    search_fields = ("slug", "translations__name", "translations__description")
    boolean_filter_fields = ("is_published", "is_featured", "is_demo")


class JourneySceneAdminSerializer(TranslatableAdminSerializer):
    photo = MediaAssetField()
    terrain_heightmap = MediaAssetField()
    terrain_texture = MediaAssetField()
    terrain_far_heightmap = MediaAssetField()
    terrain_far_texture = MediaAssetField()

    class Meta:
        model = JourneyScene
        fields = (
            "id",
            "slug",
            "attraction",
            "photo",
            "sky_color",
            "fog_color",
            "terrain_heightmap",
            "terrain_texture",
            "terrain_latitude",
            "terrain_longitude",
            "terrain_size_km",
            "terrain_exaggeration",
            "terrain_far_heightmap",
            "terrain_far_texture",
            "terrain_far_size_km",
            "terrain_captured_on",
            "terrain_min_height",
            "terrain_max_height",
            "camera_heading",
            "camera_motion",
            *CONTENT_META_FIELDS,
        )
        read_only_fields = READ_ONLY_TIMESTAMPS


class JourneySceneAdminViewSet(AdminModelViewSet):
    queryset = JourneyScene.objects.select_related(
        "photo", "attraction", "terrain_heightmap", "terrain_texture", "terrain_far_heightmap", "terrain_far_texture"
    ).prefetch_related(
        "translations",
        "photo__translations",
        "terrain_heightmap__translations",
        "terrain_texture__translations",
        "terrain_far_heightmap__translations",
        "terrain_far_texture__translations",
    )
    serializer_class = JourneySceneAdminSerializer
    search_fields = ("slug", "translations__title")
    boolean_filter_fields = ("is_published", "is_demo")

from rest_framework import serializers

from apps.core.admin_fields import CONTENT_META_FIELDS, READ_ONLY_TIMESTAMPS
from apps.core.serializers import NestedTranslatableSerializer, TranslatableAdminSerializer, replace_nested_items
from apps.core.viewsets import AdminModelViewSet
from apps.media_library.fields import GalleryField, MediaAssetField

from .models import Route, RouteStop, Tour, TourDay


class TourDayAdminSerializer(NestedTranslatableSerializer):
    class Meta:
        model = TourDay
        fields = ("id", "translations")
        read_only_fields = ("id",)


class TourAdminSerializer(TranslatableAdminSerializer):
    cover = MediaAssetField()
    gallery = GalleryField("gallery_items")
    days = TourDayAdminSerializer(many=True, required=False)
    gallery_relation = "gallery_items"
    nested_fields = ("days",)

    class Meta:
        model = Tour
        fields = (
            "id",
            "slug",
            "region",
            "destinations",
            "attractions",
            "guide",
            "route",
            "travel_styles",
            "seasons",
            "cover",
            "gallery",
            "price",
            "currency",
            "duration_days",
            "group_size_min",
            "group_size_max",
            "difficulty",
            "is_featured",
            "days",
            *CONTENT_META_FIELDS,
        )
        read_only_fields = READ_ONLY_TIMESTAMPS

    def validate(self, attrs):
        attrs = super().validate(attrs)
        minimum = attrs.get("group_size_min", getattr(self.instance, "group_size_min", 1))
        maximum = attrs.get("group_size_max", getattr(self.instance, "group_size_max", 1))
        if maximum < minimum:
            raise serializers.ValidationError({"group_size_max": ["Must be greater than or equal to the minimum group size."]})
        days = attrs.get("days")
        duration = attrs.get("duration_days", getattr(self.instance, "duration_days", 1))
        if days is not None and len(days) > duration:
            raise serializers.ValidationError({"days": [f"The itinerary has more days than the duration ({duration})."]})
        return attrs

    def save_nested(self, instance, name, items):
        replace_nested_items(instance, "days", items)


class TourAdminViewSet(AdminModelViewSet):
    queryset = Tour.objects.select_related("cover", "region", "guide", "route").prefetch_related(
        "translations",
        "destinations",
        "attractions",
        "travel_styles",
        "seasons",
        "cover__translations",
        "gallery_items__asset__translations",
        "days__translations",
    )
    serializer_class = TourAdminSerializer
    filterset_fields = ("region", "guide", "difficulty", "currency")
    search_fields = ("slug", "translations__title", "translations__summary")
    ordering_fields = ("position", "price", "duration_days", "created_at", "updated_at", "id")
    boolean_filter_fields = ("is_published", "is_featured", "is_demo")


class RouteStopAdminSerializer(NestedTranslatableSerializer):
    class Meta:
        model = RouteStop
        fields = ("id", "attraction", "latitude", "longitude", "nights", "translations")
        read_only_fields = ("id",)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not -90 <= attrs["latitude"] <= 90 or not -180 <= attrs["longitude"] <= 180:
            raise serializers.ValidationError({"latitude": ["Coordinates are out of range."]})
        return attrs


class RouteAdminSerializer(TranslatableAdminSerializer):
    cover = MediaAssetField()
    stops = RouteStopAdminSerializer(many=True, required=False)
    nested_fields = ("stops",)

    class Meta:
        model = Route
        fields = (
            "id",
            "slug",
            "regions",
            "cover",
            "distance_km",
            "duration_days",
            "difficulty",
            "is_featured",
            "stops",
            *CONTENT_META_FIELDS,
        )
        read_only_fields = READ_ONLY_TIMESTAMPS

    def save_nested(self, instance, name, items):
        replace_nested_items(instance, "stops", items)


class RouteAdminViewSet(AdminModelViewSet):
    queryset = Route.objects.select_related("cover").prefetch_related(
        "translations", "regions", "cover__translations", "stops__translations"
    )
    serializer_class = RouteAdminSerializer
    filterset_fields = ("regions", "difficulty")
    search_fields = ("slug", "translations__title")
    boolean_filter_fields = ("is_published", "is_featured", "is_demo")

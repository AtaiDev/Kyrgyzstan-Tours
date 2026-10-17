from django.db.models import Avg, Count, Max, Min, Q
from django_filters import rest_framework as filters
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.serializers import LocalizedModelSerializer
from apps.core.utils import split_lines
from apps.core.viewsets import PublicReadOnlyViewSet
from apps.geography.public_api import (
    AttractionCardSerializer,
    DestinationCardSerializer,
    RegionBriefSerializer,
    SeasonBriefSerializer,
    TravelStyleSerializer,
)
from apps.media_library.public_api import PublicMediaSerializer, gallery_prefetch, media_prefetch, serialize_gallery

from .models import Route, RouteStop, Tour, TourDay

APPROVED_REVIEWS = Q(reviews__status="approved")


def tour_card_queryset(queryset=None):
    queryset = queryset if queryset is not None else Tour.objects.all()
    return (
        queryset.select_related("cover", "region", "guide__photo")
        .prefetch_related(
            "translations",
            "region__translations",
            "guide__translations",
            "travel_styles__translations",
            *media_prefetch("cover", "guide__photo"),
        )
        .annotate(
            rating=Avg("reviews__rating", filter=APPROVED_REVIEWS),
            reviews_count=Count("reviews", filter=APPROVED_REVIEWS, distinct=True),
        )
        .order_by("-is_featured", "position", "id")
    )


def route_card_queryset(queryset=None):
    queryset = queryset if queryset is not None else Route.objects.all()
    return (
        queryset.select_related("cover")
        .prefetch_related("translations", "regions__translations", "stops__translations", *media_prefetch("cover"))
        .annotate(tours_count=Count("tours", filter=Q(tours__is_published=True), distinct=True))
        .order_by("-is_featured", "position", "id")
    )


@extend_schema_field(OpenApiTypes.OBJECT)
class GuideBriefField(serializers.Field):
    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, guide):
        if guide is None or not guide.is_published:
            return None
        language = self.context.get("language")
        return {
            "slug": guide.slug,
            "photo": PublicMediaSerializer(guide.photo, context=self.context).data if guide.photo else None,
            **guide.translated(language, ["name", "headline"]),
        }



class TourCardSerializer(LocalizedModelSerializer):
    cover = PublicMediaSerializer(read_only=True)
    region = RegionBriefSerializer(read_only=True)
    guide = GuideBriefField()
    travel_styles = TravelStyleSerializer(many=True, read_only=True)
    rating = serializers.SerializerMethodField()
    reviews_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Tour
        fields = (
            "slug",
            "cover",
            "region",
            "guide",
            "travel_styles",
            "price",
            "currency",
            "duration_days",
            "group_size_min",
            "group_size_max",
            "difficulty",
            "is_featured",
            "rating",
            "reviews_count",
        )
        translated = ("title", "tagline", "summary")

    def get_rating(self, instance) -> float | None:
        value = getattr(instance, "rating", None)
        return round(value, 1) if value else None


class RouteStopSerializer(LocalizedModelSerializer):
    attraction = serializers.SerializerMethodField()

    class Meta:
        model = RouteStop
        fields = ("position", "latitude", "longitude", "nights", "attraction")
        translated = ("title", "description")

    def get_attraction(self, instance) -> dict | None:
        attraction = instance.attraction
        if attraction is None or not attraction.is_published:
            return None
        return {
            "slug": attraction.slug,
            "cover": PublicMediaSerializer(attraction.cover, context=self.context).data if attraction.cover else None,
            **attraction.translated(self.get_language(), ["name"]),
        }


class RouteCardSerializer(LocalizedModelSerializer):
    cover = PublicMediaSerializer(read_only=True)
    regions = RegionBriefSerializer(many=True, read_only=True)
    path = serializers.SerializerMethodField()
    tours_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Route
        fields = ("slug", "cover", "regions", "distance_km", "duration_days", "difficulty", "is_featured", "path", "tours_count")
        translated = ("title", "summary")

    def get_path(self, instance) -> list[dict]:
        language = self.get_language()
        return [
            {
                "latitude": stop.latitude,
                "longitude": stop.longitude,
                "title": stop.translated(language, ["title"])["title"],
            }
            for stop in instance.stops.all()
        ]


class RouteDetailSerializer(RouteCardSerializer):
    stops = serializers.SerializerMethodField()
    tours = serializers.SerializerMethodField()

    class Meta(RouteCardSerializer.Meta):
        fields = RouteCardSerializer.Meta.fields + ("stops", "tours")
        translated = ("title", "summary", "description", "seo_title", "seo_description")

    def get_stops(self, instance) -> list[dict]:
        return RouteStopSerializer(instance.stops.all(), many=True, context=self.context).data

    def get_tours(self, instance) -> list[dict]:
        queryset = tour_card_queryset(instance.tours.filter(is_published=True))[:6]
        return TourCardSerializer(queryset, many=True, context=self.context).data


class TourDaySerializer(LocalizedModelSerializer):
    day = serializers.SerializerMethodField()

    class Meta:
        model = TourDay
        fields = ("day",)
        translated = ("title", "description", "accommodation", "meals")

    def get_day(self, instance) -> int:
        return instance.position + 1


class TourDetailSerializer(TourCardSerializer):
    gallery = serializers.SerializerMethodField()
    days = TourDaySerializer(many=True, read_only=True)
    included = serializers.SerializerMethodField()
    excluded = serializers.SerializerMethodField()
    seasons = SeasonBriefSerializer(many=True, read_only=True)
    destinations = serializers.SerializerMethodField()
    attractions = serializers.SerializerMethodField()
    route = serializers.SerializerMethodField()
    guide_profile = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    related = serializers.SerializerMethodField()

    class Meta(TourCardSerializer.Meta):
        fields = TourCardSerializer.Meta.fields + (
            "gallery",
            "days",
            "included",
            "excluded",
            "seasons",
            "destinations",
            "attractions",
            "route",
            "guide_profile",
            "reviews",
            "related",
        )
        translated = ("title", "tagline", "summary", "description", "meeting_point", "seo_title", "seo_description")

    def get_gallery(self, instance) -> list[dict]:
        return serialize_gallery(instance, self.context)

    def get_included(self, instance) -> list[str]:
        return split_lines(instance.translated(self.get_language(), ["included"])["included"])

    def get_excluded(self, instance) -> list[str]:
        return split_lines(instance.translated(self.get_language(), ["excluded"])["excluded"])

    def get_destinations(self, instance) -> list[dict]:
        destinations = [item for item in instance.destinations.all() if item.is_published]
        return DestinationCardSerializer(destinations, many=True, context=self.context).data

    def get_attractions(self, instance) -> list[dict]:
        attractions = [item for item in instance.attractions.all() if item.is_published]
        return AttractionCardSerializer(attractions, many=True, context=self.context).data

    def get_route(self, instance) -> dict | None:
        if instance.route is None or not instance.route.is_published:
            return None
        route = route_card_queryset(Route.objects.filter(pk=instance.route_id)).first()
        return RouteDetailSerializer(route, context=self.context).data if route else None

    def get_guide_profile(self, instance) -> dict | None:
        if instance.guide is None or not instance.guide.is_published:
            return None
        from apps.people.public_api import GuideCardSerializer, guide_card_queryset

        guide = guide_card_queryset().filter(pk=instance.guide_id).first()
        return GuideCardSerializer(guide, context=self.context).data if guide else None

    def get_reviews(self, instance) -> list[dict]:
        from apps.reviews.public_api import PublicReviewSerializer, approved_reviews

        return PublicReviewSerializer(approved_reviews().filter(tour=instance)[:6], many=True, context=self.context).data

    def get_related(self, instance) -> list[dict]:
        queryset = tour_card_queryset(Tour.objects.filter(region=instance.region, is_published=True).exclude(pk=instance.pk))
        return TourCardSerializer(queryset[:3], many=True, context=self.context).data


class CharInFilter(filters.BaseInFilter, filters.CharFilter):
    pass


class TourFilter(filters.FilterSet):
    region = filters.CharFilter(field_name="region__slug")
    destination = filters.CharFilter(field_name="destinations__slug")
    style = filters.CharFilter(field_name="travel_styles__slug")
    season = filters.CharFilter(field_name="seasons__code")
    guide = filters.CharFilter(field_name="guide__slug")
    difficulty = CharInFilter(field_name="difficulty", lookup_expr="in")
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    duration_min = filters.NumberFilter(field_name="duration_days", lookup_expr="gte")
    duration_max = filters.NumberFilter(field_name="duration_days", lookup_expr="lte")
    featured = filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Tour
        fields = ()


class TourViewSet(PublicReadOnlyViewSet):
    serializer_class = TourDetailSerializer
    list_serializer_class = TourCardSerializer
    filterset_class = TourFilter
    search_fields = ("translations__title", "translations__summary", "translations__description")
    ordering_fields = ("price", "duration_days", "position", "rating", "created_at")

    def get_queryset(self):
        queryset = tour_card_queryset()
        if self.action == "retrieve":
            queryset = queryset.select_related("route").prefetch_related(
                *gallery_prefetch(),
                "days__translations",
                "seasons__translations",
                "destinations__translations",
                "destinations__region__translations",
                "destinations__cover__translations",
                "attractions__translations",
                "attractions__region__translations",
                "attractions__cover__translations",
            )
        return queryset.distinct()

    @action(detail=False, methods=["get"], pagination_class=None)
    def facets(self, request):
        values = Tour.objects.filter(is_published=True).aggregate(
            price_min=Min("price"),
            price_max=Max("price"),
            duration_min=Min("duration_days"),
            duration_max=Max("duration_days"),
        )
        return Response(values)


class RouteFilter(filters.FilterSet):
    region = filters.CharFilter(field_name="regions__slug")
    difficulty = CharInFilter(field_name="difficulty", lookup_expr="in")
    featured = filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Route
        fields = ()


class RouteViewSet(PublicReadOnlyViewSet):
    serializer_class = RouteDetailSerializer
    list_serializer_class = RouteCardSerializer
    filterset_class = RouteFilter
    search_fields = ("translations__title", "translations__summary")
    ordering_fields = ("distance_km", "duration_days", "position")

    def get_queryset(self):
        queryset = route_card_queryset()
        if self.action == "retrieve":
            queryset = queryset.prefetch_related("stops__attraction__translations", "stops__attraction__cover__translations")
        return queryset.distinct()

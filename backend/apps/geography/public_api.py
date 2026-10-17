from django.db.models import Count, Q
from django_filters import rest_framework as filters
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.languages import content_languages, resolve_request_language
from apps.core.schema import LANG_PARAMETER, object_response
from apps.core.models import Difficulty
from apps.core.serializers import LocalizedModelSerializer
from apps.core.utils import split_lines
from apps.core.viewsets import PublicReadOnlyViewSet
from apps.media_library.public_api import (
    PublicMediaSerializer,
    gallery_prefetch,
    media_prefetch,
    serialize_gallery,
)

from .models import Attraction, Destination, JourneyScene, Region, Season, TravelStyle

PUBLISHED_TOURS = Q(tours__is_published=True)


class SeasonBriefSerializer(LocalizedModelSerializer):
    class Meta:
        model = Season
        fields = ("code", "months")
        translated = ("name",)


class TravelStyleSerializer(LocalizedModelSerializer):
    class Meta:
        model = TravelStyle
        fields = ("slug", "icon")
        translated = ("name", "description")


class RegionBriefSerializer(LocalizedModelSerializer):
    class Meta:
        model = Region
        fields = ("slug", "map_code", "accent_color")
        translated = ("name",)


class RegionCardSerializer(LocalizedModelSerializer):
    cover = PublicMediaSerializer(read_only=True)
    seasons = SeasonBriefSerializer(many=True, read_only=True)
    names = serializers.SerializerMethodField()
    destinations_count = serializers.IntegerField(read_only=True)
    attractions_count = serializers.IntegerField(read_only=True)
    tours_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Region
        fields = (
            "slug",
            "map_code",
            "accent_color",
            "cover",
            "area_km2",
            "recommended_days_min",
            "recommended_days_max",
            "seasons",
            "names",
            "destinations_count",
            "attractions_count",
            "tours_count",
        )
        translated = ("name", "tagline", "key_places")

    def get_names(self, instance) -> dict[str, str]:
        translations = instance.translations_by_language()
        return {code: getattr(translations.get(code), "name", "") for code in content_languages()}


class AttractionCardSerializer(LocalizedModelSerializer):
    cover = PublicMediaSerializer(read_only=True)
    region = RegionBriefSerializer(read_only=True)

    class Meta:
        model = Attraction
        fields = ("slug", "kind", "cover", "region", "latitude", "longitude", "altitude_m", "is_featured")
        translated = ("name", "tagline")


class DestinationCardSerializer(LocalizedModelSerializer):
    cover = PublicMediaSerializer(read_only=True)
    region = RegionBriefSerializer(read_only=True)
    travel_styles = TravelStyleSerializer(many=True, read_only=True)
    seasons = SeasonBriefSerializer(many=True, read_only=True)
    tours_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Destination
        fields = (
            "slug",
            "cover",
            "region",
            "travel_styles",
            "seasons",
            "latitude",
            "longitude",
            "is_featured",
            "tours_count",
        )
        translated = ("name", "tagline", "summary")


def tour_cards(queryset, context, limit=6):
    from apps.tours.public_api import TourCardSerializer, tour_card_queryset

    tours = tour_card_queryset(queryset.filter(is_published=True))[:limit]
    return TourCardSerializer(tours, many=True, context=context).data


def route_cards(queryset, context, limit=4):
    from apps.tours.public_api import RouteCardSerializer, route_card_queryset

    routes = route_card_queryset(queryset.filter(is_published=True).distinct())[:limit]
    return RouteCardSerializer(routes, many=True, context=context).data


def attraction_queryset():
    return Attraction.objects.select_related("cover", "region").prefetch_related(
        "translations", "region__translations", *media_prefetch("cover")
    )


def destination_queryset():
    return (
        Destination.objects.select_related("cover", "region")
        .prefetch_related(
            "translations",
            "region__translations",
            "travel_styles__translations",
            "seasons__translations",
            *media_prefetch("cover"),
        )
        .annotate(tours_count=Count("tours", filter=PUBLISHED_TOURS, distinct=True))
    )


def region_queryset():
    return (
        Region.objects.select_related("cover")
        .prefetch_related("translations", "seasons__translations", *media_prefetch("cover"))
        .annotate(
            destinations_count=Count("destinations", filter=Q(destinations__is_published=True), distinct=True),
            attractions_count=Count("attractions", filter=Q(attractions__is_published=True), distinct=True),
            tours_count=Count("tours", filter=PUBLISHED_TOURS, distinct=True),
        )
    )


class RegionDetailSerializer(RegionCardSerializer):
    gallery = serializers.SerializerMethodField()
    highlights = serializers.SerializerMethodField()
    attractions = serializers.SerializerMethodField()
    destinations = serializers.SerializerMethodField()
    tours = serializers.SerializerMethodField()
    routes = serializers.SerializerMethodField()

    class Meta(RegionCardSerializer.Meta):
        fields = RegionCardSerializer.Meta.fields + (
            "gallery",
            "highlights",
            "attractions",
            "destinations",
            "tours",
            "routes",
        )
        translated = ("name", "tagline", "description", "nature", "key_places", "seo_title", "seo_description")

    def get_gallery(self, instance) -> list[dict]:
        return serialize_gallery(instance, self.context)

    def get_highlights(self, instance) -> list[str]:
        return split_lines(instance.translated(self.get_language(), ["highlights"])["highlights"])

    def get_attractions(self, instance) -> list[dict]:
        queryset = attraction_queryset().filter(region=instance, is_published=True)
        return AttractionCardSerializer(queryset, many=True, context=self.context).data

    def get_destinations(self, instance) -> list[dict]:
        queryset = destination_queryset().filter(region=instance, is_published=True)
        return DestinationCardSerializer(queryset, many=True, context=self.context).data

    def get_tours(self, instance) -> list[dict]:
        return tour_cards(instance.tours.all(), self.context)

    def get_routes(self, instance) -> list[dict]:
        return route_cards(instance.routes.all(), self.context)


class RegionViewSet(PublicReadOnlyViewSet):
    serializer_class = RegionDetailSerializer
    list_serializer_class = RegionCardSerializer
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        queryset = region_queryset()
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(*gallery_prefetch())
        return queryset.order_by("position", "id")


class DestinationFilter(filters.FilterSet):
    region = filters.CharFilter(field_name="region__slug")
    style = filters.CharFilter(field_name="travel_styles__slug")
    season = filters.CharFilter(field_name="seasons__code")
    featured = filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Destination
        fields = ("region", "style", "season", "featured")


class DestinationDetailSerializer(DestinationCardSerializer):
    gallery = serializers.SerializerMethodField()
    attractions = serializers.SerializerMethodField()
    tours = serializers.SerializerMethodField()
    related = serializers.SerializerMethodField()
    routes = serializers.SerializerMethodField()

    class Meta(DestinationCardSerializer.Meta):
        fields = DestinationCardSerializer.Meta.fields + ("gallery", "attractions", "tours", "related", "routes")
        translated = ("name", "tagline", "summary", "description", "seo_title", "seo_description")

    def get_gallery(self, instance) -> list[dict]:
        return serialize_gallery(instance, self.context)

    def get_attractions(self, instance) -> list[dict]:
        queryset = attraction_queryset().filter(destination=instance, is_published=True)
        return AttractionCardSerializer(queryset, many=True, context=self.context).data

    def get_tours(self, instance) -> list[dict]:
        return tour_cards(instance.tours.all(), self.context)

    def get_related(self, instance) -> list[dict]:
        queryset = destination_queryset().filter(region=instance.region, is_published=True).exclude(pk=instance.pk)[:3]
        return DestinationCardSerializer(queryset, many=True, context=self.context).data

    def get_routes(self, instance) -> list[dict]:
        from apps.tours.models import Route

        attraction_ids = instance.attractions.values_list("pk", flat=True)
        queryset = Route.objects.filter(Q(stops__attraction__in=attraction_ids) | Q(tours__destinations=instance))
        return route_cards(queryset, self.context)


class DestinationViewSet(PublicReadOnlyViewSet):
    serializer_class = DestinationDetailSerializer
    list_serializer_class = DestinationCardSerializer
    filterset_class = DestinationFilter
    search_fields = ("translations__name", "translations__summary", "translations__description")
    ordering_fields = ("position", "created_at")
    ordering = ("position", "id")

    def get_queryset(self):
        queryset = destination_queryset()
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(*gallery_prefetch())
        return queryset.distinct()


class AttractionFilter(filters.FilterSet):
    region = filters.CharFilter(field_name="region__slug")
    destination = filters.CharFilter(field_name="destination__slug")
    season = filters.CharFilter(field_name="seasons__code")
    featured = filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Attraction
        fields = ("region", "destination", "kind", "season", "featured")


class AttractionDetailSerializer(AttractionCardSerializer):
    gallery = serializers.SerializerMethodField()
    destination = serializers.SerializerMethodField()
    seasons = SeasonBriefSerializer(many=True, read_only=True)
    tours = serializers.SerializerMethodField()
    nearby = serializers.SerializerMethodField()
    routes = serializers.SerializerMethodField()

    class Meta(AttractionCardSerializer.Meta):
        fields = AttractionCardSerializer.Meta.fields + ("gallery", "destination", "seasons", "tours", "nearby", "routes")
        translated = ("name", "tagline", "description", "visitor_info", "seo_title", "seo_description")

    def get_gallery(self, instance) -> list[dict]:
        return serialize_gallery(instance, self.context)

    def get_destination(self, instance) -> dict | None:
        if instance.destination is None or not instance.destination.is_published:
            return None
        values = instance.destination.translated(self.get_language(), ["name"])
        return {"slug": instance.destination.slug, **values}

    def get_tours(self, instance) -> list[dict]:
        return tour_cards(instance.tours.all(), self.context)

    def get_nearby(self, instance) -> list[dict]:
        queryset = attraction_queryset().filter(region=instance.region, is_published=True).exclude(pk=instance.pk)[:4]
        return AttractionCardSerializer(queryset, many=True, context=self.context).data

    def get_routes(self, instance) -> list[dict]:
        from apps.tours.models import Route

        return route_cards(Route.objects.filter(stops__attraction=instance), self.context)


class AttractionViewSet(PublicReadOnlyViewSet):
    serializer_class = AttractionDetailSerializer
    list_serializer_class = AttractionCardSerializer
    filterset_class = AttractionFilter
    search_fields = ("translations__name", "translations__description")
    ordering_fields = ("position", "altitude_m", "created_at")
    ordering = ("position", "id")

    def get_queryset(self):
        queryset = attraction_queryset()
        if self.action == "retrieve":
            queryset = queryset.select_related("destination").prefetch_related(
                *gallery_prefetch(), "destination__translations", "seasons__translations"
            )
        return queryset.distinct()


class SeasonSerializer(LocalizedModelSerializer):
    image = PublicMediaSerializer(read_only=True)
    month_numbers = serializers.SerializerMethodField()
    highlights = serializers.SerializerMethodField()
    tours = serializers.SerializerMethodField()

    class Meta:
        model = Season
        fields = ("code", "months", "month_numbers", "image", "highlights", "tours")
        translated = ("name", "description")

    def get_month_numbers(self, instance) -> list[int]:
        return instance.month_numbers()

    def get_highlights(self, instance) -> list[str]:
        return split_lines(instance.translated(self.get_language(), ["highlights"])["highlights"])

    def get_tours(self, instance) -> list[dict]:
        return tour_cards(instance.tours.order_by("-is_featured", "position"), self.context, limit=3)


class SeasonViewSet(PublicReadOnlyViewSet):
    serializer_class = SeasonSerializer
    pagination_class = None
    filter_backends = []
    lookup_field = "code"
    publication_filter = {}

    def get_queryset(self):
        return Season.objects.select_related("image").prefetch_related("translations", *media_prefetch("image"))


class JourneySceneSerializer(LocalizedModelSerializer):
    photo = PublicMediaSerializer(read_only=True)
    terrain = serializers.SerializerMethodField()
    attraction = serializers.SerializerMethodField()
    gallery = serializers.SerializerMethodField()
    routes = serializers.SerializerMethodField()

    class Meta:
        model = JourneyScene
        fields = (
            "slug",
            "photo",
            "sky_color",
            "fog_color",
            "terrain",
            "attraction",
            "gallery",
            "routes",
        )
        translated = ("title", "subtitle", "description", "cta_label")

    def get_terrain(self, instance) -> dict | None:
        if not instance.has_terrain:
            return None
        center = instance.terrain_center()
        return {
            "heightmap": instance.terrain_heightmap.url,
            "texture": PublicMediaSerializer(instance.terrain_texture, context=self.context).data,
            "size_km": instance.terrain_size_km,
            "exaggeration": instance.terrain_exaggeration,
            "heading": instance.camera_heading,
            "motion": instance.camera_motion,
            "latitude": round(center[0], 4) if center else None,
            "longitude": round(center[1], 4) if center else None,
            "min_height": instance.terrain_min_height,
            "max_height": instance.terrain_max_height,
            "captured_on": instance.terrain_captured_on.isoformat() if instance.terrain_captured_on else None,
            "far": self.get_far_terrain(instance),
        }

    def get_far_terrain(self, instance) -> dict | None:
        if not instance.has_far_terrain:
            return None
        return {
            "heightmap": instance.terrain_far_heightmap.url,
            "texture": PublicMediaSerializer(instance.terrain_far_texture, context=self.context).data,
            "size_km": instance.terrain_far_size_km,
        }

    def get_attraction(self, instance) -> dict | None:
        attraction = instance.attraction
        if attraction is None or not attraction.is_published:
            return None
        return {
            "slug": attraction.slug,
            "latitude": attraction.latitude,
            "longitude": attraction.longitude,
            "altitude_m": attraction.altitude_m,
            **attraction.translated(self.get_language(), ["name"]),
            "region": RegionBriefSerializer(attraction.region, context=self.context).data,
        }

    def get_gallery(self, instance) -> list[dict]:
        if instance.attraction is None:
            return []
        return serialize_gallery(instance.attraction, self.context)[:4]

    def get_routes(self, instance) -> list[dict]:
        from apps.tours.models import Route

        if instance.attraction is None:
            return []
        return route_cards(Route.objects.filter(stops__attraction=instance.attraction), self.context, limit=2)


class JourneySceneViewSet(PublicReadOnlyViewSet):
    serializer_class = JourneySceneSerializer
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return (
            JourneyScene.objects.select_related(
                "photo", "attraction__region", "terrain_heightmap", "terrain_texture", "terrain_far_heightmap", "terrain_far_texture"
            )
            .prefetch_related(
                "translations",
                *media_prefetch("photo", "terrain_texture", "terrain_far_texture"),
                "attraction__translations",
                "attraction__region__translations",
                *gallery_prefetch("attraction__gallery_items"),
            )
            .order_by("position", "id")
        )


class TaxonomyView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_read"

    @object_response(LANG_PARAMETER, summary="Filter taxonomies")
    def get(self, request):
        from apps.people.models import SpokenLanguage

        context = {"request": request, "language": resolve_request_language(request)}
        language = context["language"]
        regions = Region.objects.filter(is_published=True).prefetch_related("translations").order_by("position")
        styles = TravelStyle.objects.prefetch_related("translations")
        seasons = Season.objects.prefetch_related("translations")
        languages = SpokenLanguage.objects.prefetch_related("translations")
        return Response(
            {
                "regions": RegionBriefSerializer(regions, many=True, context=context).data,
                "travel_styles": TravelStyleSerializer(styles, many=True, context=context).data,
                "seasons": SeasonBriefSerializer(seasons, many=True, context=context).data,
                "languages": [{"code": item.code, **item.translated(language, ["name"])} for item in languages],
                "difficulties": [value for value, _ in Difficulty.choices],
                "attraction_kinds": [value for value, _ in Attraction.Kind.choices],
            }
        )


from django.db.models import Avg, Count, Q
from django_filters import rest_framework as filters
from rest_framework import serializers
from rest_framework.response import Response

from apps.core.schema import LANG_PARAMETER, object_response
from apps.core.serializers import LocalizedModelSerializer
from apps.core.utils import split_lines
from apps.core.viewsets import PublicReadOnlyViewSet
from apps.geography.public_api import RegionBriefSerializer, TravelStyleSerializer
from apps.media_library.public_api import PublicMediaSerializer, media_prefetch
from apps.site_content.public_api import PublicAPIView

from .models import FounderProfile, Guide, SpokenLanguage, TeamMember

APPROVED_REVIEWS = Q(reviews__status="approved")


class SpokenLanguageSerializer(LocalizedModelSerializer):
    class Meta:
        model = SpokenLanguage
        fields = ("code",)
        translated = ("name",)


def guide_card_queryset():
    return (
        Guide.objects.select_related("photo")
        .prefetch_related(
            "translations",
            "languages__translations",
            "regions__translations",
            "travel_styles__translations",
            *media_prefetch("photo"),
        )
        .annotate(
            rating=Avg("reviews__rating", filter=APPROVED_REVIEWS),
            reviews_count=Count("reviews", filter=APPROVED_REVIEWS, distinct=True),
            tours_count=Count("tours", filter=Q(tours__is_published=True), distinct=True),
        )
        .order_by("-is_featured", "position", "id")
    )


class GuideCardSerializer(LocalizedModelSerializer):
    photo = PublicMediaSerializer(read_only=True)
    languages = SpokenLanguageSerializer(many=True, read_only=True)
    regions = RegionBriefSerializer(many=True, read_only=True)
    travel_styles = TravelStyleSerializer(many=True, read_only=True)
    rating = serializers.SerializerMethodField()
    reviews_count = serializers.IntegerField(read_only=True, default=0)
    tours_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Guide
        fields = (
            "slug",
            "photo",
            "languages",
            "regions",
            "travel_styles",
            "experience_years",
            "is_featured",
            "rating",
            "reviews_count",
            "tours_count",
        )
        translated = ("name", "headline", "quote")

    def get_rating(self, instance) -> float | None:
        value = getattr(instance, "rating", None)
        return round(value, 1) if value else None


class GuideDetailSerializer(GuideCardSerializer):
    specialization = serializers.SerializerMethodField()
    tours = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()

    class Meta(GuideCardSerializer.Meta):
        fields = GuideCardSerializer.Meta.fields + ("specialization", "tours", "reviews")
        translated = ("name", "headline", "quote", "bio", "seo_title", "seo_description")

    def get_specialization(self, instance) -> list[str]:
        return split_lines(instance.translated(self.get_language(), ["specialization"])["specialization"])

    def get_tours(self, instance) -> list[dict]:
        from apps.tours.public_api import TourCardSerializer, tour_card_queryset

        queryset = tour_card_queryset(instance.tours.filter(is_published=True))
        return TourCardSerializer(queryset, many=True, context=self.context).data

    def get_reviews(self, instance) -> list[dict]:
        from apps.reviews.public_api import PublicReviewSerializer, approved_reviews

        queryset = approved_reviews().filter(Q(guide=instance) | Q(tour__guide=instance)).distinct()[:6]
        return PublicReviewSerializer(queryset, many=True, context=self.context).data


class GuideFilter(filters.FilterSet):
    language = filters.CharFilter(field_name="languages__code")
    region = filters.CharFilter(field_name="regions__slug")
    style = filters.CharFilter(field_name="travel_styles__slug")
    featured = filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Guide
        fields = ()


class GuideViewSet(PublicReadOnlyViewSet):
    serializer_class = GuideDetailSerializer
    list_serializer_class = GuideCardSerializer
    filterset_class = GuideFilter
    search_fields = ("translations__name", "translations__headline", "translations__specialization")
    ordering_fields = ("experience_years", "position", "rating")

    def get_queryset(self):
        return guide_card_queryset().distinct()


class TeamMemberSerializer(LocalizedModelSerializer):
    photo = PublicMediaSerializer(read_only=True)

    class Meta:
        model = TeamMember
        fields = ("id", "photo", "email")
        translated = ("name", "role", "bio")


class TeamMemberViewSet(PublicReadOnlyViewSet):
    serializer_class = TeamMemberSerializer
    pagination_class = None
    filter_backends = []
    lookup_field = "pk"

    def get_queryset(self):
        return TeamMember.objects.select_related("photo").prefetch_related("translations", *media_prefetch("photo"))


class FounderView(PublicAPIView):
    @object_response(LANG_PARAMETER, summary="Founder profile")
    def get(self, request):
        founder = FounderProfile.objects.select_related("photo", "guide").prefetch_related(
            "translations", *media_prefetch("photo")
        ).first()
        if founder is None or not founder.is_visible:
            return Response(None)
        context = self.get_context(request)
        guide = founder.guide if founder.guide and founder.guide.is_published else None
        return Response(
            {
                "photo": PublicMediaSerializer(founder.photo, context=context).data if founder.photo else None,
                "experience_years": founder.experience_years,
                "guide_slug": guide.slug if guide else None,
                **founder.translated(context["language"]),
            }
        )

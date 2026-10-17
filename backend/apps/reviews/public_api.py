from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import serializers

from apps.core.languages import content_languages
from apps.core.serializers import LocalizedModelSerializer
from apps.core.translation import save_translations
from apps.core.viewsets import PublicCreateView, PublicReadOnlyViewSet
from apps.media_library.public_api import PublicMediaSerializer, media_prefetch
from apps.people.models import Guide
from apps.tours.models import Tour

from .models import Review


def approved_reviews():
    return (
        Review.objects.filter(status=Review.Status.APPROVED)
        .select_related("avatar", "tour", "guide")
        .prefetch_related("translations", "tour__translations", "guide__translations", *media_prefetch("avatar"))
        .order_by("position", "-created_at")
    )


class PublicReviewSerializer(LocalizedModelSerializer):
    avatar = PublicMediaSerializer(read_only=True)
    tour = serializers.SerializerMethodField()
    guide = serializers.SerializerMethodField()
    is_translated = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id",
            "author_name",
            "author_country",
            "avatar",
            "rating",
            "travel_date",
            "original_language",
            "is_featured",
            "created_at",
            "tour",
            "guide",
            "is_translated",
        )
        translated = ("title", "text")

    def get_tour(self, instance) -> dict | None:
        if instance.tour is None or not instance.tour.is_published:
            return None
        return {"slug": instance.tour.slug, **instance.tour.translated(self.get_language(), ["title"])}

    def get_guide(self, instance) -> dict | None:
        if instance.guide is None or not instance.guide.is_published:
            return None
        return {"slug": instance.guide.slug, **instance.guide.translated(self.get_language(), ["name"])}

    def get_is_translated(self, instance) -> bool:
        return self.get_language() != instance.original_language


class ReviewFilter(filters.FilterSet):
    tour = filters.CharFilter(field_name="tour__slug")
    guide = filters.CharFilter(field_name="guide__slug")
    featured = filters.BooleanFilter(field_name="is_featured")
    rating = filters.NumberFilter(field_name="rating", lookup_expr="gte")

    class Meta:
        model = Review
        fields = ()


class ReviewViewSet(PublicReadOnlyViewSet):
    serializer_class = PublicReviewSerializer
    filterset_class = ReviewFilter
    lookup_field = "pk"
    publication_filter = {"status": Review.Status.APPROVED}
    ordering_fields = ("created_at", "rating", "position")

    def get_queryset(self):
        return approved_reviews()


class ReviewSubmissionSerializer(serializers.ModelSerializer):
    tour = serializers.SlugRelatedField(
        slug_field="slug", queryset=Tour.objects.filter(is_published=True), required=False, allow_null=True
    )
    guide = serializers.SlugRelatedField(
        slug_field="slug", queryset=Guide.objects.filter(is_published=True), required=False, allow_null=True
    )
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    text = serializers.CharField(min_length=20, max_length=3000)
    consent = serializers.BooleanField()

    class Meta:
        model = Review
        fields = ("author_name", "author_country", "author_email", "rating", "tour", "guide", "travel_date", "title", "text", "consent")
        extra_kwargs = {"author_email": {"required": True, "allow_blank": False}}

    def validate_consent(self, value):
        if not value:
            raise serializers.ValidationError("Please accept the privacy policy.")
        return value

    def validate_travel_date(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError("The travel date cannot be in the future.")
        return value

    def create(self, validated_data):
        language = validated_data.pop("language", "en")
        validated_data.pop("consent")
        title = validated_data.pop("title", "")
        text = validated_data.pop("text")
        review = Review.objects.create(
            **validated_data,
            original_language=language if language in content_languages() else "en",
            status=Review.Status.PENDING,
        )
        save_translations(review, {review.original_language: {"title": title, "text": text}})
        return review


class ReviewSubmissionView(PublicCreateView):
    serializer_class = ReviewSubmissionSerializer

    def build_response(self, instance):
        return {"status": "pending_moderation", "id": instance.pk}

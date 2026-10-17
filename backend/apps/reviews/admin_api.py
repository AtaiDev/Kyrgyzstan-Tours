from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.admin_fields import READ_ONLY_TIMESTAMPS, TRANSLATABLE_META_FIELDS
from apps.core.serializers import TranslatableAdminSerializer
from apps.core.viewsets import AdminModelViewSet
from apps.media_library.fields import MediaAssetField

from .models import Review


class ReviewAdminSerializer(TranslatableAdminSerializer):
    avatar = MediaAssetField()

    class Meta:
        model = Review
        fields = (
            "id",
            "status",
            "author_name",
            "author_country",
            "author_email",
            "avatar",
            "rating",
            "tour",
            "guide",
            "travel_date",
            "original_language",
            "is_featured",
            "is_demo",
            "position",
            *TRANSLATABLE_META_FIELDS,
        )
        read_only_fields = READ_ONLY_TIMESTAMPS


class ReviewStatusSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False, max_length=500)
    status = serializers.ChoiceField(choices=Review.Status.choices)


class ReviewAdminViewSet(AdminModelViewSet):
    queryset = Review.objects.select_related("avatar", "tour", "guide").prefetch_related(
        "translations", "avatar__translations"
    )
    serializer_class = ReviewAdminSerializer
    filterset_fields = ("status", "rating", "tour", "guide", "original_language")
    search_fields = ("author_name", "author_country", "author_email", "translations__text", "translations__title")
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "rating", "position", "status")
    boolean_filter_fields = ("is_featured", "is_demo")

    @action(detail=False, methods=["post"], serializer_class=ReviewStatusSerializer)
    def set_status(self, request):
        serializer = ReviewStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = Review.objects.filter(pk__in=serializer.validated_data["ids"]).update(
            status=serializer.validated_data["status"]
        )
        return Response({"updated": updated})

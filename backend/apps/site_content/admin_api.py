from django.db import transaction
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsStaffUser
from apps.core.schema import object_response
from apps.core.serializers import NestedTranslatableSerializer, TranslatableAdminSerializer, replace_nested_items
from apps.core.viewsets import AdminModelViewSet, SingletonAdminView
from apps.media_library.fields import MediaAssetField
from apps.media_library.models import MediaAsset

from .coverage import translation_coverage
from .models import FaqItem, InterfaceString, PageSection, SectionItem, SeoPage, SiteSettings, StaticPage, VisualSettings
from .sections import SECTION_KEYS


class SiteSettingsAdminSerializer(TranslatableAdminSerializer):
    logo = MediaAssetField()
    default_og_image = MediaAssetField()

    class Meta:
        model = SiteSettings
        fields = (
            "site_name",
            "logo",
            "default_og_image",
            "default_language",
            "email",
            "phone",
            "whatsapp",
            "telegram",
            "instagram_url",
            "facebook_url",
            "youtube_url",
            "office_latitude",
            "office_longitude",
            "updated_at",
            "translations",
            "display_name",
            "missing_translations",
        )
        read_only_fields = ("updated_at",)


class SiteSettingsAdminView(SingletonAdminView):
    model = SiteSettings
    serializer_class = SiteSettingsAdminSerializer


class VisualSettingsAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualSettings
        exclude = ("id", "created_at")
        read_only_fields = ("updated_at",)


class VisualSettingsAdminView(SingletonAdminView):
    model = VisualSettings
    serializer_class = VisualSettingsAdminSerializer


class SectionItemAdminSerializer(NestedTranslatableSerializer):
    image = MediaAssetField()

    class Meta:
        model = SectionItem
        fields = ("id", "is_visible", "icon", "image", "link", "value", "translations")
        read_only_fields = ("id",)


class PageSectionAdminSerializer(TranslatableAdminSerializer):
    background = MediaAssetField()
    background_video = MediaAssetField(kind=MediaAsset.Kind.VIDEO)
    background_video_light = MediaAssetField(kind=MediaAsset.Kind.VIDEO)
    items = SectionItemAdminSerializer(many=True, required=False)
    nested_fields = ("items",)

    class Meta:
        model = PageSection
        fields = (
            "id",
            "page",
            "key",
            "position",
            "is_visible",
            "animate",
            "background",
            "background_video",
            "background_video_light",
            "primary_link",
            "secondary_link",
            "items_limit",
            "items",
            "updated_at",
            "translations",
            "display_name",
            "missing_translations",
        )
        read_only_fields = ("updated_at",)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        page = attrs.get("page", getattr(self.instance, "page", PageSection.Page.HOME))
        key = attrs.get("key", getattr(self.instance, "key", None))
        if key not in SECTION_KEYS.get(page, ()):
            raise serializers.ValidationError({"key": [f"Unknown section key for page “{page}”."]})
        return attrs

    def save_nested(self, instance, name, items):
        replace_nested_items(instance, "items", items)


class PageSectionAdminViewSet(AdminModelViewSet):
    queryset = PageSection.objects.select_related("background", "background_video", "background_video_light").prefetch_related(
        "translations",
        "background__translations",
        "items__translations",
        "items__image__translations",
    )
    serializer_class = PageSectionAdminSerializer
    filterset_fields = ("page", "is_visible")
    search_fields = ("key", "translations__title")
    ordering = ("page", "position", "id")

    @action(detail=False, methods=["get"], pagination_class=None)
    def keys(self, request):
        return Response(SECTION_KEYS)


class SeoPageAdminSerializer(TranslatableAdminSerializer):
    og_image = MediaAssetField()

    class Meta:
        model = SeoPage
        fields = ("id", "key", "og_image", "no_index", "updated_at", "translations", "display_name", "missing_translations")
        read_only_fields = ("updated_at",)


class SeoPageAdminViewSet(AdminModelViewSet):
    queryset = SeoPage.objects.select_related("og_image").prefetch_related("translations", "og_image__translations")
    serializer_class = SeoPageAdminSerializer
    search_fields = ("key", "translations__title", "translations__description")
    ordering = ("key",)
    ordering_fields = ("key", "updated_at")


class StaticPageAdminSerializer(TranslatableAdminSerializer):
    class Meta:
        model = StaticPage
        fields = ("id", "slug", "is_published", "updated_at", "translations", "display_name", "missing_translations")
        read_only_fields = ("updated_at",)


class StaticPageAdminViewSet(AdminModelViewSet):
    queryset = StaticPage.objects.prefetch_related("translations")
    serializer_class = StaticPageAdminSerializer
    search_fields = ("slug", "translations__title")
    ordering = ("slug",)
    ordering_fields = ("slug", "updated_at")
    boolean_filter_fields = ("is_published",)


class FaqItemAdminSerializer(TranslatableAdminSerializer):
    class Meta:
        model = FaqItem
        fields = (
            "id",
            "category",
            "is_published",
            "position",
            "is_demo",
            "updated_at",
            "translations",
            "display_name",
            "missing_translations",
        )
        read_only_fields = ("updated_at",)


class FaqItemAdminViewSet(AdminModelViewSet):
    queryset = FaqItem.objects.prefetch_related("translations")
    serializer_class = FaqItemAdminSerializer
    filterset_fields = ("category",)
    search_fields = ("translations__question", "translations__answer")
    boolean_filter_fields = ("is_published",)


class InterfaceStringSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterfaceString
        fields = ("id", "key", "value_ru", "value_en", "value_ky", "updated_at")
        read_only_fields = ("updated_at",)


class InterfaceStringBulkSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField(allow_blank=True, max_length=4000)), max_length=2000
    )


class InterfaceStringAdminViewSet(AdminModelViewSet):
    queryset = InterfaceString.objects.all()
    serializer_class = InterfaceStringSerializer
    pagination_class = None
    search_fields = ("key", "value_ru", "value_en", "value_ky")
    ordering = ("key",)
    ordering_fields = ("key", "updated_at")

    @action(detail=False, methods=["post"], serializer_class=InterfaceStringBulkSerializer)
    def bulk_upsert(self, request):
        serializer = InterfaceStringBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved = 0
        removed = 0
        with transaction.atomic():
            for item in serializer.validated_data["items"]:
                key = (item.get("key") or "").strip()
                if not key or len(key) > 150:
                    continue
                values = {f"value_{code}": item.get(f"value_{code}", "").strip() for code in ("ru", "en", "ky")}
                if not any(values.values()):
                    removed += InterfaceString.objects.filter(key=key).delete()[0]
                    continue
                InterfaceString.objects.update_or_create(key=key, defaults=values)
                saved += 1
        return Response({"saved": saved, "removed": removed})


class TranslationCoverageView(APIView):
    permission_classes = [IsStaffUser]

    @object_response(summary="Translation coverage by content type")
    def get(self, request):
        return Response(translation_coverage(request.user))


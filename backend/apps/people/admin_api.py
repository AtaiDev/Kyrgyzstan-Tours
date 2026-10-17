from apps.core.admin_fields import CONTENT_META_FIELDS, READ_ONLY_TIMESTAMPS, TRANSLATABLE_META_FIELDS
from apps.core.serializers import TranslatableAdminSerializer
from apps.core.viewsets import AdminModelViewSet, SingletonAdminView
from apps.media_library.fields import MediaAssetField

from .models import FounderProfile, Guide, SpokenLanguage, TeamMember


class SpokenLanguageAdminSerializer(TranslatableAdminSerializer):
    class Meta:
        model = SpokenLanguage
        fields = ("id", "code", "position", *TRANSLATABLE_META_FIELDS)
        read_only_fields = READ_ONLY_TIMESTAMPS


class SpokenLanguageAdminViewSet(AdminModelViewSet):
    queryset = SpokenLanguage.objects.prefetch_related("translations")
    serializer_class = SpokenLanguageAdminSerializer
    search_fields = ("code", "translations__name")


class GuideAdminSerializer(TranslatableAdminSerializer):
    photo = MediaAssetField()

    class Meta:
        model = Guide
        fields = (
            "id",
            "slug",
            "photo",
            "languages",
            "regions",
            "travel_styles",
            "experience_years",
            "email",
            "phone",
            "is_featured",
            *CONTENT_META_FIELDS,
        )
        read_only_fields = READ_ONLY_TIMESTAMPS


class GuideAdminViewSet(AdminModelViewSet):
    queryset = Guide.objects.select_related("photo").prefetch_related(
        "translations", "languages", "regions", "travel_styles", "photo__translations"
    )
    serializer_class = GuideAdminSerializer
    filterset_fields = ("languages", "regions")
    search_fields = ("slug", "email", "translations__name", "translations__headline")
    ordering_fields = ("position", "experience_years", "created_at", "updated_at", "id")
    boolean_filter_fields = ("is_published", "is_featured", "is_demo")


class TeamMemberAdminSerializer(TranslatableAdminSerializer):
    photo = MediaAssetField()

    class Meta:
        model = TeamMember
        fields = ("id", "photo", "email", *CONTENT_META_FIELDS)
        read_only_fields = READ_ONLY_TIMESTAMPS


class TeamMemberAdminViewSet(AdminModelViewSet):
    queryset = TeamMember.objects.select_related("photo").prefetch_related("translations", "photo__translations")
    serializer_class = TeamMemberAdminSerializer
    search_fields = ("email", "translations__name", "translations__role")
    boolean_filter_fields = ("is_published", "is_demo")


class FounderProfileAdminSerializer(TranslatableAdminSerializer):
    photo = MediaAssetField()

    class Meta:
        model = FounderProfile
        fields = (
            "guide",
            "photo",
            "experience_years",
            "is_visible",
            "is_demo",
            "updated_at",
            "translations",
            "display_name",
            "missing_translations",
        )
        read_only_fields = ("updated_at",)


class FounderProfileAdminView(SingletonAdminView):
    model = FounderProfile
    serializer_class = FounderProfileAdminSerializer

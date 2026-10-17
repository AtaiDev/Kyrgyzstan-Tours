from apps.core.admin_fields import READ_ONLY_TIMESTAMPS, TRANSLATABLE_META_FIELDS
from apps.core.serializers import TranslatableAdminSerializer
from apps.core.viewsets import AdminModelViewSet
from apps.media_library.fields import MediaAssetField

from .models import Article, ArticleCategory


class ArticleCategoryAdminSerializer(TranslatableAdminSerializer):
    class Meta:
        model = ArticleCategory
        fields = ("id", "slug", "position", *TRANSLATABLE_META_FIELDS)
        read_only_fields = READ_ONLY_TIMESTAMPS


class ArticleCategoryAdminViewSet(AdminModelViewSet):
    queryset = ArticleCategory.objects.prefetch_related("translations")
    serializer_class = ArticleCategoryAdminSerializer
    search_fields = ("slug", "translations__name")


class ArticleAdminSerializer(TranslatableAdminSerializer):
    cover = MediaAssetField()

    class Meta:
        model = Article
        fields = (
            "id",
            "slug",
            "category",
            "cover",
            "author",
            "status",
            "published_at",
            "is_featured",
            "is_demo",
            "reading_minutes",
            "related_tours",
            *TRANSLATABLE_META_FIELDS,
        )
        read_only_fields = ("reading_minutes", *READ_ONLY_TIMESTAMPS)

    def save_related_payload(self, instance, payload):
        super().save_related_payload(instance, payload)
        instance.update_reading_time()


class ArticleAdminViewSet(AdminModelViewSet):
    queryset = Article.objects.select_related("cover", "category", "author").prefetch_related(
        "translations", "related_tours", "cover__translations"
    )
    serializer_class = ArticleAdminSerializer
    filterset_fields = ("status", "category", "author")
    search_fields = ("slug", "translations__title", "translations__excerpt")
    ordering = ("-published_at", "-id")
    ordering_fields = ("published_at", "created_at", "updated_at", "id")
    boolean_filter_fields = ("is_featured", "is_demo")

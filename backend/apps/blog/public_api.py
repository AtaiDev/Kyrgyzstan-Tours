from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import serializers

from apps.core.serializers import LocalizedModelSerializer
from apps.core.viewsets import PublicReadOnlyViewSet
from apps.media_library.public_api import PublicMediaSerializer, media_prefetch

from .models import Article, ArticleCategory


class ArticleCategorySerializer(LocalizedModelSerializer):
    articles_count = serializers.SerializerMethodField()

    class Meta:
        model = ArticleCategory
        fields = ("slug", "articles_count")
        translated = ("name", "description")

    def get_articles_count(self, instance) -> int | None:
        return getattr(instance, "articles_count", None)


def published_articles():
    return (
        Article.objects.filter(status=Article.Status.PUBLISHED, published_at__lte=timezone.now())
        .select_related("cover", "category", "author__photo")
        .prefetch_related(
            "translations",
            "category__translations",
            "author__translations",
            *media_prefetch("cover", "author__photo"),
        )
    )


class ArticleCardSerializer(LocalizedModelSerializer):
    cover = PublicMediaSerializer(read_only=True)
    category = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ("slug", "cover", "category", "author", "published_at", "reading_minutes", "is_featured")
        translated = ("title", "excerpt")

    def get_category(self, instance) -> dict | None:
        if instance.category is None:
            return None
        return {"slug": instance.category.slug, **instance.category.translated(self.get_language(), ["name"])}

    def get_author(self, instance) -> dict | None:
        if instance.author is None or not instance.author.is_published:
            return None
        return {
            "photo": PublicMediaSerializer(instance.author.photo, context=self.context).data if instance.author.photo else None,
            **instance.author.translated(self.get_language(), ["name", "role"]),
        }


class ArticleDetailSerializer(ArticleCardSerializer):
    related = serializers.SerializerMethodField()
    tours = serializers.SerializerMethodField()

    class Meta(ArticleCardSerializer.Meta):
        fields = ArticleCardSerializer.Meta.fields + ("related", "tours")
        translated = ("title", "excerpt", "body", "seo_title", "seo_description")

    def get_related(self, instance) -> list[dict]:
        queryset = published_articles().exclude(pk=instance.pk)
        if instance.category_id:
            queryset = queryset.filter(category_id=instance.category_id)
        return ArticleCardSerializer(queryset[:3], many=True, context=self.context).data

    def get_tours(self, instance) -> list[dict]:
        from apps.tours.public_api import TourCardSerializer, tour_card_queryset

        queryset = tour_card_queryset(instance.related_tours.filter(is_published=True))[:3]
        return TourCardSerializer(queryset, many=True, context=self.context).data


class ArticleFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category__slug")
    featured = filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Article
        fields = ()


class ArticleViewSet(PublicReadOnlyViewSet):
    serializer_class = ArticleDetailSerializer
    list_serializer_class = ArticleCardSerializer
    filterset_class = ArticleFilter
    search_fields = ("translations__title", "translations__excerpt", "translations__body")
    ordering_fields = ("published_at",)
    ordering = ("-published_at", "-id")
    publication_filter = {}

    def get_queryset(self):
        if self.action == "retrieve" and self.is_preview():
            return Article.objects.select_related("cover", "category", "author__photo").prefetch_related(
                "translations", "category__translations", "author__translations", *media_prefetch("cover", "author__photo")
            )
        return published_articles()


class ArticleCategoryViewSet(PublicReadOnlyViewSet):
    serializer_class = ArticleCategorySerializer
    pagination_class = None
    filter_backends = []
    publication_filter = {}

    def get_queryset(self):
        from django.db.models import Count, Q

        published = Q(articles__status=Article.Status.PUBLISHED, articles__published_at__lte=timezone.now())
        return ArticleCategory.objects.prefetch_related("translations").annotate(
            articles_count=Count("articles", filter=published, distinct=True)
        )

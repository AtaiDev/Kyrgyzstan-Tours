from django.db.models import Avg, Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.languages import resolve_request_language
from apps.core.schema import LANG_PARAMETER, object_response
from apps.core.serializers import LocalizedModelSerializer
from apps.core.viewsets import PublicReadOnlyViewSet
from apps.media_library.public_api import PublicMediaSerializer, media_prefetch, serialize_media

from .models import FaqItem, InterfaceString, PageSection, SectionItem, SeoPage, SiteSettings, StaticPage, VisualSettings


class PublicAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_read"

    def get_context(self, request):
        return {"request": request, "language": resolve_request_language(request)}


class VisualSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualSettings
        exclude = ("id", "created_at", "updated_at")


def collect_stats():
    from apps.geography.models import Attraction, Destination, Region
    from apps.people.models import Guide
    from apps.reviews.models import Review
    from apps.tours.models import Route, Tour

    approved = Review.objects.filter(status=Review.Status.APPROVED)
    average = approved.aggregate(value=Avg("rating"))["value"]
    return {
        "regions": Region.objects.filter(is_published=True).count(),
        "destinations": Destination.objects.filter(is_published=True).count(),
        "attractions": Attraction.objects.filter(is_published=True).count(),
        "tours": Tour.objects.filter(is_published=True).count(),
        "routes": Route.objects.filter(is_published=True).count(),
        "guides": Guide.objects.filter(is_published=True).count(),
        "reviews": approved.count(),
        "average_rating": round(average, 2) if average else None,
    }


class SiteView(PublicAPIView):
    @object_response(LANG_PARAMETER, summary="Site settings, contacts, visual settings, SEO and statistics")
    def get(self, request):
        context = self.get_context(request)
        language = context["language"]
        site = SiteSettings.objects.prefetch_related("translations").get_or_create(pk=1)[0]
        seo_pages = SeoPage.objects.prefetch_related("translations", "og_image__translations").select_related("og_image")
        return Response(
            {
                "language": language,
                "site_name": site.site_name,
                "logo": serialize_media(site.logo, context),
                "default_og_image": serialize_media(site.default_og_image, context),
                "default_language": site.default_language,
                **site.translated(language),
                "contacts": {
                    "email": site.email,
                    "phone": site.phone,
                    "whatsapp": site.whatsapp,
                    "telegram": site.telegram,
                    "instagram_url": site.instagram_url,
                    "facebook_url": site.facebook_url,
                    "youtube_url": site.youtube_url,
                    "office_latitude": site.office_latitude,
                    "office_longitude": site.office_longitude,
                },
                "visual": VisualSettingsSerializer(VisualSettings.load()).data,
                "seo": {
                    page.key: {
                        **page.translated(language),
                        "no_index": page.no_index,
                        "og_image": serialize_media(page.og_image, context),
                    }
                    for page in seo_pages
                },
                "stats": collect_stats(),
            }
        )


class InterfaceStringsView(PublicAPIView):
    @object_response(LANG_PARAMETER, summary="Interface string overrides for a language")
    def get(self, request):
        language = resolve_request_language(request)
        column = f"value_{language}"
        strings = {
            key: value
            for key, value in InterfaceString.objects.exclude(**{column: ""}).values_list("key", column)
        }
        return Response({"language": language, "strings": strings})


class PublicSectionItemSerializer(LocalizedModelSerializer):
    image = PublicMediaSerializer(read_only=True)

    class Meta:
        model = SectionItem
        fields = ("id", "icon", "image", "link", "value")


class PublicSectionSerializer(LocalizedModelSerializer):
    background = PublicMediaSerializer(read_only=True)
    background_video = PublicMediaSerializer(read_only=True)
    background_video_light = PublicMediaSerializer(read_only=True)
    items = serializers.SerializerMethodField()

    class Meta:
        model = PageSection
        fields = (
            "key",
            "position",
            "background",
            "background_video",
            "background_video_light",
            "primary_link",
            "secondary_link",
            "items_limit",
            "animate",
            "items",
        )

    def get_items(self, instance) -> list[dict]:
        visible = [item for item in instance.items.all() if item.is_visible]
        return PublicSectionItemSerializer(visible, many=True, context=self.context).data


class PageSectionsView(PublicAPIView):
    @object_response(LANG_PARAMETER, summary="Visible sections of a page")
    def get(self, request, page):
        if page not in PageSection.Page.values:
            return Response({"detail": "Unknown page."}, status=404)
        sections = (
            PageSection.objects.filter(page=page, is_visible=True)
            .select_related("background", "background_video", "background_video_light")
            .prefetch_related(
                "translations",
                *media_prefetch("background", "background_video", "background_video_light"),
                "items__translations",
                "items__image__translations",
            )
            .order_by("position", "id")
        )
        context = self.get_context(request)
        return Response({"page": page, "sections": PublicSectionSerializer(sections, many=True, context=context).data})


class PublicStaticPageSerializer(LocalizedModelSerializer):
    class Meta:
        model = StaticPage
        fields = ("slug", "updated_at")


class StaticPageViewSet(PublicReadOnlyViewSet):
    serializer_class = PublicStaticPageSerializer
    queryset = StaticPage.objects.prefetch_related("translations")
    pagination_class = None
    filter_backends = []


class PublicFaqSerializer(LocalizedModelSerializer):
    class Meta:
        model = FaqItem
        fields = ("id", "category")


class FaqViewSet(PublicReadOnlyViewSet):
    serializer_class = PublicFaqSerializer
    queryset = FaqItem.objects.prefetch_related("translations")
    pagination_class = None
    lookup_field = "pk"
    filterset_fields = ("category",)
    search_fields = ("translations__question", "translations__answer")


class SearchView(PublicAPIView):
    limit = 5

    @object_response(LANG_PARAMETER, OpenApiParameter("q", OpenApiTypes.STR, required=True), summary="Quick search")
    def get(self, request):
        from apps.geography.models import Attraction, Destination, Region
        from apps.people.models import Guide
        from apps.tours.models import Tour

        query = (request.query_params.get("q") or "").strip()
        context = self.get_context(request)
        language = context["language"]
        if len(query) < 2:
            return Response({"query": query, "results": {}})

        def collect(model, fields, title_field, extra=None):
            condition = Q()
            for field in fields:
                condition |= Q(**{f"translations__{field}__icontains": query})
            queryset = (
                model.objects.filter(is_published=True)
                .filter(condition)
                .select_related("cover" if hasattr(model, "cover") else "photo")
                .prefetch_related("translations", *media_prefetch("cover" if hasattr(model, "cover") else "photo"))
                .distinct()[: self.limit]
            )
            results = []
            for item in queryset:
                image = getattr(item, "cover", None) if hasattr(model, "cover") else getattr(item, "photo", None)
                values = item.translated(language, [title_field])
                results.append(
                    {
                        "slug": item.slug,
                        "title": values[title_field],
                        "image": image.thumbnail_url if image else None,
                        **(extra(item) if extra else {}),
                    }
                )
            return results

        return Response(
            {
                "query": query,
                "results": {
                    "regions": collect(Region, ("name", "description"), "name"),
                    "destinations": collect(Destination, ("name", "summary"), "name"),
                    "attractions": collect(Attraction, ("name", "description"), "name"),
                    "tours": collect(
                        Tour,
                        ("title", "summary"),
                        "title",
                        lambda tour: {"price": str(tour.price), "currency": tour.currency, "duration_days": tour.duration_days},
                    ),
                    "guides": collect(Guide, ("name", "headline", "specialization"), "name"),
                },
            }
        )


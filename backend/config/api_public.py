from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.blog.public_api import ArticleCategoryViewSet, ArticleViewSet
from apps.geography.public_api import (
    AttractionViewSet,
    DestinationViewSet,
    JourneySceneViewSet,
    RegionViewSet,
    SeasonViewSet,
    TaxonomyView,
)
from apps.inquiries.public_api import BookingRequestView, ContactMessageView, NewsletterSubscribeView
from apps.media_library.public_api import MediaCreditViewSet
from apps.people.public_api import FounderView, GuideViewSet, TeamMemberViewSet
from apps.reviews.public_api import ReviewSubmissionView, ReviewViewSet
from apps.site_content.public_api import (
    FaqViewSet,
    InterfaceStringsView,
    PageSectionsView,
    SearchView,
    SiteView,
    StaticPageViewSet,
)
from apps.tours.public_api import RouteViewSet, TourViewSet

router = DefaultRouter(trailing_slash=True)
router.include_root_view = False
router.register("regions", RegionViewSet, basename="public-region")
router.register("destinations", DestinationViewSet, basename="public-destination")
router.register("attractions", AttractionViewSet, basename="public-attraction")
router.register("seasons", SeasonViewSet, basename="public-season")
router.register("scenes", JourneySceneViewSet, basename="public-scene")
router.register("tours", TourViewSet, basename="public-tour")
router.register("routes", RouteViewSet, basename="public-route")
router.register("guides", GuideViewSet, basename="public-guide")
router.register("team", TeamMemberViewSet, basename="public-team")
router.register("reviews", ReviewViewSet, basename="public-review")
router.register("articles", ArticleViewSet, basename="public-article")
router.register("article-categories", ArticleCategoryViewSet, basename="public-article-category")
router.register("faq", FaqViewSet, basename="public-faq")
router.register("pages", StaticPageViewSet, basename="public-static-page")
router.register("media-credits", MediaCreditViewSet, basename="public-media-credit")

urlpatterns = [
    path("site/", SiteView.as_view(), name="public-site"),
    path("interface-strings/", InterfaceStringsView.as_view(), name="public-interface-strings"),
    path("sections/<slug:page>/", PageSectionsView.as_view(), name="public-sections"),
    path("search/", SearchView.as_view(), name="public-search"),
    path("taxonomies/", TaxonomyView.as_view(), name="public-taxonomies"),
    path("founder/", FounderView.as_view(), name="public-founder"),
    path("forms/booking/", BookingRequestView.as_view(), name="public-booking"),
    path("forms/contact/", ContactMessageView.as_view(), name="public-contact"),
    path("forms/newsletter/", NewsletterSubscribeView.as_view(), name="public-newsletter"),
    path("forms/review/", ReviewSubmissionView.as_view(), name="public-review-submit"),
    path("", include(router.urls)),
]

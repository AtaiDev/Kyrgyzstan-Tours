from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.api import CsrfView, LoginView, LogoutView, MeView, PasswordChangeView, RoleAdminViewSet, UserAdminViewSet
from apps.blog.admin_api import ArticleAdminViewSet, ArticleCategoryAdminViewSet
from apps.dashboard.api import DashboardView
from apps.geography.admin_api import (
    AttractionAdminViewSet,
    DestinationAdminViewSet,
    JourneySceneAdminViewSet,
    RegionAdminViewSet,
    SeasonAdminViewSet,
    TravelStyleAdminViewSet,
)
from apps.inquiries.admin_api import (
    BookingRequestAdminViewSet,
    ContactMessageAdminViewSet,
    NewsletterSubscriberAdminViewSet,
)
from apps.media_library.admin_api import MediaAssetAdminViewSet
from apps.people.admin_api import (
    FounderProfileAdminView,
    GuideAdminViewSet,
    SpokenLanguageAdminViewSet,
    TeamMemberAdminViewSet,
)
from apps.reviews.admin_api import ReviewAdminViewSet
from apps.site_content.admin_api import (
    FaqItemAdminViewSet,
    InterfaceStringAdminViewSet,
    PageSectionAdminViewSet,
    SeoPageAdminViewSet,
    SiteSettingsAdminView,
    StaticPageAdminViewSet,
    TranslationCoverageView,
    VisualSettingsAdminView,
)
from apps.tours.admin_api import RouteAdminViewSet, TourAdminViewSet

router = DefaultRouter(trailing_slash=True)
router.include_root_view = False
router.register("media", MediaAssetAdminViewSet, basename="admin-media")
router.register("sections", PageSectionAdminViewSet, basename="admin-section")
router.register("seo-pages", SeoPageAdminViewSet, basename="admin-seo-page")
router.register("static-pages", StaticPageAdminViewSet, basename="admin-static-page")
router.register("faq", FaqItemAdminViewSet, basename="admin-faq")
router.register("interface-strings", InterfaceStringAdminViewSet, basename="admin-interface-string")
router.register("regions", RegionAdminViewSet, basename="admin-region")
router.register("destinations", DestinationAdminViewSet, basename="admin-destination")
router.register("attractions", AttractionAdminViewSet, basename="admin-attraction")
router.register("scenes", JourneySceneAdminViewSet, basename="admin-scene")
router.register("seasons", SeasonAdminViewSet, basename="admin-season")
router.register("travel-styles", TravelStyleAdminViewSet, basename="admin-travel-style")
router.register("tours", TourAdminViewSet, basename="admin-tour")
router.register("routes", RouteAdminViewSet, basename="admin-route")
router.register("guides", GuideAdminViewSet, basename="admin-guide")
router.register("team", TeamMemberAdminViewSet, basename="admin-team")
router.register("spoken-languages", SpokenLanguageAdminViewSet, basename="admin-spoken-language")
router.register("reviews", ReviewAdminViewSet, basename="admin-review")
router.register("articles", ArticleAdminViewSet, basename="admin-article")
router.register("article-categories", ArticleCategoryAdminViewSet, basename="admin-article-category")
router.register("bookings", BookingRequestAdminViewSet, basename="admin-booking")
router.register("messages", ContactMessageAdminViewSet, basename="admin-message")
router.register("subscribers", NewsletterSubscriberAdminViewSet, basename="admin-subscriber")
router.register("users", UserAdminViewSet, basename="admin-user")
router.register("roles", RoleAdminViewSet, basename="admin-role")

urlpatterns = [
    path("auth/csrf/", CsrfView.as_view(), name="admin-csrf"),
    path("auth/login/", LoginView.as_view(), name="admin-login"),
    path("auth/logout/", LogoutView.as_view(), name="admin-logout"),
    path("auth/me/", MeView.as_view(), name="admin-me"),
    path("auth/password/", PasswordChangeView.as_view(), name="admin-password"),
    path("dashboard/", DashboardView.as_view(), name="admin-dashboard"),
    path("site-settings/", SiteSettingsAdminView.as_view(), name="admin-site-settings"),
    path("visual-settings/", VisualSettingsAdminView.as_view(), name="admin-visual-settings"),
    path("founder/", FounderProfileAdminView.as_view(), name="admin-founder"),
    path("translations/coverage/", TranslationCoverageView.as_view(), name="admin-translation-coverage"),
    path("", include(router.urls)),
]

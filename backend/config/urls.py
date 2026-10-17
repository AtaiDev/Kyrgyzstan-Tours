import os

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from apps.core.frontend import frontend_index
from apps.core.media import serve_media
from apps.site_content.sitemap import robots_view, sitemap_view

admin.site.site_header = "Kyrgyzstan-Tours · Django Admin"
admin.site.site_title = "Kyrgyzstan-Tours"
admin.site.index_title = "Технический раздел"

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/public/", include("config.api_public")),
    path("api/admin/", include("config.api_admin")),
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-docs"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="api-schema"), name="api-redoc"),
    path("sitemap.xml", sitemap_view, name="sitemap"),
    path("robots.txt", robots_view, name="robots"),
]

if settings.DEBUG or os.environ.get("DJANGO_SERVE_MEDIA", "").lower() in {"1", "true", "yes"}:
    media_prefix = settings.MEDIA_URL.lstrip("/")
    urlpatterns += [re_path(rf"^{media_prefix}(?P<path>.*)$", serve_media, {"document_root": settings.MEDIA_ROOT})]

if settings.SERVE_FRONTEND:
    urlpatterns += [re_path(r"^(?!api/|django-admin/|static/|media/)(?P<path>.*)$", frontend_index)]

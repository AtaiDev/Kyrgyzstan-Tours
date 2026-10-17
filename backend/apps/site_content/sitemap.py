from xml.sax.saxutils import escape

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.cache import cache_page

STATIC_PATHS = ("", "destinations", "tours", "routes", "guides", "about", "reviews", "blog", "contact", "faq", "credits")


def collect_paths():
    from apps.blog.models import Article
    from apps.geography.models import Attraction, Destination, Region
    from apps.people.models import Guide
    from apps.tours.models import Route, Tour

    from .models import StaticPage

    paths = [(path, None) for path in STATIC_PATHS]
    for prefix, queryset in (
        ("regions", Region.objects.filter(is_published=True)),
        ("destinations", Destination.objects.filter(is_published=True)),
        ("attractions", Attraction.objects.filter(is_published=True)),
        ("tours", Tour.objects.filter(is_published=True)),
        ("routes", Route.objects.filter(is_published=True)),
        ("guides", Guide.objects.filter(is_published=True)),
        (
            "blog",
            Article.objects.filter(status=Article.Status.PUBLISHED, published_at__lte=timezone.now()),
        ),
    ):
        for slug, updated_at in queryset.values_list("slug", "updated_at"):
            paths.append((f"{prefix}/{slug}", updated_at))
    for slug, updated_at in StaticPage.objects.filter(is_published=True).values_list("slug", "updated_at"):
        paths.append((slug, updated_at))
    return paths


@cache_page(60 * 30)
def sitemap_view(request):
    base = settings.FRONTEND_URL
    languages = settings.CONTENT_LANGUAGES
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    for path, updated_at in collect_paths():
        suffix = f"/{path}" if path else ""
        for language in languages:
            lines.append("  <url>")
            lines.append(f"    <loc>{escape(f'{base}/{language}{suffix}')}</loc>")
            for alternate in languages:
                href = escape(f"{base}/{alternate}{suffix}")
                lines.append(f'    <xhtml:link rel="alternate" hreflang="{alternate}" href="{href}"/>')
            if updated_at:
                lines.append(f"    <lastmod>{updated_at.date().isoformat()}</lastmod>")
            lines.append("  </url>")
    lines.append("</urlset>")
    return HttpResponse("\n".join(lines), content_type="application/xml")


def robots_view(request):
    content = "\n".join(
        ["User-agent: *", "Disallow: /admin", "Disallow: /api/", f"Sitemap: {settings.FRONTEND_URL}/sitemap.xml", ""]
    )
    return HttpResponse(content, content_type="text/plain")

from apps.core.languages import content_languages
from apps.core.permissions import model_permission
from apps.core.translation import missing_translation_counts


def translatable_resources():
    from apps.blog.models import Article, ArticleCategory
    from apps.geography.models import Attraction, Destination, JourneyScene, Region, Season, TravelStyle
    from apps.media_library.models import MediaAsset
    from apps.people.models import FounderProfile, Guide, SpokenLanguage, TeamMember
    from apps.reviews.models import Review
    from apps.tours.models import Route, Tour

    from .models import FaqItem, PageSection, SeoPage, SiteSettings, StaticPage

    return [
        ("sections", "Секции страниц", PageSection),
        ("regions", "Области", Region),
        ("attractions", "Достопримечательности", Attraction),
        ("destinations", "Направления", Destination),
        ("scenes", "3D-сцены", JourneyScene),
        ("tours", "Экскурсии", Tour),
        ("routes", "Маршруты", Route),
        ("guides", "Гиды", Guide),
        ("team", "Команда", TeamMember),
        ("founder", "Основатель", FounderProfile),
        ("reviews", "Отзывы", Review),
        ("articles", "Статьи", Article),
        ("article-categories", "Категории блога", ArticleCategory),
        ("faq", "Вопросы и ответы", FaqItem),
        ("static-pages", "Правовые страницы", StaticPage),
        ("seo", "SEO-страницы", SeoPage),
        ("site-settings", "Настройки сайта", SiteSettings),
        ("seasons", "Сезоны", Season),
        ("travel-styles", "Типы отдыха", TravelStyle),
        ("spoken-languages", "Языки гидов", SpokenLanguage),
        ("media", "Медиатека (alt-тексты)", MediaAsset),
    ]


def translation_coverage(user):
    rows = []
    totals = {language: {"missing": 0, "total": 0} for language in content_languages()}
    for resource, label, model in translatable_resources():
        if not user.has_perm(model_permission(model, "view")):
            continue
        queryset = model.objects.all()
        total = queryset.count()
        missing = missing_translation_counts(queryset) if total else {language: 0 for language in content_languages()}
        for language in content_languages():
            totals[language]["missing"] += missing[language]
            totals[language]["total"] += total
        rows.append({"resource": resource, "label": label, "total": total, "missing": missing})
    summary = {
        language: round(100 * (1 - values["missing"] / values["total"]), 1) if values["total"] else 100.0
        for language, values in totals.items()
    }
    return {"resources": rows, "summary": summary}

from django.conf import settings

LANGUAGE_CHOICES = [("ru", "Русский"), ("en", "English"), ("ky", "Кыргызча")]
LANGUAGE_ALIASES = {"kg": "ky", "kgz": "ky", "kir": "ky", "rus": "ru", "eng": "en"}


def content_languages():
    return tuple(settings.CONTENT_LANGUAGES)


def default_language():
    return settings.CONTENT_FALLBACK_LANGUAGES[0]


def admin_language():
    return settings.LANGUAGE_CODE


def normalize_language(value):
    if not value:
        return None
    code = str(value).strip().lower().replace("_", "-").split("-")[0]
    code = LANGUAGE_ALIASES.get(code, code)
    return code if code in settings.CONTENT_LANGUAGES else None


def resolve_request_language(request):
    params = getattr(request, "query_params", None) or request.GET
    language = normalize_language(params.get("lang"))
    if language:
        return language
    for part in request.META.get("HTTP_ACCEPT_LANGUAGE", "").split(","):
        language = normalize_language(part.split(";")[0])
        if language:
            return language
    return default_language()


def fallback_chain(language):
    chain = [language] if language else []
    chain.extend(code for code in settings.CONTENT_FALLBACK_LANGUAGES if code not in chain)
    return chain

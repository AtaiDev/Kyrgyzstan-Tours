from django.utils import translation

from .languages import admin_language, resolve_request_language


class ApiLanguageMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/api/public/"):
            language = resolve_request_language(request)
        elif request.path.startswith("/api/admin/"):
            language = admin_language()
        else:
            return self.get_response(request)
        with translation.override(language):
            response = self.get_response(request)
            response.headers.setdefault("Content-Language", language)
            return response

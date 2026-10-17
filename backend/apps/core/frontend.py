from django.conf import settings
from django.http import Http404, HttpResponse


def frontend_index(request, path=""):
    index = settings.FRONTEND_DIST / "index.html"
    if not index.is_file():
        raise Http404("The frontend build was not found.")
    response = HttpResponse(index.read_bytes(), content_type="text/html; charset=utf-8")
    response["Cache-Control"] = "no-cache"
    return response

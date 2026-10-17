from rest_framework.filters import BaseFilterBackend

from .languages import normalize_language
from .translation import missing_translation_queryset


class MissingTranslationFilter(BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        language = normalize_language(request.query_params.get("missing_language"))
        if not language or not hasattr(queryset.model, "translation_model"):
            return queryset
        return missing_translation_queryset(queryset, language)


class BooleanParamFilter(BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        for field in getattr(view, "boolean_filter_fields", ()):
            value = request.query_params.get(field)
            if value in ("true", "1"):
                queryset = queryset.filter(**{field: True})
            elif value in ("false", "0"):
                queryset = queryset.filter(**{field: False})
        return queryset

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema

LANG_PARAMETER = OpenApiParameter(
    "lang",
    OpenApiTypes.STR,
    enum=["ru", "en", "ky"],
    description="Content language. Falls back to Accept-Language, then to the default language.",
)

ARRAY_OF_OBJECTS = {"type": "array", "items": {"type": "object"}}
ARRAY_OF_STRINGS = {"type": "array", "items": {"type": "string"}}


def object_response(*parameters, request=None, summary=None):
    return extend_schema(responses=OpenApiTypes.OBJECT, request=request, parameters=list(parameters), summary=summary)

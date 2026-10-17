import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.db.models import ProtectedError, RestrictedError
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    if isinstance(exc, (ProtectedError, RestrictedError)):
        related = sorted({str(item) for item in list(exc.args[1])[:8]})
        return Response(
            {
                "detail": "This item is used by other content and cannot be deleted.",
                "code": "protected",
                "related": related,
            },
            status=status.HTTP_409_CONFLICT,
        )
    if isinstance(exc, DjangoValidationError):
        detail = exc.message_dict if hasattr(exc, "error_dict") else {"non_field_errors": exc.messages}
        exc = ValidationError(detail=detail)
    if isinstance(exc, IntegrityError):
        logger.warning("Integrity error: %s", exc)
        return Response(
            {"detail": "The data conflicts with existing records.", "code": "conflict"},
            status=status.HTTP_409_CONFLICT,
        )
    return exception_handler(exc, context)

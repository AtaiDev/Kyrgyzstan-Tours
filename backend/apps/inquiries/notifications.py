import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def notifications_enabled():
    return bool(settings.INQUIRY_NOTIFICATION_EMAILS and settings.EMAIL_HOST)


def notify_team(subject, lines):
    if not notifications_enabled():
        return False
    try:
        send_mail(
            subject=subject,
            message="\n".join(lines),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=settings.INQUIRY_NOTIFICATION_EMAILS,
            fail_silently=False,
        )
        return True
    except Exception:
        logger.exception("Could not send inquiry notification email")
        return False

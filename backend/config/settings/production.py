from django.core.exceptions import ImproperlyConfigured

from .base import *
from .base import STORAGES, env, env_bool, env_int

DEBUG = False

if not SECRET_KEY or SECRET_KEY.startswith(("development-only", "replace-with")) or len(SECRET_KEY) < 40:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set to a strong unique value (40+ characters) in production.")

STORAGES = {
    **STORAGES,
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = env_int("DJANGO_SECURE_HSTS_SECONDS", 60 * 60 * 24 * 30)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", False)
SECURE_HSTS_PRELOAD = False

if not env("EMAIL_HOST"):
    EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

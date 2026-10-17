import tempfile
from pathlib import Path

from .development import *
from .development import REST_FRAMEWORK

MEDIA_ROOT = Path(tempfile.mkdtemp(prefix="kyrgyzstan-tours-test-media-"))
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {"public_read": "10000/minute", "public_forms": "10000/hour", "login": "10000/minute"},
}

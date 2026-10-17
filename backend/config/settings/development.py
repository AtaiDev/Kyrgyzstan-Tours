from .base import *
from .base import REST_FRAMEWORK, SPECTACULAR_SETTINGS, env, env_list

DEBUG = True
SECRET_KEY = env("DJANGO_SECRET_KEY") or "development-only-insecure-key-change-me"
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,[::1]")

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}

SPECTACULAR_SETTINGS = {**SPECTACULAR_SETTINGS, "SERVE_PERMISSIONS": ["rest_framework.permissions.AllowAny"]}

if not env("EMAIL_HOST"):
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

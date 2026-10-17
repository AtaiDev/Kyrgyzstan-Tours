from django.apps import AppConfig
from django.db.backends.signals import connection_created


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    verbose_name = "Core"

    def ready(self):
        from .sqlite import register_unicode_like

        connection_created.connect(register_unicode_like, dispatch_uid="core_unicode_like")

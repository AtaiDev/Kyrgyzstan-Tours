from django.contrib import admin

from apps.core.admin_helpers import register_translatable

from .models import FaqItem, InterfaceString, PageSection, SeoPage, SiteSettings, StaticPage, VisualSettings

register_translatable(SiteSettings, list_display=("site_name", "email", "phone"))
register_translatable(PageSection, list_display=("__str__", "page", "key", "position", "is_visible"), list_filter=("page", "is_visible"))
register_translatable(SeoPage, list_display=("key", "__str__", "no_index"))
register_translatable(StaticPage, list_display=("slug", "__str__", "is_published"))
register_translatable(FaqItem, list_display=("__str__", "category", "position", "is_published"), list_filter=("category", "is_published"))


@admin.register(VisualSettings)
class VisualSettingsAdmin(admin.ModelAdmin):
    list_display = ("__str__", "enable_3d", "enable_parallax", "scene_quality")


@admin.register(InterfaceString)
class InterfaceStringAdmin(admin.ModelAdmin):
    list_display = ("key", "value_ru", "value_en", "value_ky")
    search_fields = ("key", "value_ru", "value_en", "value_ky")

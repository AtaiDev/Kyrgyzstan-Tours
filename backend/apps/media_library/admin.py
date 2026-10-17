from apps.core.admin_helpers import register_translatable

from .models import MediaAsset

register_translatable(
    MediaAsset,
    list_display=("__str__", "kind", "folder", "original_name", "author", "created_at"),
    list_filter=("kind", "folder", "is_demo"),
    search_fields=("original_name", "author", "translations__alt"),
)

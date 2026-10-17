from apps.core.admin_helpers import register_translatable

from .models import Review

register_translatable(
    Review,
    list_display=("__str__", "status", "tour", "guide", "is_featured", "is_demo", "created_at"),
    list_filter=("status", "rating", "is_featured", "is_demo"),
    search_fields=("author_name", "author_email", "translations__text"),
)

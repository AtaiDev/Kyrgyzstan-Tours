from apps.core.admin_helpers import register_translatable

from .models import Article, ArticleCategory

register_translatable(ArticleCategory, list_display=("__str__", "slug", "position"))
register_translatable(
    Article,
    list_display=("__str__", "slug", "category", "status", "published_at", "is_demo"),
    list_filter=("status", "category", "is_featured", "is_demo"),
)

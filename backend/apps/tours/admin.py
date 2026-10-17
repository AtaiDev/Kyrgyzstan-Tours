from apps.core.admin_helpers import gallery_inline, register_translatable

from .models import Route, Tour, TourPhoto

register_translatable(
    Tour,
    list_display=("__str__", "slug", "region", "price", "currency", "duration_days", "is_published", "is_demo"),
    list_filter=("region", "difficulty", "is_published", "is_featured", "is_demo"),
    inlines=(gallery_inline(TourPhoto),),
)
register_translatable(
    Route,
    list_display=("__str__", "slug", "distance_km", "duration_days", "is_published"),
    list_filter=("difficulty", "is_published", "is_demo"),
)

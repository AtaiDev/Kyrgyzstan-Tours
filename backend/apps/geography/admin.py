from apps.core.admin_helpers import gallery_inline, register_translatable

from .models import Attraction, AttractionPhoto, Destination, DestinationPhoto, JourneyScene, Region, RegionPhoto, Season, TravelStyle

register_translatable(Season, list_display=("__str__", "code", "months", "position"))
register_translatable(TravelStyle, list_display=("__str__", "slug", "position"))
register_translatable(
    Region,
    list_display=("__str__", "slug", "map_code", "position", "is_published"),
    list_filter=("is_published",),
    inlines=(gallery_inline(RegionPhoto),),
)
register_translatable(
    Destination,
    list_display=("__str__", "slug", "region", "is_featured", "is_published"),
    list_filter=("region", "is_featured", "is_published", "is_demo"),
    inlines=(gallery_inline(DestinationPhoto),),
)
register_translatable(
    Attraction,
    list_display=("__str__", "slug", "region", "kind", "is_published"),
    list_filter=("region", "kind", "is_published", "is_demo"),
    inlines=(gallery_inline(AttractionPhoto),),
)
register_translatable(JourneyScene, list_display=("__str__", "slug", "terrain_size_km", "position", "is_published"))

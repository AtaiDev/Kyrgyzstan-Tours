from apps.core.admin_helpers import register_translatable

from .models import FounderProfile, Guide, SpokenLanguage, TeamMember

register_translatable(SpokenLanguage, list_display=("__str__", "code", "position"))
register_translatable(
    Guide,
    list_display=("__str__", "slug", "experience_years", "is_featured", "is_published", "is_demo"),
    list_filter=("is_published", "is_featured", "is_demo", "languages"),
)
register_translatable(TeamMember, list_display=("__str__", "position", "is_published", "is_demo"))
register_translatable(FounderProfile, list_display=("__str__", "is_visible", "is_demo"))

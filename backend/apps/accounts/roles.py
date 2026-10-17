from django.contrib.auth.models import Group, Permission

CONTENT_APPS = ("site_content", "geography", "people", "tours", "reviews", "blog", "media_library")
INQUIRY_APPS = ("inquiries",)

MANAGED_MODELS = [
    ("site_content", "sitesettings", "Настройки сайта"),
    ("site_content", "visualsettings", "Визуальные эффекты"),
    ("site_content", "pagesection", "Секции страниц"),
    ("site_content", "seopage", "SEO"),
    ("site_content", "staticpage", "Правовые страницы"),
    ("site_content", "faqitem", "Вопросы и ответы"),
    ("site_content", "interfacestring", "Переводы интерфейса"),
    ("geography", "region", "Области"),
    ("geography", "destination", "Направления"),
    ("geography", "attraction", "Достопримечательности"),
    ("geography", "journeyscene", "3D-сцены"),
    ("geography", "season", "Сезоны"),
    ("geography", "travelstyle", "Типы отдыха"),
    ("tours", "tour", "Экскурсии"),
    ("tours", "route", "Маршруты"),
    ("people", "guide", "Гиды"),
    ("people", "teammember", "Команда"),
    ("people", "founderprofile", "Основатель"),
    ("people", "spokenlanguage", "Языки гидов"),
    ("reviews", "review", "Отзывы"),
    ("blog", "article", "Статьи"),
    ("blog", "articlecategory", "Категории блога"),
    ("media_library", "mediaasset", "Медиатека"),
    ("inquiries", "bookingrequest", "Заявки на экскурсии"),
    ("inquiries", "contactmessage", "Сообщения"),
    ("inquiries", "newslettersubscriber", "Подписчики"),
    ("auth", "user", "Пользователи"),
    ("auth", "group", "Роли"),
]

ACTIONS = ("view", "add", "change", "delete")

ROLE_DEFINITIONS = {
    "Администратор контента": {
        "full": CONTENT_APPS,
        "partial": {"inquiries": ("view",)},
    },
    "Редактор": {
        "full": (),
        "partial": {app: ("view", "add", "change") for app in CONTENT_APPS},
    },
    "Менеджер заявок": {
        "full": INQUIRY_APPS,
        "partial": {"tours": ("view",), "people": ("view",), "reviews": ("view", "change"), "geography": ("view",)},
    },
}


def managed_permissions():
    codenames = []
    for app_label, model, _ in MANAGED_MODELS:
        for action in ACTIONS:
            codenames.append((app_label, f"{action}_{model}"))
    return codenames


def permissions_for_role(definition):
    selected = []
    for app_label, model, _ in MANAGED_MODELS:
        if app_label in definition["full"]:
            selected.extend((app_label, f"{action}_{model}") for action in ACTIONS)
        elif app_label in definition["partial"]:
            selected.extend((app_label, f"{action}_{model}") for action in definition["partial"][app_label])
    return selected


def resolve_permissions(pairs):
    permissions = []
    for app_label, codename in pairs:
        permission = Permission.objects.filter(content_type__app_label=app_label, codename=codename).first()
        if permission is not None:
            permissions.append(permission)
    return permissions


def ensure_roles():
    created = []
    for name, definition in ROLE_DEFINITIONS.items():
        group, was_created = Group.objects.get_or_create(name=name)
        if was_created:
            group.permissions.set(resolve_permissions(permissions_for_role(definition)))
            created.append(name)
    return created

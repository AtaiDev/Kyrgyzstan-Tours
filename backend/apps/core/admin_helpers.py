from django.contrib import admin


def translation_inline(model):
    return type(
        f"{model.__name__}TranslationInline",
        (admin.StackedInline,),
        {"model": model.translation_model, "extra": 0, "max_num": 3},
    )


def gallery_inline(through_model):
    return type(
        f"{through_model.__name__}Inline",
        (admin.TabularInline,),
        {"model": through_model, "extra": 0, "autocomplete_fields": ("asset",)},
    )


def register_translatable(model, list_display=("__str__",), list_filter=(), search_fields=(), inlines=(), **options):
    attributes = {
        "list_display": list_display,
        "list_filter": list_filter,
        "search_fields": search_fields or ("translations__" + (model.display_field or model.translated_fields[0]),),
        "inlines": [translation_inline(model), *inlines],
        **options,
    }
    admin_class = type(f"{model.__name__}Admin", (admin.ModelAdmin,), attributes)
    admin.site.register(model, admin_class)
    return admin_class

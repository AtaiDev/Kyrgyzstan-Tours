from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.schema import ARRAY_OF_OBJECTS

from .models import MediaAsset


def asset_brief(asset):
    if asset is None:
        return None
    return {
        "id": asset.pk,
        "kind": asset.kind,
        "url": asset.url,
        "large_url": asset.large_url,
        "medium_url": asset.medium_url,
        "thumbnail_url": asset.thumbnail_url,
        "width": asset.width,
        "height": asset.height,
        "original_name": asset.original_name,
        "alt": asset.translated_value("alt"),
    }


class MediaAssetField(serializers.PrimaryKeyRelatedField):
    def __init__(self, kind=MediaAsset.Kind.IMAGE, **kwargs):
        self.kind = kind
        kwargs.setdefault("queryset", MediaAsset.objects.all())
        kwargs.setdefault("required", False)
        kwargs.setdefault("allow_null", True)
        super().__init__(**kwargs)

    def use_pk_only_optimization(self):
        return False

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.get("id")
        asset = super().to_internal_value(data)
        if self.kind and asset.kind != self.kind:
            raise serializers.ValidationError(f"Expected a file of type “{self.kind}”.")
        return asset

    def to_representation(self, value):
        return asset_brief(value)


@extend_schema_field(ARRAY_OF_OBJECTS)
class GalleryField(serializers.Field):
    def __init__(self, relation, **kwargs):
        self.relation = relation
        kwargs["source"] = "*"
        kwargs.setdefault("required", False)
        super().__init__(**kwargs)

    def to_representation(self, instance):
        return [asset_brief(item.asset) for item in getattr(instance, self.relation).all()]

    def to_internal_value(self, data):
        if not isinstance(data, list):
            raise serializers.ValidationError("Expected a list of media identifiers.")
        identifiers = []
        for entry in data:
            value = entry.get("id") if isinstance(entry, dict) else entry
            try:
                identifiers.append(int(value))
            except (TypeError, ValueError):
                raise serializers.ValidationError("Invalid media identifier.")
        identifiers = list(dict.fromkeys(identifiers))
        found = set(
            MediaAsset.objects.filter(pk__in=identifiers, kind=MediaAsset.Kind.IMAGE).values_list("pk", flat=True)
        )
        missing = [identifier for identifier in identifiers if identifier not in found]
        if missing:
            raise serializers.ValidationError(f"Unknown images: {missing}.")
        return {"gallery": identifiers}


def replace_gallery(instance, relation, asset_ids):
    manager = getattr(instance, relation)
    model = manager.model
    owner_field = manager.field.name
    model.objects.filter(**{owner_field: instance}).delete()
    model.objects.bulk_create(
        [model(**{owner_field: instance}, asset_id=asset_id, position=index) for index, asset_id in enumerate(asset_ids)]
    )
    if hasattr(instance, "_prefetched_objects_cache"):
        instance._prefetched_objects_cache.pop(relation, None)


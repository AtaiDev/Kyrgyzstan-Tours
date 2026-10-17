from rest_framework import serializers

from apps.core.serializers import LocalizedModelSerializer
from apps.core.viewsets import PublicReadOnlyViewSet

from .models import MediaAsset


class PublicMediaSerializer(LocalizedModelSerializer):
    url = serializers.CharField(read_only=True)
    large_url = serializers.CharField(read_only=True)
    medium_url = serializers.CharField(read_only=True)
    thumbnail_url = serializers.CharField(read_only=True)

    class Meta:
        model = MediaAsset
        fields = (
            "id",
            "kind",
            "url",
            "large_url",
            "medium_url",
            "thumbnail_url",
            "width",
            "height",
            "author",
            "license",
            "license_url",
            "source_url",
        )
        translated = ("alt", "caption")


def serialize_media(asset, context):
    return PublicMediaSerializer(asset, context=context).data if asset else None


def serialize_gallery(instance, context, relation="gallery_items"):
    return [PublicMediaSerializer(item.asset, context=context).data for item in getattr(instance, relation).all()]


def media_prefetch(*fields):
    return [f"{field}__translations" for field in fields]


def gallery_prefetch(relation="gallery_items"):
    return [f"{relation}__asset__translations"]


class MediaCreditViewSet(PublicReadOnlyViewSet):
    serializer_class = PublicMediaSerializer
    lookup_field = "pk"
    publication_filter = {}
    filter_backends = []

    def get_queryset(self):
        return (
            MediaAsset.objects.exclude(author="")
            .exclude(license="")
            .prefetch_related("translations")
            .order_by("id")
        )

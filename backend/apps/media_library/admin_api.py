from pathlib import Path

from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.core.serializers import TranslatableAdminSerializer
from apps.core.viewsets import AdminModelViewSet

from .models import MediaAsset
from .processing import detect_and_validate_upload, generate_variants


class MediaAssetAdminSerializer(TranslatableAdminSerializer):
    file = serializers.FileField(write_only=True, required=False)
    url = serializers.CharField(read_only=True)
    large_url = serializers.CharField(read_only=True)
    medium_url = serializers.CharField(read_only=True)
    thumbnail_url = serializers.CharField(read_only=True)

    class Meta:
        model = MediaAsset
        fields = (
            "id",
            "kind",
            "file",
            "url",
            "large_url",
            "medium_url",
            "thumbnail_url",
            "width",
            "height",
            "file_size",
            "original_name",
            "folder",
            "author",
            "license",
            "license_url",
            "source_url",
            "is_demo",
            "created_at",
            "updated_at",
            "translations",
            "display_name",
            "missing_translations",
        )
        read_only_fields = ("kind", "width", "height", "file_size", "original_name", "created_at", "updated_at")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        upload = attrs.get("file")
        if self.instance is None and upload is None:
            raise serializers.ValidationError({"file": ["Select a file to upload."]})
        if upload is not None:
            attrs["kind"] = detect_and_validate_upload(upload)
            attrs["original_name"] = Path(upload.name).name[:255]
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["uploaded_by"] = request.user
        asset = super().create(validated_data)
        return generate_variants(asset)

    def update(self, instance, validated_data):
        replacing = "file" in validated_data
        previous_name = instance.file.name if replacing else None
        storage = instance.file.storage
        asset = super().update(instance, validated_data)
        if replacing:
            if previous_name and previous_name != asset.file.name:
                storage.delete(previous_name)
            generate_variants(asset)
        return asset


class MediaAssetAdminViewSet(AdminModelViewSet):
    queryset = MediaAsset.objects.prefetch_related("translations")
    serializer_class = MediaAssetAdminSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ("kind", "folder", "is_demo")
    search_fields = ("translations__alt", "translations__caption", "original_name", "author", "folder")
    ordering = ("-created_at", "-id")
    ordering_fields = ("created_at", "file_size", "id")

    @action(detail=False, methods=["get"], pagination_class=None)
    def folders(self, request):
        folders = (
            MediaAsset.objects.exclude(folder="").order_by("folder").values_list("folder", flat=True).distinct()
        )
        return Response(list(folders))

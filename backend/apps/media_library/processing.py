from io import BytesIO
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework.exceptions import ValidationError

from .models import MediaAsset

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXTENSIONS = {".mp4", ".webm"}
VARIANT_SIZES = {"large": 2560, "medium": 1400, "thumbnail": 560}
LARGE_VARIANT_MIN_SIDE = 2880


def detect_and_validate_upload(upload):
    extension = Path(upload.name).suffix.lower()
    if extension in IMAGE_EXTENSIONS:
        limit = settings.MEDIA_MAX_IMAGE_SIZE_MB * 1024 * 1024
        if upload.size > limit:
            raise ValidationError({"file": [f"Images must be smaller than {settings.MEDIA_MAX_IMAGE_SIZE_MB} MB."]})
        try:
            image = Image.open(upload)
            image.verify()
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
            raise ValidationError({"file": ["The file is not a valid image."]})
        finally:
            upload.seek(0)
        return MediaAsset.Kind.IMAGE
    if extension in VIDEO_EXTENSIONS:
        limit = settings.MEDIA_MAX_VIDEO_SIZE_MB * 1024 * 1024
        if upload.size > limit:
            raise ValidationError({"file": [f"Videos must be smaller than {settings.MEDIA_MAX_VIDEO_SIZE_MB} MB."]})
        return MediaAsset.Kind.VIDEO
    allowed = ", ".join(sorted(IMAGE_EXTENSIONS | VIDEO_EXTENSIONS))
    raise ValidationError({"file": [f"Unsupported file type. Allowed: {allowed}."]})


def remove_variant_files(asset):
    for field_name in VARIANT_SIZES:
        field = getattr(asset, field_name)
        if field:
            field.delete(save=False)


def generate_variants(asset):
    asset.file_size = asset.file.size
    if asset.kind != MediaAsset.Kind.IMAGE:
        asset.save(update_fields=["file_size", "updated_at"])
        return asset
    with asset.file.open("rb") as handle:
        image = ImageOps.exif_transpose(Image.open(handle))
        image.load()
    asset.width, asset.height = image.size
    has_alpha = image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info)
    base = image.convert("RGBA" if has_alpha else "RGB")
    stem = Path(asset.file.name).stem
    remove_variant_files(asset)
    for field_name, size in VARIANT_SIZES.items():
        if field_name == "large" and max(base.size) < LARGE_VARIANT_MIN_SIDE:
            continue
        variant = base.copy()
        variant.thumbnail((size, size), Image.Resampling.LANCZOS)
        buffer = BytesIO()
        variant.save(buffer, "WEBP", quality=82 if field_name == "large" else 80, method=4)
        getattr(asset, field_name).save(f"{stem}-{field_name}.webp", ContentFile(buffer.getvalue()), save=False)
    asset.save(update_fields=["file_size", "width", "height", "large", "medium", "thumbnail", "updated_at"])
    return asset

from django.db import migrations


def backfill(apps, schema_editor):
    from apps.media_library.video import probe

    MediaAsset = apps.get_model("media_library", "MediaAsset")
    for asset in MediaAsset.objects.filter(kind="video", duration__isnull=True):
        try:
            with asset.file.open("rb") as handle:
                info = probe(handle)
        except (FileNotFoundError, OSError):
            continue
        if info:
            asset.width, asset.height, asset.duration, asset.video_codec = info.width, info.height, info.duration, info.codec[:8]
            asset.save(update_fields=["width", "height", "duration", "video_codec"])


class Migration(migrations.Migration):
    dependencies = [("media_library", "0003_video_metadata")]
    operations = [migrations.RunPython(backfill, migrations.RunPython.noop)]

from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import MediaAsset


@receiver(post_delete, sender=MediaAsset)
def delete_asset_files(sender, instance, **kwargs):
    for field_name in ("file", "large", "medium", "thumbnail"):
        field = getattr(instance, field_name)
        if field:
            field.delete(save=False)

import apps.media_library.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('media_library', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='mediaasset',
            name='large',
            field=models.ImageField(blank=True, max_length=255, upload_to=apps.media_library.models.variant_upload_path),
        ),
    ]

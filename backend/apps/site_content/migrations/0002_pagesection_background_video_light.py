import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('media_library', '0002_mediaasset_large'),
        ('site_content', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='pagesection',
            name='background_video_light',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset'),
        ),
    ]

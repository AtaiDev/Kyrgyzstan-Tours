from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('site_content', '0002_pagesection_background_video_light'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='visualsettings',
            name='particle_density',
        ),
    ]

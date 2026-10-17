import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('geography', '0001_initial'),
        ('media_library', '0002_mediaasset_large'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='journeyscene',
            name='accent_color',
        ),
        migrations.RemoveField(
            model_name='journeyscene',
            name='relief',
        ),
        migrations.RemoveField(
            model_name='journeyscene',
            name='snow_line',
        ),
        migrations.RemoveField(
            model_name='journeyscene',
            name='terrain',
        ),
        migrations.RemoveField(
            model_name='journeyscene',
            name='terrain_color',
        ),
        migrations.RemoveField(
            model_name='journeyscene',
            name='water_color',
        ),
        migrations.RemoveField(
            model_name='journeyscene',
            name='water_level',
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='camera_heading',
            field=models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MaxValueValidator(359)]),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='camera_motion',
            field=models.CharField(choices=[('orbit', 'Orbit around the place'), ('glide', 'Glide towards the place'), ('rise', 'Rise above the ridges'), ('valley', 'Fly along the valley'), ('descend', 'Descend from above'), ('sweep', 'Sideways sweep')], default='orbit', max_length=20),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_captured_on',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_exaggeration',
            field=models.FloatField(default=1.3, validators=[django.core.validators.MinValueValidator(0.5), django.core.validators.MaxValueValidator(4)]),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_far_heightmap',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset'),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_far_size_km',
            field=models.FloatField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(4), django.core.validators.MaxValueValidator(400)]),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_far_texture',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset'),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_heightmap',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset'),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_latitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True, validators=[django.core.validators.MinValueValidator(-85), django.core.validators.MaxValueValidator(85)]),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_longitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True, validators=[django.core.validators.MinValueValidator(-180), django.core.validators.MaxValueValidator(180)]),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_max_height',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_min_height',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_size_km',
            field=models.FloatField(default=30, validators=[django.core.validators.MinValueValidator(2), django.core.validators.MaxValueValidator(120)]),
        ),
        migrations.AddField(
            model_name='journeyscene',
            name='terrain_texture',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset'),
        ),
    ]

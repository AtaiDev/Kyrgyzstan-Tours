import apps.media_library.models
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MediaAsset',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('kind', models.CharField(choices=[('image', 'Image'), ('video', 'Video')], db_index=True, default='image', max_length=10)),
                ('file', models.FileField(max_length=255, upload_to=apps.media_library.models.asset_upload_path)),
                ('medium', models.ImageField(blank=True, max_length=255, upload_to=apps.media_library.models.variant_upload_path)),
                ('thumbnail', models.ImageField(blank=True, max_length=255, upload_to=apps.media_library.models.variant_upload_path)),
                ('width', models.PositiveIntegerField(blank=True, null=True)),
                ('height', models.PositiveIntegerField(blank=True, null=True)),
                ('file_size', models.PositiveBigIntegerField(default=0)),
                ('original_name', models.CharField(blank=True, max_length=255)),
                ('folder', models.CharField(blank=True, db_index=True, max_length=60)),
                ('author', models.CharField(blank=True, max_length=255)),
                ('license', models.CharField(blank=True, max_length=120)),
                ('license_url', models.URLField(blank=True, max_length=500)),
                ('source_url', models.URLField(blank=True, max_length=500)),
                ('is_demo', models.BooleanField(default=False)),
                ('uploaded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'media asset',
                'ordering': ('-created_at', '-id'),
            },
        ),
        migrations.CreateModel(
            name='MediaAssetTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('alt', models.CharField(blank=True, max_length=255)),
                ('caption', models.CharField(blank=True, max_length=300)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='media_library.mediaasset')),
            ],
            options={
                'verbose_name': 'media asset translation',
                'db_table': 'media_library_mediaasset_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='media_library_mediaasset_translation_unique_language')],
            },
        ),
    ]

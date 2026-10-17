import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('media_library', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TravelStyle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('slug', models.SlugField(max_length=60, unique=True)),
                ('icon', models.CharField(blank=True, max_length=40)),
                ('position', models.PositiveIntegerField(default=0)),
            ],
            options={
                'ordering': ('position', 'id'),
            },
        ),
        migrations.CreateModel(
            name='Destination',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(db_index=True, default=True)),
                ('position', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_demo', models.BooleanField(default=False)),
                ('slug', models.SlugField(max_length=120, unique=True)),
                ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('is_featured', models.BooleanField(db_index=True, default=False)),
                ('cover', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Attraction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(db_index=True, default=True)),
                ('position', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_demo', models.BooleanField(default=False)),
                ('slug', models.SlugField(max_length=120, unique=True)),
                ('kind', models.CharField(choices=[('lake', 'Lake'), ('mountain', 'Mountain'), ('canyon', 'Canyon'), ('gorge', 'Gorge'), ('national_park', 'National park'), ('historical', 'Historical site'), ('cultural', 'Cultural site'), ('natural_monument', 'Natural monument'), ('forest', 'Forest')], db_index=True, default='natural_monument', max_length=30)),
                ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('altitude_m', models.PositiveIntegerField(blank=True, null=True, validators=[django.core.validators.MaxValueValidator(8000)])),
                ('is_featured', models.BooleanField(db_index=True, default=False)),
                ('cover', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
                ('destination', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='attractions', to='geography.destination')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='JourneyScene',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(db_index=True, default=True)),
                ('position', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_demo', models.BooleanField(default=False)),
                ('slug', models.SlugField(max_length=120, unique=True)),
                ('terrain', models.CharField(choices=[('lake_basin', 'Lake basin'), ('alpine_lake', 'Alpine lake'), ('high_plateau', 'High plateau'), ('gorge', 'Gorge'), ('red_rocks', 'Red rocks'), ('forest_lake', 'Forest lake'), ('valley_fortress', 'Valley fortress'), ('sacred_mountain', 'Sacred mountain')], default='alpine_lake', max_length=30)),
                ('sky_color', models.CharField(default='#9fc3d9', max_length=7, validators=[django.core.validators.RegexValidator('^#[0-9a-fA-F]{6}$', 'Use a hex color such as #1f6f78.')])),
                ('fog_color', models.CharField(default='#c8d8e0', max_length=7, validators=[django.core.validators.RegexValidator('^#[0-9a-fA-F]{6}$', 'Use a hex color such as #1f6f78.')])),
                ('terrain_color', models.CharField(default='#5f6f52', max_length=7, validators=[django.core.validators.RegexValidator('^#[0-9a-fA-F]{6}$', 'Use a hex color such as #1f6f78.')])),
                ('accent_color', models.CharField(default='#e9e4d4', max_length=7, validators=[django.core.validators.RegexValidator('^#[0-9a-fA-F]{6}$', 'Use a hex color such as #1f6f78.')])),
                ('water_color', models.CharField(default='#2f8fa3', max_length=7, validators=[django.core.validators.RegexValidator('^#[0-9a-fA-F]{6}$', 'Use a hex color such as #1f6f78.')])),
                ('water_level', models.FloatField(default=0.25, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(1)])),
                ('snow_line', models.FloatField(default=0.7, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(1)])),
                ('relief', models.FloatField(default=1.0, validators=[django.core.validators.MinValueValidator(0.3), django.core.validators.MaxValueValidator(2.0)])),
                ('attraction', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='journey_scenes', to='geography.attraction')),
                ('photo', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Region',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(db_index=True, default=True)),
                ('position', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_demo', models.BooleanField(default=False)),
                ('slug', models.SlugField(max_length=120, unique=True)),
                ('map_code', models.CharField(choices=[('chuy', 'Chuy'), ('talas', 'Talas'), ('issyk-kul', 'Issyk-Kul'), ('naryn', 'Naryn'), ('jalal-abad', 'Jalal-Abad'), ('osh', 'Osh'), ('batken', 'Batken')], max_length=20, unique=True)),
                ('accent_color', models.CharField(default='#2a9d8f', max_length=7, validators=[django.core.validators.RegexValidator('^#[0-9a-fA-F]{6}$', 'Use a hex color such as #1f6f78.')])),
                ('area_km2', models.PositiveIntegerField(blank=True, null=True)),
                ('recommended_days_min', models.PositiveSmallIntegerField(default=2, validators=[django.core.validators.MinValueValidator(1)])),
                ('recommended_days_max', models.PositiveSmallIntegerField(default=5, validators=[django.core.validators.MinValueValidator(1)])),
                ('cover', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='destination',
            name='region',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='destinations', to='geography.region'),
        ),
        migrations.AddField(
            model_name='attraction',
            name='region',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='attractions', to='geography.region'),
        ),
        migrations.CreateModel(
            name='Season',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('code', models.SlugField(max_length=20, unique=True)),
                ('position', models.PositiveIntegerField(default=0)),
                ('months', models.CharField(blank=True, max_length=40)),
                ('image', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
            ],
            options={
                'ordering': ('position', 'id'),
            },
        ),
        migrations.AddField(
            model_name='region',
            name='seasons',
            field=models.ManyToManyField(blank=True, related_name='regions', to='geography.season'),
        ),
        migrations.AddField(
            model_name='destination',
            name='seasons',
            field=models.ManyToManyField(blank=True, related_name='destinations', to='geography.season'),
        ),
        migrations.AddField(
            model_name='attraction',
            name='seasons',
            field=models.ManyToManyField(blank=True, related_name='attractions', to='geography.season'),
        ),
        migrations.CreateModel(
            name='SeasonTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('name', models.CharField(blank=True, max_length=60)),
                ('description', models.TextField(blank=True)),
                ('highlights', models.TextField(blank=True)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='geography.season')),
            ],
            options={
                'verbose_name': 'season translation',
                'db_table': 'geography_season_translation',
            },
        ),
        migrations.AddField(
            model_name='destination',
            name='travel_styles',
            field=models.ManyToManyField(blank=True, related_name='destinations', to='geography.travelstyle'),
        ),
        migrations.CreateModel(
            name='TravelStyleTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('name', models.CharField(blank=True, max_length=80)),
                ('description', models.TextField(blank=True)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='geography.travelstyle')),
            ],
            options={
                'verbose_name': 'travel style translation',
                'db_table': 'geography_travelstyle_translation',
            },
        ),
        migrations.CreateModel(
            name='AttractionPhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('position', models.PositiveIntegerField(default=0)),
                ('asset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='media_library.mediaasset')),
                ('attraction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gallery_items', to='geography.attraction')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
                'constraints': [models.UniqueConstraint(fields=('attraction', 'asset'), name='unique_attraction_photo')],
            },
        ),
        migrations.CreateModel(
            name='AttractionTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('name', models.CharField(blank=True, max_length=160)),
                ('tagline', models.CharField(blank=True, max_length=200)),
                ('description', models.TextField(blank=True)),
                ('visitor_info', models.TextField(blank=True)),
                ('seo_title', models.CharField(blank=True, max_length=120)),
                ('seo_description', models.CharField(blank=True, max_length=320)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='geography.attraction')),
            ],
            options={
                'verbose_name': 'attraction translation',
                'db_table': 'geography_attraction_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='geography_attraction_translation_unique_language')],
            },
        ),
        migrations.CreateModel(
            name='DestinationPhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('position', models.PositiveIntegerField(default=0)),
                ('asset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='media_library.mediaasset')),
                ('destination', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gallery_items', to='geography.destination')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
                'constraints': [models.UniqueConstraint(fields=('destination', 'asset'), name='unique_destination_photo')],
            },
        ),
        migrations.CreateModel(
            name='DestinationTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('name', models.CharField(blank=True, max_length=160)),
                ('tagline', models.CharField(blank=True, max_length=200)),
                ('summary', models.TextField(blank=True)),
                ('description', models.TextField(blank=True)),
                ('seo_title', models.CharField(blank=True, max_length=120)),
                ('seo_description', models.CharField(blank=True, max_length=320)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='geography.destination')),
            ],
            options={
                'verbose_name': 'destination translation',
                'db_table': 'geography_destination_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='geography_destination_translation_unique_language')],
            },
        ),
        migrations.CreateModel(
            name='JourneySceneTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('title', models.CharField(blank=True, max_length=160)),
                ('subtitle', models.CharField(blank=True, max_length=200)),
                ('description', models.TextField(blank=True)),
                ('cta_label', models.CharField(blank=True, max_length=60)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='geography.journeyscene')),
            ],
            options={
                'verbose_name': 'journey scene translation',
                'db_table': 'geography_journeyscene_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='geography_journeyscene_translation_unique_language')],
            },
        ),
        migrations.CreateModel(
            name='RegionPhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('position', models.PositiveIntegerField(default=0)),
                ('asset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='media_library.mediaasset')),
                ('region', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gallery_items', to='geography.region')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
                'constraints': [models.UniqueConstraint(fields=('region', 'asset'), name='unique_region_photo')],
            },
        ),
        migrations.CreateModel(
            name='RegionTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('name', models.CharField(blank=True, max_length=120)),
                ('tagline', models.CharField(blank=True, max_length=200)),
                ('description', models.TextField(blank=True)),
                ('nature', models.TextField(blank=True)),
                ('highlights', models.TextField(blank=True)),
                ('key_places', models.CharField(blank=True, max_length=255)),
                ('seo_title', models.CharField(blank=True, max_length=120)),
                ('seo_description', models.CharField(blank=True, max_length=320)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='geography.region')),
            ],
            options={
                'verbose_name': 'region translation',
                'db_table': 'geography_region_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='geography_region_translation_unique_language')],
            },
        ),
        migrations.AddConstraint(
            model_name='region',
            constraint=models.CheckConstraint(condition=models.Q(('recommended_days_max__gte', models.F('recommended_days_min'))), name='region_recommended_days_range'),
        ),
        migrations.AddConstraint(
            model_name='seasontranslation',
            constraint=models.UniqueConstraint(fields=('master', 'language'), name='geography_season_translation_unique_language'),
        ),
        migrations.AddConstraint(
            model_name='travelstyletranslation',
            constraint=models.UniqueConstraint(fields=('master', 'language'), name='geography_travelstyle_translation_unique_language'),
        ),
    ]

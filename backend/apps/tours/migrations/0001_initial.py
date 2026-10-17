import django.core.validators
import django.db.models.deletion
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('geography', '0001_initial'),
        ('media_library', '0001_initial'),
        ('people', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Route',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(db_index=True, default=True)),
                ('position', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_demo', models.BooleanField(default=False)),
                ('slug', models.SlugField(max_length=120, unique=True)),
                ('distance_km', models.PositiveIntegerField(default=0, validators=[django.core.validators.MaxValueValidator(10000)])),
                ('duration_days', models.PositiveSmallIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(60)])),
                ('difficulty', models.CharField(choices=[('easy', 'Easy'), ('moderate', 'Moderate'), ('challenging', 'Challenging'), ('expert', 'Expert')], default='moderate', max_length=20)),
                ('is_featured', models.BooleanField(db_index=True, default=False)),
                ('cover', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
                ('regions', models.ManyToManyField(blank=True, related_name='routes', to='geography.region')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='RouteStop',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('position', models.PositiveIntegerField(default=0)),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('nights', models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MaxValueValidator(30)])),
                ('attraction', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='route_stops', to='geography.attraction')),
                ('route', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stops', to='tours.route')),
            ],
            options={
                'ordering': ('position', 'id'),
            },
        ),
        migrations.CreateModel(
            name='Tour',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(db_index=True, default=True)),
                ('position', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_demo', models.BooleanField(default=False)),
                ('slug', models.SlugField(max_length=120, unique=True)),
                ('price', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(Decimal('0'))])),
                ('currency', models.CharField(choices=[('USD', 'USD'), ('EUR', 'EUR'), ('KGS', 'KGS')], default='USD', max_length=3)),
                ('duration_days', models.PositiveSmallIntegerField(db_index=True, default=1, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(60)])),
                ('group_size_min', models.PositiveSmallIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)])),
                ('group_size_max', models.PositiveSmallIntegerField(default=8, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(100)])),
                ('difficulty', models.CharField(choices=[('easy', 'Easy'), ('moderate', 'Moderate'), ('challenging', 'Challenging'), ('expert', 'Expert')], db_index=True, default='moderate', max_length=20)),
                ('is_featured', models.BooleanField(db_index=True, default=False)),
                ('attractions', models.ManyToManyField(blank=True, related_name='tours', to='geography.attraction')),
                ('cover', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
                ('destinations', models.ManyToManyField(blank=True, related_name='tours', to='geography.destination')),
                ('guide', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tours', to='people.guide')),
                ('region', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='tours', to='geography.region')),
                ('route', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tours', to='tours.route')),
                ('seasons', models.ManyToManyField(blank=True, related_name='tours', to='geography.season')),
                ('travel_styles', models.ManyToManyField(blank=True, related_name='tours', to='geography.travelstyle')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='TourDay',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('position', models.PositiveIntegerField(default=0)),
                ('tour', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='days', to='tours.tour')),
            ],
            options={
                'ordering': ('position', 'id'),
            },
        ),
        migrations.CreateModel(
            name='TourDayTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('title', models.CharField(blank=True, max_length=200)),
                ('description', models.TextField(blank=True)),
                ('accommodation', models.CharField(blank=True, max_length=200)),
                ('meals', models.CharField(blank=True, max_length=120)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='tours.tourday')),
            ],
            options={
                'verbose_name': 'tour day translation',
                'db_table': 'tours_tourday_translation',
            },
        ),
        migrations.CreateModel(
            name='TourPhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('position', models.PositiveIntegerField(default=0)),
                ('asset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='media_library.mediaasset')),
                ('tour', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gallery_items', to='tours.tour')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='TourTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('title', models.CharField(blank=True, max_length=160)),
                ('tagline', models.CharField(blank=True, max_length=200)),
                ('summary', models.TextField(blank=True)),
                ('description', models.TextField(blank=True)),
                ('included', models.TextField(blank=True)),
                ('excluded', models.TextField(blank=True)),
                ('meeting_point', models.CharField(blank=True, max_length=255)),
                ('seo_title', models.CharField(blank=True, max_length=120)),
                ('seo_description', models.CharField(blank=True, max_length=320)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='tours.tour')),
            ],
            options={
                'verbose_name': 'tour translation',
                'db_table': 'tours_tour_translation',
            },
        ),
        migrations.CreateModel(
            name='RouteStopTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('title', models.CharField(blank=True, max_length=160)),
                ('description', models.TextField(blank=True)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='tours.routestop')),
            ],
            options={
                'verbose_name': 'route stop translation',
                'db_table': 'tours_routestop_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='tours_routestop_translation_unique_language')],
            },
        ),
        migrations.CreateModel(
            name='RouteTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('title', models.CharField(blank=True, max_length=160)),
                ('summary', models.TextField(blank=True)),
                ('description', models.TextField(blank=True)),
                ('seo_title', models.CharField(blank=True, max_length=120)),
                ('seo_description', models.CharField(blank=True, max_length=320)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='tours.route')),
            ],
            options={
                'verbose_name': 'route translation',
                'db_table': 'tours_route_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='tours_route_translation_unique_language')],
            },
        ),
        migrations.AddIndex(
            model_name='tour',
            index=models.Index(fields=['price'], name='tours_tour_price_674fc5_idx'),
        ),
        migrations.AddIndex(
            model_name='tour',
            index=models.Index(fields=['is_published', 'position'], name='tours_tour_is_publ_51ef2f_idx'),
        ),
        migrations.AddConstraint(
            model_name='tour',
            constraint=models.CheckConstraint(condition=models.Q(('group_size_max__gte', models.F('group_size_min'))), name='tour_group_size_range'),
        ),
        migrations.AddConstraint(
            model_name='tourdaytranslation',
            constraint=models.UniqueConstraint(fields=('master', 'language'), name='tours_tourday_translation_unique_language'),
        ),
        migrations.AddConstraint(
            model_name='tourphoto',
            constraint=models.UniqueConstraint(fields=('tour', 'asset'), name='unique_tour_photo'),
        ),
        migrations.AddConstraint(
            model_name='tourtranslation',
            constraint=models.UniqueConstraint(fields=('master', 'language'), name='tours_tour_translation_unique_language'),
        ),
    ]

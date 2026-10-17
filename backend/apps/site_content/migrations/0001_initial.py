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
            name='FaqItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(db_index=True, default=True)),
                ('position', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_demo', models.BooleanField(default=False)),
                ('category', models.CharField(choices=[('general', 'General'), ('booking', 'Booking'), ('travel', 'Travel'), ('safety', 'Safety')], db_index=True, default='general', max_length=20)),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='InterfaceString',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('key', models.CharField(max_length=150, unique=True)),
                ('value_ru', models.TextField(blank=True)),
                ('value_en', models.TextField(blank=True)),
                ('value_ky', models.TextField(blank=True)),
            ],
            options={
                'ordering': ('key',),
            },
        ),
        migrations.CreateModel(
            name='StaticPage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('slug', models.SlugField(max_length=80, unique=True)),
                ('is_published', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ('slug',),
            },
        ),
        migrations.CreateModel(
            name='VisualSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('enable_3d', models.BooleanField(default=True)),
                ('enable_parallax', models.BooleanField(default=True)),
                ('enable_scroll_animations', models.BooleanField(default=True)),
                ('enable_hero_video', models.BooleanField(default=True)),
                ('enable_map_animations', models.BooleanField(default=True)),
                ('scene_quality', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='high', max_length=10)),
                ('particle_density', models.PositiveSmallIntegerField(default=60, validators=[django.core.validators.MaxValueValidator(100)])),
                ('parallax_intensity', models.PositiveSmallIntegerField(default=50, validators=[django.core.validators.MaxValueValidator(100)])),
                ('hero_overlay_opacity', models.PositiveSmallIntegerField(default=45, validators=[django.core.validators.MaxValueValidator(90)])),
            ],
            options={
                'verbose_name': 'visual settings',
            },
        ),
        migrations.CreateModel(
            name='PageSection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('page', models.CharField(choices=[('home', 'Home'), ('about', 'About')], db_index=True, default='home', max_length=20)),
                ('key', models.SlugField(max_length=60)),
                ('position', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_visible', models.BooleanField(default=True)),
                ('primary_link', models.CharField(blank=True, max_length=255)),
                ('secondary_link', models.CharField(blank=True, max_length=255)),
                ('items_limit', models.PositiveSmallIntegerField(default=6, validators=[django.core.validators.MaxValueValidator(24)])),
                ('animate', models.BooleanField(default=True)),
                ('background', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
                ('background_video', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
            ],
            options={
                'ordering': ('page', 'position', 'id'),
            },
        ),
        migrations.CreateModel(
            name='PageSectionTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('eyebrow', models.CharField(blank=True, max_length=120)),
                ('title', models.CharField(blank=True, max_length=200)),
                ('subtitle', models.TextField(blank=True)),
                ('body', models.TextField(blank=True)),
                ('primary_label', models.CharField(blank=True, max_length=60)),
                ('secondary_label', models.CharField(blank=True, max_length=60)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='site_content.pagesection')),
            ],
            options={
                'verbose_name': 'page section translation',
                'db_table': 'site_content_pagesection_translation',
            },
        ),
        migrations.CreateModel(
            name='SectionItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('position', models.PositiveIntegerField(default=0)),
                ('is_visible', models.BooleanField(default=True)),
                ('icon', models.CharField(blank=True, choices=[('mountain', 'mountain'), ('mountain-snow', 'mountain-snow'), ('map', 'map'), ('map-pin', 'map-pin'), ('compass', 'compass'), ('route', 'route'), ('tent', 'tent'), ('trees', 'trees'), ('sun', 'sun'), ('snowflake', 'snowflake'), ('leaf', 'leaf'), ('flower', 'flower'), ('waves', 'waves'), ('camera', 'camera'), ('users', 'users'), ('user-check', 'user-check'), ('shield-check', 'shield-check'), ('star', 'star'), ('heart', 'heart'), ('award', 'award'), ('sparkles', 'sparkles'), ('clock', 'clock'), ('calendar', 'calendar'), ('globe', 'globe'), ('languages', 'languages'), ('utensils', 'utensils'), ('music', 'music'), ('landmark', 'landmark'), ('footprints', 'footprints'), ('binoculars', 'binoculars'), ('handshake', 'handshake'), ('message-circle', 'message-circle'), ('headphones', 'headphones'), ('wallet', 'wallet'), ('bus', 'bus'), ('car', 'car')], max_length=40)),
                ('link', models.CharField(blank=True, max_length=255)),
                ('value', models.CharField(blank=True, max_length=30)),
                ('image', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
                ('section', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='site_content.pagesection')),
            ],
            options={
                'ordering': ('position', 'id'),
            },
        ),
        migrations.CreateModel(
            name='SectionItemTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('title', models.CharField(blank=True, max_length=160)),
                ('text', models.TextField(blank=True)),
                ('label', models.CharField(blank=True, max_length=80)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='site_content.sectionitem')),
            ],
            options={
                'verbose_name': 'section item translation',
                'db_table': 'site_content_sectionitem_translation',
            },
        ),
        migrations.CreateModel(
            name='SeoPage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('key', models.CharField(choices=[('home', 'Home'), ('destinations', 'Destinations'), ('regions', 'Regions'), ('tours', 'Tours'), ('routes', 'Routes'), ('guides', 'Guides'), ('about', 'About'), ('reviews', 'Reviews'), ('blog', 'Blog'), ('contact', 'Contact'), ('faq', 'FAQ'), ('credits', 'Photo credits')], max_length=40, unique=True)),
                ('no_index', models.BooleanField(default=False)),
                ('og_image', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
            ],
            options={
                'ordering': ('key',),
            },
        ),
        migrations.CreateModel(
            name='SeoPageTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('title', models.CharField(blank=True, max_length=120)),
                ('description', models.CharField(blank=True, max_length=320)),
                ('keywords', models.CharField(blank=True, max_length=255)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='site_content.seopage')),
            ],
            options={
                'verbose_name': 'seo page translation',
                'db_table': 'site_content_seopage_translation',
            },
        ),
        migrations.CreateModel(
            name='SiteSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('site_name', models.CharField(default='Kyrgyzstan-Tours', max_length=80)),
                ('default_language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], default='en', max_length=5)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('phone', models.CharField(blank=True, max_length=40)),
                ('whatsapp', models.CharField(blank=True, max_length=40)),
                ('telegram', models.CharField(blank=True, max_length=80)),
                ('instagram_url', models.URLField(blank=True)),
                ('facebook_url', models.URLField(blank=True)),
                ('youtube_url', models.URLField(blank=True)),
                ('office_latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('office_longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('default_og_image', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
                ('logo', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
            ],
            options={
                'verbose_name': 'site settings',
            },
        ),
        migrations.CreateModel(
            name='SiteSettingsTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('tagline', models.CharField(blank=True, max_length=200)),
                ('footer_text', models.TextField(blank=True)),
                ('address', models.CharField(blank=True, max_length=255)),
                ('working_hours', models.CharField(blank=True, max_length=160)),
                ('copyright', models.CharField(blank=True, max_length=200)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='site_content.sitesettings')),
            ],
            options={
                'verbose_name': 'site settings translation',
                'db_table': 'site_content_sitesettings_translation',
            },
        ),
        migrations.CreateModel(
            name='StaticPageTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('title', models.CharField(blank=True, max_length=200)),
                ('body', models.TextField(blank=True)),
                ('seo_title', models.CharField(blank=True, max_length=120)),
                ('seo_description', models.CharField(blank=True, max_length=320)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='site_content.staticpage')),
            ],
            options={
                'verbose_name': 'static page translation',
                'db_table': 'site_content_staticpage_translation',
            },
        ),
        migrations.CreateModel(
            name='FaqItemTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('question', models.CharField(blank=True, max_length=255)),
                ('answer', models.TextField(blank=True)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='site_content.faqitem')),
            ],
            options={
                'verbose_name': 'faq item translation',
                'db_table': 'site_content_faqitem_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='site_content_faqitem_translation_unique_language')],
            },
        ),
        migrations.AddConstraint(
            model_name='pagesection',
            constraint=models.UniqueConstraint(fields=('page', 'key'), name='unique_section_key_per_page'),
        ),
        migrations.AddConstraint(
            model_name='pagesectiontranslation',
            constraint=models.UniqueConstraint(fields=('master', 'language'), name='site_content_pagesection_translation_unique_language'),
        ),
        migrations.AddConstraint(
            model_name='sectionitemtranslation',
            constraint=models.UniqueConstraint(fields=('master', 'language'), name='site_content_sectionitem_translation_unique_language'),
        ),
        migrations.AddConstraint(
            model_name='seopagetranslation',
            constraint=models.UniqueConstraint(fields=('master', 'language'), name='site_content_seopage_translation_unique_language'),
        ),
        migrations.AddConstraint(
            model_name='sitesettingstranslation',
            constraint=models.UniqueConstraint(fields=('master', 'language'), name='site_content_sitesettings_translation_unique_language'),
        ),
        migrations.AddConstraint(
            model_name='staticpagetranslation',
            constraint=models.UniqueConstraint(fields=('master', 'language'), name='site_content_staticpage_translation_unique_language'),
        ),
    ]

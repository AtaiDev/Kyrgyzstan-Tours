import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('geography', '0001_initial'),
        ('media_library', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SpokenLanguage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('code', models.SlugField(max_length=10, unique=True)),
                ('position', models.PositiveIntegerField(default=0)),
            ],
            options={
                'ordering': ('position', 'id'),
            },
        ),
        migrations.CreateModel(
            name='Guide',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(db_index=True, default=True)),
                ('position', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_demo', models.BooleanField(default=False)),
                ('slug', models.SlugField(max_length=120, unique=True)),
                ('experience_years', models.PositiveSmallIntegerField(default=1, validators=[django.core.validators.MaxValueValidator(60)])),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('phone', models.CharField(blank=True, max_length=40)),
                ('is_featured', models.BooleanField(db_index=True, default=False)),
                ('photo', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
                ('regions', models.ManyToManyField(blank=True, related_name='guides', to='geography.region')),
                ('travel_styles', models.ManyToManyField(blank=True, related_name='guides', to='geography.travelstyle')),
                ('languages', models.ManyToManyField(blank=True, related_name='guides', to='people.spokenlanguage')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='FounderProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('experience_years', models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MaxValueValidator(70)])),
                ('is_visible', models.BooleanField(default=True)),
                ('is_demo', models.BooleanField(default=False)),
                ('photo', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
                ('guide', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='people.guide')),
            ],
            options={
                'verbose_name': 'founder profile',
            },
        ),
        migrations.CreateModel(
            name='TeamMember',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_published', models.BooleanField(db_index=True, default=True)),
                ('position', models.PositiveIntegerField(db_index=True, default=0)),
                ('is_demo', models.BooleanField(default=False)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('photo', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
            ],
            options={
                'ordering': ('position', 'id'),
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='FounderProfileTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('name', models.CharField(blank=True, max_length=120)),
                ('role', models.CharField(blank=True, max_length=120)),
                ('headline', models.CharField(blank=True, max_length=200)),
                ('bio', models.TextField(blank=True)),
                ('quote', models.TextField(blank=True)),
                ('mission', models.TextField(blank=True)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='people.founderprofile')),
            ],
            options={
                'verbose_name': 'founder profile translation',
                'db_table': 'people_founderprofile_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='people_founderprofile_translation_unique_language')],
            },
        ),
        migrations.CreateModel(
            name='GuideTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('name', models.CharField(blank=True, max_length=120)),
                ('headline', models.CharField(blank=True, max_length=200)),
                ('bio', models.TextField(blank=True)),
                ('specialization', models.TextField(blank=True)),
                ('quote', models.CharField(blank=True, max_length=255)),
                ('seo_title', models.CharField(blank=True, max_length=120)),
                ('seo_description', models.CharField(blank=True, max_length=320)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='people.guide')),
            ],
            options={
                'verbose_name': 'guide translation',
                'db_table': 'people_guide_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='people_guide_translation_unique_language')],
            },
        ),
        migrations.CreateModel(
            name='SpokenLanguageTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('name', models.CharField(blank=True, max_length=60)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='people.spokenlanguage')),
            ],
            options={
                'verbose_name': 'spoken language translation',
                'db_table': 'people_spokenlanguage_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='people_spokenlanguage_translation_unique_language')],
            },
        ),
        migrations.CreateModel(
            name='TeamMemberTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('name', models.CharField(blank=True, max_length=120)),
                ('role', models.CharField(blank=True, max_length=120)),
                ('bio', models.TextField(blank=True)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='people.teammember')),
            ],
            options={
                'verbose_name': 'team member translation',
                'db_table': 'people_teammember_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='people_teammember_translation_unique_language')],
            },
        ),
    ]

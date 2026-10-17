import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('media_library', '0001_initial'),
        ('people', '0001_initial'),
        ('tours', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ArticleCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('slug', models.SlugField(max_length=80, unique=True)),
                ('position', models.PositiveIntegerField(default=0)),
            ],
            options={
                'verbose_name_plural': 'article categories',
                'ordering': ('position', 'id'),
            },
        ),
        migrations.CreateModel(
            name='Article',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('slug', models.SlugField(max_length=140, unique=True)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('published', 'Published')], db_index=True, default='draft', max_length=20)),
                ('published_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('is_featured', models.BooleanField(db_index=True, default=False)),
                ('is_demo', models.BooleanField(default=False)),
                ('reading_minutes', models.PositiveSmallIntegerField(default=1)),
                ('author', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='articles', to='people.teammember')),
                ('cover', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
                ('related_tours', models.ManyToManyField(blank=True, related_name='articles', to='tours.tour')),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='articles', to='blog.articlecategory')),
            ],
            options={
                'ordering': ('-published_at', '-id'),
            },
        ),
        migrations.CreateModel(
            name='ArticleCategoryTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('name', models.CharField(blank=True, max_length=80)),
                ('description', models.TextField(blank=True)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='blog.articlecategory')),
            ],
            options={
                'verbose_name': 'article category translation',
                'db_table': 'blog_articlecategory_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='blog_articlecategory_translation_unique_language')],
            },
        ),
        migrations.CreateModel(
            name='ArticleTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('title', models.CharField(blank=True, max_length=200)),
                ('excerpt', models.TextField(blank=True)),
                ('body', models.TextField(blank=True)),
                ('seo_title', models.CharField(blank=True, max_length=120)),
                ('seo_description', models.CharField(blank=True, max_length=320)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='blog.article')),
            ],
            options={
                'verbose_name': 'article translation',
                'db_table': 'blog_article_translation',
                'constraints': [models.UniqueConstraint(fields=('master', 'language'), name='blog_article_translation_unique_language')],
            },
        ),
    ]

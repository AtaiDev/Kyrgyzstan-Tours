import django.core.validators
import django.db.models.deletion
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
            name='Review',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], db_index=True, default='pending', max_length=20)),
                ('author_name', models.CharField(max_length=120)),
                ('author_country', models.CharField(blank=True, max_length=80)),
                ('author_email', models.EmailField(blank=True, max_length=254)),
                ('rating', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('travel_date', models.DateField(blank=True, null=True)),
                ('original_language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], default='en', max_length=5)),
                ('is_featured', models.BooleanField(db_index=True, default=False)),
                ('is_demo', models.BooleanField(default=False)),
                ('position', models.PositiveIntegerField(default=0)),
                ('avatar', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='media_library.mediaasset')),
                ('guide', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviews', to='people.guide')),
                ('tour', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviews', to='tours.tour')),
            ],
            options={
                'ordering': ('position', '-created_at'),
            },
        ),
        migrations.CreateModel(
            name='ReviewTranslation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], db_index=True, max_length=5)),
                ('title', models.CharField(blank=True, max_length=200)),
                ('text', models.TextField(blank=True)),
                ('master', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='translations', to='reviews.review')),
            ],
            options={
                'verbose_name': 'review translation',
                'db_table': 'reviews_review_translation',
            },
        ),
        migrations.AddConstraint(
            model_name='review',
            constraint=models.CheckConstraint(condition=models.Q(('rating__gte', 1), ('rating__lte', 5)), name='review_rating_range'),
        ),
        migrations.AddConstraint(
            model_name='reviewtranslation',
            constraint=models.UniqueConstraint(fields=('master', 'language'), name='reviews_review_translation_unique_language'),
        ),
    ]

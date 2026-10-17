import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('people', '0001_initial'),
        ('tours', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ContactMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('status', models.CharField(choices=[('new', 'New'), ('read', 'Read'), ('answered', 'Answered'), ('archived', 'Archived')], db_index=True, default='new', max_length=20)),
                ('full_name', models.CharField(max_length=150)),
                ('email', models.EmailField(max_length=254)),
                ('phone', models.CharField(blank=True, max_length=40)),
                ('subject', models.CharField(blank=True, max_length=200)),
                ('message', models.TextField()),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], default='en', max_length=5)),
                ('consent', models.BooleanField(default=False)),
                ('admin_notes', models.TextField(blank=True)),
            ],
            options={
                'ordering': ('-created_at',),
            },
        ),
        migrations.CreateModel(
            name='NewsletterSubscriber',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], default='en', max_length=5)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ('-created_at',),
            },
        ),
        migrations.CreateModel(
            name='BookingRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('status', models.CharField(choices=[('new', 'New'), ('in_progress', 'In progress'), ('confirmed', 'Confirmed'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], db_index=True, default='new', max_length=20)),
                ('full_name', models.CharField(max_length=150)),
                ('email', models.EmailField(max_length=254)),
                ('phone', models.CharField(blank=True, max_length=40)),
                ('preferred_contact', models.CharField(choices=[('email', 'Email'), ('phone', 'Phone'), ('whatsapp', 'WhatsApp'), ('telegram', 'Telegram')], default='email', max_length=20)),
                ('travel_date', models.DateField(blank=True, null=True)),
                ('travelers', models.PositiveSmallIntegerField(default=2, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(60)])),
                ('message', models.TextField(blank=True)),
                ('language', models.CharField(choices=[('ru', 'Русский'), ('en', 'English'), ('ky', 'Кыргызча')], default='en', max_length=5)),
                ('source_page', models.CharField(blank=True, max_length=255)),
                ('consent', models.BooleanField(default=False)),
                ('admin_notes', models.TextField(blank=True)),
                ('guide', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='booking_requests', to='people.guide')),
                ('handled_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                ('tour', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='booking_requests', to='tours.tour')),
            ],
            options={
                'ordering': ('-created_at',),
            },
        ),
    ]

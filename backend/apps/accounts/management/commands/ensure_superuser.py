import os

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        "Creates the first administrator from DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL and "
        "DJANGO_SUPERUSER_PASSWORD environment variables. Does nothing if the user already exists."
    )

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "").strip()
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")
        if not username or not password:
            raise CommandError("Set DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_PASSWORD before running this command.")
        user_model = get_user_model()
        if user_model.objects.filter(username=username).exists():
            self.stdout.write(f"User “{username}” already exists. Nothing changed.")
            return
        candidate = user_model(username=username, email=email)
        try:
            validate_password(password, user=candidate)
        except ValidationError as error:
            raise CommandError("Password rejected: " + " ".join(error.messages))
        user_model.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Superuser “{username}” created."))

from django.core.management.base import BaseCommand

from apps.accounts.roles import ensure_roles


class Command(BaseCommand):
    help = "Creates the default administration roles (groups) if they do not exist yet."

    def handle(self, *args, **options):
        created = ensure_roles()
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created roles: {', '.join(created)}"))
        else:
            self.stdout.write("All default roles already exist.")

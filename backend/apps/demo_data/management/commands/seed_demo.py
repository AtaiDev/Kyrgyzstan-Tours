from django.core.management.base import BaseCommand

from apps.demo_data.seeder import DemoSeeder


class Command(BaseCommand):
    help = (
        "Fills the database with demonstration content in Russian, English and Kyrgyz. "
        "Safe to run repeatedly: existing records are kept unless --force is given."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite demo records that already exist with the original demo content.",
        )
        parser.add_argument(
            "--skip-media",
            action="store_true",
            help="Do not import demo photographs and generated portraits.",
        )
        parser.add_argument(
            "--if-empty",
            action="store_true",
            help="Seed only a database without site content. Safe on every start: records deleted in the admin "
            "are not brought back.",
        )

    def handle(self, *args, **options):
        if options["if_empty"]:
            from apps.site_content.models import PageSection

            if PageSection.objects.exists():
                self.stdout.write("Site content already present: demo seed skipped.")
                return
        seeder = DemoSeeder(force=options["force"], log=self.stdout.write, with_media=not options["skip_media"])
        seeder.run()
        self.stdout.write(self.style.SUCCESS("Demo content is ready."))

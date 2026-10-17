from django.test import TestCase

from apps.blog.models import Article
from apps.demo_data.seeder import DemoSeeder
from apps.geography.models import Attraction, Region
from apps.people.models import Guide
from apps.reviews.models import Review
from apps.site_content.models import FaqItem, PageSection
from apps.tours.models import Tour


class SeederTests(TestCase):
    def run_seeder(self, **options):
        DemoSeeder(log=lambda *args: None, with_media=False, **options).run()

    def test_minimum_content_is_created(self):
        self.run_seeder()
        self.assertEqual(Region.objects.count(), 7)
        self.assertGreaterEqual(Attraction.objects.count(), 8)
        self.assertGreaterEqual(Tour.objects.count(), 8)
        self.assertGreaterEqual(Guide.objects.count(), 6)
        self.assertGreaterEqual(Review.objects.count(), 6)
        self.assertGreaterEqual(Article.objects.count(), 6)
        self.assertTrue(Guide.objects.filter(is_demo=True).exists())

    def test_all_regions_have_three_languages(self):
        self.run_seeder()
        for region in Region.objects.prefetch_related("translations"):
            self.assertEqual(region.missing_languages(), [])

    def test_repeated_runs_do_not_duplicate(self):
        self.run_seeder()
        counts = (Tour.objects.count(), FaqItem.objects.count(), PageSection.objects.count(), Review.objects.count())
        self.run_seeder()
        self.assertEqual(
            counts, (Tour.objects.count(), FaqItem.objects.count(), PageSection.objects.count(), Review.objects.count())
        )

    def test_admin_edits_survive_reseeding(self):
        self.run_seeder()
        Tour.objects.filter(slug="ala-kul-trek").update(price="999.00")
        self.run_seeder()
        self.assertEqual(str(Tour.objects.get(slug="ala-kul-trek").price), "999.00")
        self.run_seeder(force=True)
        self.assertEqual(str(Tour.objects.get(slug="ala-kul-trek").price), "390.00")

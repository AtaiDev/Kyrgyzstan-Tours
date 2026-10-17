from apps.core.testing import AdminAPITestCase
from apps.demo_data.seeder import DemoSeeder
from apps.reviews.models import Review


class ReviewTests(AdminAPITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        DemoSeeder(log=lambda *args: None, with_media=False).run()

    def submit(self):
        return self.client.post(
            "/api/public/forms/review/?lang=ru",
            {
                "author_name": "Айбек",
                "author_email": "a@example.com",
                "rating": 5,
                "tour": "ala-kul-trek",
                "text": "Очень красивый маршрут, отличный гид и вкусная еда.",
                "consent": True,
            },
            format="json",
        )

    def test_submitted_review_waits_for_moderation(self):
        before = self.client.get("/api/public/reviews/").json()["count"]
        response = self.submit()
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["status"], "pending_moderation")
        review = Review.objects.get(author_name="Айбек")
        self.assertEqual(review.original_language, "ru")
        self.assertEqual(self.client.get("/api/public/reviews/").json()["count"], before)

        client = self.client_for(self.manager)
        result = client.post("/api/admin/reviews/set_status/", {"ids": [review.pk], "status": "approved"}, format="json")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(self.client.get("/api/public/reviews/").json()["count"], before + 1)

    def test_rating_is_validated(self):
        response = self.client.post(
            "/api/public/forms/review/",
            {"author_name": "X", "author_email": "x@example.com", "rating": 9, "text": "short", "consent": True},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("rating", response.json())
        self.assertIn("text", response.json())

from apps.core.testing import AdminAPITestCase, SeededAPITestCase
from apps.demo_data.seeder import DemoSeeder
from apps.geography.models import Region
from apps.tours.models import Tour


class PublicTourTests(SeededAPITestCase):
    def test_catalog_filters(self):
        data = self.client.get("/api/public/tours/?lang=en&region=issyk-kul&difficulty=easy,moderate").json()
        self.assertGreater(data["count"], 0)
        for tour in data["results"]:
            self.assertEqual(tour["region"]["slug"], "issyk-kul")
            self.assertIn(tour["difficulty"], ("easy", "moderate"))

    def test_price_and_duration_filters(self):
        results = self.client.get("/api/public/tours/?price_max=100&duration_max=1").json()["results"]
        self.assertTrue(results)
        self.assertTrue(all(float(tour["price"]) <= 100 and tour["duration_days"] <= 1 for tour in results))

    def test_detail_is_translated(self):
        english = self.client.get("/api/public/tours/ala-kul-trek/?lang=en").json()
        kyrgyz = self.client.get("/api/public/tours/ala-kul-trek/?lang=ky").json()
        self.assertEqual(english["title"], "Ala-Kul Lake Trek")
        self.assertEqual(kyrgyz["title"], "Ала-Көлгө треккинг")
        self.assertEqual(len(english["days"]), 4)
        self.assertEqual(english["days"][0]["day"], 1)
        self.assertTrue(english["included"])
        self.assertEqual(english["route"]["slug"], "ala-kul-trail")

    def test_unpublished_tours_are_hidden(self):
        Tour.objects.filter(slug="ala-kul-trek").update(is_published=False)
        self.assertEqual(self.client.get("/api/public/tours/ala-kul-trek/").status_code, 404)

    def test_facets(self):
        facets = self.client.get("/api/public/tours/facets/").json()
        self.assertLessEqual(float(facets["price_min"]), float(facets["price_max"]))


class AdminTourTests(AdminAPITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        DemoSeeder(log=lambda *args: None, with_media=False).run()

    def payload(self, **overrides):
        data = {
            "region": Region.objects.get(slug="naryn").pk,
            "price": "199.00",
            "currency": "USD",
            "duration_days": 2,
            "group_size_min": 2,
            "group_size_max": 6,
            "difficulty": "easy",
            "translations": {
                "ru": {"title": "Новый тур", "summary": "Краткое описание"},
                "en": {"title": "New Tour", "summary": "Short summary"},
            },
            "days": [
                {"translations": {"ru": {"title": "День 1"}, "en": {"title": "Day 1"}}},
                {"translations": {"en": {"title": "Day 2"}}},
            ],
        }
        data.update(overrides)
        return data

    def test_anonymous_and_non_staff_are_rejected(self):
        self.assertEqual(self.client.get("/api/admin/tours/").status_code, 403)
        self.assertEqual(self.client_for(self.visitor).get("/api/admin/tours/").status_code, 403)

    def test_create_update_delete_with_translations(self):
        client = self.client_for(self.superuser)
        response = client.post("/api/admin/tours/", self.payload(), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        created = response.json()
        self.assertEqual(created["slug"], "new-tour")
        self.assertEqual(created["missing_translations"], ["ky"])
        self.assertEqual(len(created["days"]), 2)

        response = client.patch(
            f"/api/admin/tours/{created['id']}/",
            {"translations": {"ky": {"title": "Жаңы тур", "summary": "Кыскача"}}, "price": "250.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        updated = response.json()
        self.assertEqual(updated["missing_translations"], [])
        self.assertEqual(updated["translations"]["ru"]["title"], "Новый тур")
        self.assertEqual(updated["price"], "250.00")

        self.assertEqual(client.delete(f"/api/admin/tours/{created['id']}/").status_code, 204)
        self.assertFalse(Tour.objects.filter(pk=created["id"]).exists())

    def test_validation_errors(self):
        client = self.client_for(self.superuser)
        response = client.post(
            "/api/admin/tours/",
            self.payload(group_size_min=8, group_size_max=2, translations={"ru": {"title": ""}}),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        errors = response.json()
        self.assertIn("translations", errors)

        response = client.post("/api/admin/tours/", self.payload(group_size_min=8, group_size_max=2), format="json")
        self.assertIn("group_size_max", response.json())

        response = client.post("/api/admin/tours/", self.payload(duration_days=1), format="json")
        self.assertIn("days", response.json())

    def test_reorder_and_choices(self):
        client = self.client_for(self.superuser)
        ids = list(Tour.objects.order_by("position").values_list("pk", flat=True))
        response = client.post("/api/admin/tours/reorder/", {"ids": list(reversed(ids))}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Tour.objects.order_by("position").first().pk, ids[-1])
        choices = client.get("/api/admin/tours/choices/?search=Ала-Көл").json()
        self.assertTrue(any("Ала" in item["label"] or "Ala" in item["label"] for item in choices))

    def test_missing_language_filter(self):
        client = self.client_for(self.superuser)
        client.post("/api/admin/tours/", self.payload(), format="json")
        results = client.get("/api/admin/tours/?missing_language=ky").json()["results"]
        self.assertEqual([item["slug"] for item in results], ["new-tour"])

    def test_editor_role_cannot_delete(self):
        client = self.client_for(self.editor)
        tour = Tour.objects.first()
        self.assertEqual(client.get("/api/admin/tours/").status_code, 200)
        self.assertEqual(client.patch(f"/api/admin/tours/{tour.pk}/", {"price": "99.00"}, format="json").status_code, 200)
        self.assertEqual(client.delete(f"/api/admin/tours/{tour.pk}/").status_code, 403)

    def test_inquiry_manager_cannot_edit_tours(self):
        client = self.client_for(self.manager)
        tour = Tour.objects.first()
        self.assertEqual(client.get("/api/admin/tours/").status_code, 200)
        self.assertEqual(client.patch(f"/api/admin/tours/{tour.pk}/", {"price": "1.00"}, format="json").status_code, 403)

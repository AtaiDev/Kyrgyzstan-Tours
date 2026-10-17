from datetime import timedelta

from django.core import mail
from django.test import override_settings
from django.utils import timezone

from apps.core.testing import AdminAPITestCase
from apps.demo_data.seeder import DemoSeeder
from apps.inquiries.models import BookingRequest, ContactMessage, NewsletterSubscriber


class PublicFormTests(AdminAPITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        DemoSeeder(log=lambda *args: None, with_media=False).run()

    def booking(self, **overrides):
        data = {
            "tour": "son-kul-nomad-life",
            "full_name": "Test Traveller",
            "email": "traveller@example.com",
            "phone": "+49 000 000",
            "preferred_contact": "whatsapp",
            "travel_date": (timezone.localdate() + timedelta(days=30)).isoformat(),
            "travelers": 2,
            "message": "We would like a quiet yurt.",
            "consent": True,
        }
        data.update(overrides)
        return data

    def test_booking_is_saved_with_language(self):
        response = self.client.post("/api/public/forms/booking/?lang=ky", self.booking(), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertFalse(response.json()["team_notified"])
        booking = BookingRequest.objects.get()
        self.assertEqual(booking.language, "ky")
        self.assertEqual(booking.status, "new")
        self.assertEqual(booking.tour.slug, "son-kul-nomad-life")

    def test_booking_validation(self):
        past = (timezone.localdate() - timedelta(days=1)).isoformat()
        response = self.client.post("/api/public/forms/booking/", self.booking(consent=False, travel_date=past, phone=""), format="json")
        self.assertEqual(response.status_code, 400)
        errors = response.json()
        self.assertIn("consent", errors)
        self.assertIn("travel_date", errors)
        self.assertEqual(BookingRequest.objects.count(), 0)

    def test_honeypot_is_ignored_silently(self):
        response = self.client.post("/api/public/forms/booking/", self.booking(website="spam"), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(BookingRequest.objects.count(), 0)

    @override_settings(INQUIRY_NOTIFICATION_EMAILS=["team@example.com"], EMAIL_HOST="smtp.example.com")
    def test_notification_sent_when_email_is_configured(self):
        response = self.client.post("/api/public/forms/contact/", {
            "full_name": "Asel", "email": "asel@example.com", "subject": "Hello", "message": "A question about tours.", "consent": True,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()["team_notified"])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_newsletter_is_idempotent(self):
        first = self.client.post("/api/public/forms/newsletter/", {"email": "News@Example.com"}, format="json")
        second = self.client.post("/api/public/forms/newsletter/", {"email": "news@example.com"}, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.json()["status"], "already_subscribed")
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)

    def test_manager_updates_status_and_notes(self):
        self.client.post("/api/public/forms/booking/", self.booking(), format="json")
        booking = BookingRequest.objects.get()
        client = self.client_for(self.manager)
        response = client.patch(
            f"/api/admin/bookings/{booking.pk}/",
            {"status": "confirmed", "admin_notes": "Called the client", "full_name": "Changed"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "confirmed")
        self.assertEqual(booking.full_name, "Test Traveller")
        self.assertEqual(booking.handled_by, self.manager)

    def test_editor_cannot_read_bookings(self):
        self.assertEqual(self.client_for(self.editor).get("/api/admin/bookings/").status_code, 403)

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.languages import LANGUAGE_CHOICES
from apps.core.models import TimeStampedModel


class ContactMethod(models.TextChoices):
    EMAIL = "email", "Email"
    PHONE = "phone", "Phone"
    WHATSAPP = "whatsapp", "WhatsApp"
    TELEGRAM = "telegram", "Telegram"


class BookingRequest(TimeStampedModel):
    class Budget(models.TextChoices):
        UNDER_300 = "under_300", "до $300"
        FROM_300 = "300_700", "$300–700"
        FROM_700 = "700_1500", "$700–1500"
        OVER_1500 = "over_1500", "от $1500"
        FLEXIBLE = "flexible", "Подберите сами"

    class Status(models.TextChoices):
        NEW = "new", "New"
        IN_PROGRESS = "in_progress", "In progress"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW, db_index=True)
    tour = models.ForeignKey(
        "tours.Tour", null=True, blank=True, on_delete=models.SET_NULL, related_name="booking_requests"
    )
    guide = models.ForeignKey(
        "people.Guide", null=True, blank=True, on_delete=models.SET_NULL, related_name="booking_requests"
    )
    full_name = models.CharField(max_length=150)
    # Optional when the visitor asked to be contacted by phone or a messenger: requiring it loses those leads.
    email = models.EmailField(blank=True, db_default="")
    phone = models.CharField(max_length=40, blank=True)
    preferred_contact = models.CharField(max_length=20, choices=ContactMethod.choices, default=ContactMethod.EMAIL)
    # Lead details from the "Связаться" widget: what the visitor wants and roughly how much they plan to spend.
    destination = models.ForeignKey(
        "geography.Destination", null=True, blank=True, on_delete=models.SET_NULL, related_name="booking_requests"
    )
    budget = models.CharField(max_length=20, choices=Budget.choices, blank=True, db_default="")
    travel_date = models.DateField(null=True, blank=True)
    travelers = models.PositiveSmallIntegerField(default=2, validators=[MinValueValidator(1), MaxValueValidator(60)])
    message = models.TextField(blank=True)
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    source_page = models.CharField(max_length=255, blank=True)
    consent = models.BooleanField(default=False)
    admin_notes = models.TextField(blank=True)
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.full_name} · {self.created_at:%Y-%m-%d}"


class ContactMessage(TimeStampedModel):
    class Status(models.TextChoices):
        NEW = "new", "New"
        READ = "read", "Read"
        ANSWERED = "answered", "Answered"
        ARCHIVED = "archived", "Archived"

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW, db_index=True)
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    consent = models.BooleanField(default=False)
    admin_notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.full_name} · {self.subject or self.created_at:%Y-%m-%d}"


class NewsletterSubscriber(TimeStampedModel):
    email = models.EmailField(unique=True)
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.email

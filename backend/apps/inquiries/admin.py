from django.contrib import admin

from .models import BookingRequest, ContactMessage, NewsletterSubscriber


@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "tour", "status", "travel_date", "travelers", "created_at")
    list_filter = ("status", "language", "preferred_contact")
    search_fields = ("full_name", "email", "phone", "message")


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "subject", "status", "created_at")
    list_filter = ("status", "language")
    search_fields = ("full_name", "email", "subject", "message")


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "language", "is_active", "created_at")
    list_filter = ("language", "is_active")
    search_fields = ("email",)

from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.response import Response

from apps.core.viewsets import PublicCreateView
from apps.people.models import Guide
from apps.tours.models import Tour

from .models import BookingRequest, ContactMessage, NewsletterSubscriber
from .notifications import notify_team


def require_consent(value):
    if not value:
        raise serializers.ValidationError("Please accept the privacy policy.")
    return value


class BookingRequestSerializer(serializers.ModelSerializer):
    tour = serializers.SlugRelatedField(
        slug_field="slug", queryset=Tour.objects.filter(is_published=True), required=False, allow_null=True
    )
    guide = serializers.SlugRelatedField(
        slug_field="slug", queryset=Guide.objects.filter(is_published=True), required=False, allow_null=True
    )
    consent = serializers.BooleanField(validators=[require_consent])

    class Meta:
        model = BookingRequest
        fields = (
            "tour",
            "guide",
            "full_name",
            "email",
            "phone",
            "preferred_contact",
            "travel_date",
            "travelers",
            "message",
            "source_page",
            "consent",
        )
        extra_kwargs = {"full_name": {"min_length": 2}, "message": {"max_length": 3000}}

    def validate_travel_date(self, value):
        if value and value < timezone.localdate():
            raise serializers.ValidationError("The travel date cannot be in the past.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs.get("preferred_contact") in ("phone", "whatsapp", "telegram") and not attrs.get("phone"):
            raise serializers.ValidationError({"phone": ["Provide a phone number for the selected contact method."]})
        return attrs


class BookingRequestView(PublicCreateView):
    serializer_class = BookingRequestSerializer

    def after_create(self, instance):
        tour = instance.tour.translated_value("title", "en") if instance.tour else "—"
        self.notified = notify_team(
            f"New booking request from {instance.full_name}",
            [
                f"Tour: {tour}",
                f"Name: {instance.full_name}",
                f"Email: {instance.email}",
                f"Phone: {instance.phone or '—'}",
                f"Travel date: {instance.travel_date or '—'}",
                f"Travelers: {instance.travelers}",
                "",
                instance.message,
            ],
        )

    def build_response(self, instance):
        return {"status": "accepted", "id": instance.pk, "team_notified": getattr(self, "notified", False)}


class ContactMessageSerializer(serializers.ModelSerializer):
    consent = serializers.BooleanField(validators=[require_consent])

    class Meta:
        model = ContactMessage
        fields = ("full_name", "email", "phone", "subject", "message", "consent")
        extra_kwargs = {"full_name": {"min_length": 2}, "message": {"min_length": 10, "max_length": 5000}}


class ContactMessageView(PublicCreateView):
    serializer_class = ContactMessageSerializer

    def after_create(self, instance):
        self.notified = notify_team(
            f"New message: {instance.subject or instance.full_name}",
            [f"From: {instance.full_name} <{instance.email}>", f"Phone: {instance.phone or '—'}", "", instance.message],
        )

    def build_response(self, instance):
        return {"status": "accepted", "id": instance.pk, "team_notified": getattr(self, "notified", False)}


class NewsletterSerializer(serializers.Serializer):
    email = serializers.EmailField()


class NewsletterSubscribeView(PublicCreateView):
    serializer_class = NewsletterSerializer

    def create(self, request, *args, **kwargs):
        if request.data.get(self.honeypot_field):
            return Response({"status": "subscribed"}, status=status.HTTP_201_CREATED)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email, defaults={"language": self.get_language()}
        )
        if not created and not subscriber.is_active:
            subscriber.is_active = True
            subscriber.language = self.get_language()
            subscriber.save(update_fields=["is_active", "language", "updated_at"])
        return Response(
            {"status": "subscribed" if created else "already_subscribed"},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

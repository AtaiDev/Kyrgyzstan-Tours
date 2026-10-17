from rest_framework import serializers

from apps.core.viewsets import AdminModelViewSet

from .models import BookingRequest, ContactMessage, NewsletterSubscriber


class BookingRequestAdminSerializer(serializers.ModelSerializer):
    tour_title = serializers.SerializerMethodField()
    guide_name = serializers.SerializerMethodField()
    handled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BookingRequest
        fields = (
            "id",
            "status",
            "tour",
            "tour_title",
            "guide",
            "guide_name",
            "full_name",
            "email",
            "phone",
            "preferred_contact",
            "travel_date",
            "travelers",
            "message",
            "language",
            "source_page",
            "consent",
            "admin_notes",
            "handled_by",
            "handled_by_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "tour",
            "guide",
            "full_name",
            "email",
            "phone",
            "preferred_contact",
            "travel_date",
            "travelers",
            "message",
            "language",
            "source_page",
            "consent",
            "handled_by",
            "created_at",
            "updated_at",
        )

    def get_tour_title(self, instance) -> str | None:
        return instance.tour.translated_value("title") if instance.tour else None

    def get_guide_name(self, instance) -> str | None:
        return instance.guide.translated_value("name") if instance.guide else None

    def get_handled_by_name(self, instance) -> str | None:
        user = instance.handled_by
        return (user.get_full_name() or user.get_username()) if user else None

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request is not None:
            validated_data["handled_by"] = request.user
        return super().update(instance, validated_data)


class BookingRequestAdminViewSet(AdminModelViewSet):
    queryset = BookingRequest.objects.select_related("tour", "guide", "handled_by").prefetch_related(
        "tour__translations", "guide__translations"
    )
    serializer_class = BookingRequestAdminSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]
    filterset_fields = ("status", "tour", "guide", "language", "preferred_contact")
    search_fields = ("full_name", "email", "phone", "message", "admin_notes")
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "travel_date", "status", "travelers")


class ContactMessageAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = (
            "id",
            "status",
            "full_name",
            "email",
            "phone",
            "subject",
            "message",
            "language",
            "consent",
            "admin_notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("full_name", "email", "phone", "subject", "message", "language", "consent", "created_at", "updated_at")


class ContactMessageAdminViewSet(AdminModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageAdminSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]
    filterset_fields = ("status", "language")
    search_fields = ("full_name", "email", "subject", "message")
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "status")


class NewsletterSubscriberAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ("id", "email", "language", "is_active", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")


class NewsletterSubscriberAdminViewSet(AdminModelViewSet):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSubscriberAdminSerializer
    filterset_fields = ("language",)
    search_fields = ("email",)
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "email")
    boolean_filter_fields = ("is_active",)

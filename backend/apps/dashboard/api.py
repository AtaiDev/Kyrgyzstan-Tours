from datetime import timedelta

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.blog.models import Article
from apps.core.permissions import IsStaffUser, model_permission
from apps.core.schema import object_response
from apps.geography.models import Attraction, Destination, Region
from apps.inquiries.models import BookingRequest, ContactMessage, NewsletterSubscriber
from apps.media_library.models import MediaAsset
from apps.people.models import Guide, TeamMember
from apps.reviews.models import Review
from apps.site_content.coverage import translation_coverage
from apps.tours.models import Route, Tour

PUBLISHABLE = (
    ("regions", Region),
    ("destinations", Destination),
    ("attractions", Attraction),
    ("tours", Tour),
    ("routes", Route),
    ("guides", Guide),
    ("team", TeamMember),
)

DEMO_MODELS = (Destination, Attraction, Tour, Route, Guide, TeamMember, Review, Article, MediaAsset)


class DashboardView(APIView):
    permission_classes = [IsStaffUser]

    @object_response(summary="Dashboard statistics")
    def get(self, request):
        user = request.user

        def can_view(model):
            return user.has_perm(model_permission(model, "view"))

        counts = {}
        for key, model in PUBLISHABLE:
            if can_view(model):
                counts[key] = {
                    "total": model.objects.count(),
                    "published": model.objects.filter(is_published=True).count(),
                }
        if can_view(Article):
            counts["articles"] = {
                "total": Article.objects.count(),
                "published": Article.objects.filter(status=Article.Status.PUBLISHED).count(),
            }
        if can_view(Review):
            counts["reviews"] = {
                "total": Review.objects.count(),
                "published": Review.objects.filter(status=Review.Status.APPROVED).count(),
                "pending": Review.objects.filter(status=Review.Status.PENDING).count(),
            }
        if can_view(MediaAsset):
            counts["media"] = {"total": MediaAsset.objects.count(), "published": MediaAsset.objects.count()}

        inquiries = None
        if can_view(BookingRequest):
            since = timezone.now() - timedelta(days=29)
            per_day = {
                row["day"]: row["total"]
                for row in BookingRequest.objects.filter(created_at__gte=since)
                .annotate(day=TruncDate("created_at"))
                .values("day")
                .annotate(total=Count("id"))
            }
            today = timezone.localdate()
            chart = []
            for offset in range(29, -1, -1):
                day = today - timedelta(days=offset)
                chart.append({"date": day.isoformat(), "count": per_day.get(day, 0)})
            recent = BookingRequest.objects.select_related("tour").prefetch_related("tour__translations")[:6]
            inquiries = {
                "new": BookingRequest.objects.filter(status=BookingRequest.Status.NEW).count(),
                "in_progress": BookingRequest.objects.filter(status=BookingRequest.Status.IN_PROGRESS).count(),
                "total": BookingRequest.objects.count(),
                "chart": chart,
                "recent": [
                    {
                        "id": item.pk,
                        "full_name": item.full_name,
                        "email": item.email,
                        "status": item.status,
                        "tour_title": item.tour.translated_value("title") if item.tour else None,
                        "travelers": item.travelers,
                        "travel_date": item.travel_date,
                        "created_at": item.created_at,
                    }
                    for item in recent
                ],
            }

        messages = None
        if can_view(ContactMessage):
            messages = {
                "new": ContactMessage.objects.filter(status=ContactMessage.Status.NEW).count(),
                "total": ContactMessage.objects.count(),
                "recent": list(
                    ContactMessage.objects.values("id", "full_name", "subject", "status", "created_at")[:5]
                ),
            }

        subscribers = (
            NewsletterSubscriber.objects.filter(is_active=True).count() if can_view(NewsletterSubscriber) else None
        )
        demo_items = sum(model.objects.filter(is_demo=True).count() for model in DEMO_MODELS if can_view(model))

        return Response(
            {
                "counts": counts,
                "inquiries": inquiries,
                "messages": messages,
                "subscribers": subscribers,
                "demo_items": demo_items,
                "translations": translation_coverage(user)["summary"],
            }
        )

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .filters import BooleanParamFilter, MissingTranslationFilter
from .languages import resolve_request_language
from .pagination import AdminPagination
from .permissions import StaffModelPermissions, is_staff_user
from .schema import LANG_PARAMETER


class LanguageContextMixin:
    def get_language(self):
        return resolve_request_language(self.request)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["language"] = self.get_language()
        return context


@extend_schema_view(list=extend_schema(parameters=[LANG_PARAMETER]), retrieve=extend_schema(parameters=[LANG_PARAMETER]))
class PublicReadOnlyViewSet(LanguageContextMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_read"
    lookup_field = "slug"
    publication_filter = {"is_published": True}
    list_serializer_class = None

    def get_serializer_class(self):
        if self.action == "list" and self.list_serializer_class is not None:
            return self.list_serializer_class
        return super().get_serializer_class()

    def is_preview(self):
        return self.request.query_params.get("preview") == "1" and is_staff_user(self.request.user)

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if self.action == "retrieve" and self.is_preview():
            return queryset
        return queryset.filter(**self.publication_filter)


class PublicCreateView(LanguageContextMixin, generics.CreateAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_forms"
    honeypot_field = "website"

    def create(self, request, *args, **kwargs):
        if request.data.get(self.honeypot_field):
            return Response({"status": "accepted"}, status=status.HTTP_201_CREATED)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(language=self.get_language())
        self.after_create(instance)
        return Response(self.build_response(instance), status=status.HTTP_201_CREATED)

    def after_create(self, instance):
        return None

    def build_response(self, instance):
        return {"status": "accepted", "id": instance.pk}


class ReorderSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False, max_length=1000)


class AdminModelViewSet(viewsets.ModelViewSet):
    permission_classes = [StaffModelPermissions]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter, MissingTranslationFilter, BooleanParamFilter]
    ordering = ("position", "id")
    ordering_fields = ("position", "created_at", "updated_at", "id")
    boolean_filter_fields = ()
    lookup_value_regex = r"\d+"
    position_field = "position"

    @action(detail=False, methods=["post"], serializer_class=ReorderSerializer)
    def reorder(self, request):
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data["ids"]
        model = self.get_queryset().model
        objects = {item.pk: item for item in model.objects.filter(pk__in=ids)}
        updated = []
        for index, pk in enumerate(ids):
            item = objects.get(pk)
            if item is not None:
                setattr(item, self.position_field, index)
                updated.append(item)
        model.objects.bulk_update(updated, [self.position_field])
        return Response({"updated": len(updated)})

    @action(detail=False, methods=["get"], pagination_class=None)
    def choices(self, request):
        queryset = self.filter_queryset(self.get_queryset())[:500]
        return Response([{"id": item.pk, "label": str(item), **self.choice_extra(item)} for item in queryset])

    def choice_extra(self, item):
        return {}


class SingletonAdminView(generics.RetrieveUpdateAPIView):
    permission_classes = [StaffModelPermissions]
    model = None

    def get_queryset(self):
        return self.model.objects.all()

    def get_object(self):
        instance = self.model.load()
        self.check_object_permissions(self.request, instance)
        return instance

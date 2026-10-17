from django.contrib.auth import authenticate, get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.models import Group, Permission
from django.contrib.auth.password_validation import validate_password
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.permissions import IsStaffUser
from apps.core.schema import ARRAY_OF_STRINGS, object_response
from apps.core.viewsets import AdminModelViewSet

from .roles import ACTIONS, MANAGED_MODELS

User = get_user_model()


def serialize_user(user):
    if user.is_superuser:
        permissions = [f"{app}.{action}_{model}" for app, model, _ in MANAGED_MODELS for action in ACTIONS]
    else:
        permissions = sorted(user.get_all_permissions())
    return {
        "id": user.pk,
        "username": user.get_username(),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.get_full_name() or user.get_username(),
        "is_superuser": user.is_superuser,
        "groups": list(user.groups.values_list("name", flat=True)),
        "permissions": permissions,
    }


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [AllowAny]

    @object_response(summary="Set the CSRF cookie")
    def get(self, request):
        return Response({"status": "ok"})


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=256, trim_whitespace=False)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    @object_response(request=LoginSerializer, summary="Log in to the administration panel")
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None or not user.is_active:
            return Response({"detail": "Invalid username or password.", "code": "invalid_credentials"}, status=400)
        if not user.is_staff:
            return Response(
                {"detail": "This account has no access to the administration panel.", "code": "not_staff"},
                status=403,
            )
        login(request, user)
        return Response({"user": serialize_user(user)})


class LogoutView(APIView):
    permission_classes = [AllowAny]

    @object_response(summary="Log out")
    def post(self, request):
        logout(request)
        return Response({"status": "logged_out"})


class MeView(APIView):
    permission_classes = [AllowAny]

    @object_response(summary="Current administrator")
    def get(self, request):
        user = request.user
        if not (user.is_authenticated and user.is_staff and user.is_active):
            return Response({"user": None})
        return Response({"user": serialize_user(user)})


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(trim_whitespace=False)
    new_password = serializers.CharField(trim_whitespace=False, min_length=10, max_length=256)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": ["The current password is incorrect."]})
        validate_password(attrs["new_password"], user=user)
        return attrs


class PasswordChangeView(APIView):
    permission_classes = [IsStaffUser]

    @object_response(request=PasswordChangeSerializer, summary="Change own password")
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        update_session_auth_hash(request, request.user)
        return Response({"status": "password_changed"})


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, trim_whitespace=False)
    groups = serializers.PrimaryKeyRelatedField(many=True, queryset=Group.objects.all(), required=False)
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "groups",
            "last_login",
            "date_joined",
            "password",
            "display_name",
        )
        read_only_fields = ("last_login", "date_joined")

    def get_display_name(self, instance) -> str:
        return instance.get_full_name() or instance.get_username()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request_user = self.context["request"].user
        password = attrs.get("password")
        if self.instance is None and not password:
            raise serializers.ValidationError({"password": ["Set a password for the new user."]})
        if password:
            candidate = self.instance or User(username=attrs.get("username", ""), email=attrs.get("email", ""))
            validate_password(password, user=candidate)
        if attrs.get("is_superuser") and not request_user.is_superuser:
            raise serializers.ValidationError({"is_superuser": ["Only superusers can grant superuser status."]})
        if self.instance is not None:
            if self.instance.is_superuser and not request_user.is_superuser:
                raise serializers.ValidationError({"detail": ["Only superusers can edit superuser accounts."]})
            if self.instance.pk == request_user.pk:
                if attrs.get("is_active") is False or attrs.get("is_staff") is False:
                    raise serializers.ValidationError({"is_active": ["You cannot deactivate your own account."]})
                if attrs.get("is_superuser") is False and self.instance.is_superuser:
                    raise serializers.ValidationError({"is_superuser": ["You cannot remove your own superuser status."]})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        groups = validated_data.pop("groups", [])
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        user.groups.set(groups)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", "")
        groups = validated_data.pop("groups", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        if groups is not None:
            instance.groups.set(groups)
        return instance


class UserAdminViewSet(AdminModelViewSet):
    queryset = User.objects.prefetch_related("groups")
    serializer_class = UserAdminSerializer
    filterset_fields = ("is_active", "is_staff", "is_superuser", "groups")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)
    ordering_fields = ("username", "date_joined", "last_login", "id")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            return Response({"detail": "You cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)
        if instance.is_superuser and not request.user.is_superuser:
            return Response({"detail": "Only superusers can delete superuser accounts."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    def choice_extra(self, item):
        return {"username": item.get_username()}


@extend_schema_field(ARRAY_OF_STRINGS)
class PermissionListField(serializers.Field):
    def __init__(self, **kwargs):
        kwargs["source"] = "*"
        super().__init__(**kwargs)

    def to_representation(self, group):
        return sorted(
            f"{app_label}.{codename}"
            for app_label, codename in group.permissions.values_list("content_type__app_label", "codename")
        )

    def to_internal_value(self, data):
        if not isinstance(data, list):
            raise serializers.ValidationError("Expected a list of permission codenames.")
        allowed = {f"{app}.{action}_{model}" for app, model, _ in MANAGED_MODELS for action in ACTIONS}
        permissions = []
        for value in data:
            if value not in allowed:
                raise serializers.ValidationError(f"Unknown permission: {value}.")
            app_label, codename = value.split(".", 1)
            permission = Permission.objects.filter(content_type__app_label=app_label, codename=codename).first()
            if permission is not None:
                permissions.append(permission)
        return {"permissions": permissions}


class RoleAdminSerializer(serializers.ModelSerializer):
    permissions = PermissionListField()
    users_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ("id", "name", "permissions", "users_count")

    def get_users_count(self, instance) -> int:
        return instance.user_set.count()

    def create(self, validated_data):
        permissions = validated_data.pop("permissions", [])
        group = Group.objects.create(**validated_data)
        group.permissions.set(permissions)
        return group

    def update(self, instance, validated_data):
        permissions = validated_data.pop("permissions", None)
        instance.name = validated_data.get("name", instance.name)
        instance.save()
        if permissions is not None:
            instance.permissions.set(permissions)
        return instance


class RoleAdminViewSet(AdminModelViewSet):
    queryset = Group.objects.prefetch_related("permissions__content_type")
    serializer_class = RoleAdminSerializer
    pagination_class = None
    search_fields = ("name",)
    ordering = ("name",)
    ordering_fields = ("name", "id")

    @action(detail=False, methods=["get"], pagination_class=None)
    def catalog(self, request):
        return Response(
            [
                {
                    "label": label,
                    "model": f"{app_label}.{model}",
                    "permissions": {item: f"{app_label}.{item}_{model}" for item in ACTIONS},
                }
                for app_label, model, label in MANAGED_MODELS
            ]
        )

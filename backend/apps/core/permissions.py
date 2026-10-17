from rest_framework.permissions import BasePermission, DjangoModelPermissions


def is_staff_user(user):
    return bool(user and user.is_authenticated and user.is_active and user.is_staff)


class IsStaffUser(BasePermission):
    message = "Authentication with an administration account is required."

    def has_permission(self, request, view):
        return is_staff_user(request.user)


class StaffModelPermissions(DjangoModelPermissions):
    perms_map = {
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": ["%(app_label)s.view_%(model_name)s"],
        "HEAD": ["%(app_label)s.view_%(model_name)s"],
        "POST": ["%(app_label)s.add_%(model_name)s"],
        "PUT": ["%(app_label)s.change_%(model_name)s"],
        "PATCH": ["%(app_label)s.change_%(model_name)s"],
        "DELETE": ["%(app_label)s.delete_%(model_name)s"],
    }
    action_permissions = {"reorder": "change", "choices": "view", "bulk_upsert": "change", "set_status": "change", "folders": "view", "keys": "view", "catalog": "view"}

    def has_permission(self, request, view):
        if not is_staff_user(request.user):
            return False
        action = getattr(view, "action", None)
        if action in self.action_permissions:
            model = self._queryset(view).model
            codename = f"{model._meta.app_label}.{self.action_permissions[action]}_{model._meta.model_name}"
            return request.user.has_perm(codename)
        return super().has_permission(request, view)


def model_permission(model, action):
    return f"{model._meta.app_label}.{action}_{model._meta.model_name}"

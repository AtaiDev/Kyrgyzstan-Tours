from django.test import Client

from apps.core.testing import AdminAPITestCase


class AuthenticationTests(AdminAPITestCase):
    def test_login_requires_csrf_token(self):
        client = Client(enforce_csrf_checks=True)
        response = client.post(
            "/api/admin/auth/login/",
            {"username": "root", "password": self.password},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_login_flow_with_csrf(self):
        client = Client(enforce_csrf_checks=True)
        client.get("/api/admin/auth/csrf/")
        token = client.cookies["csrftoken"].value
        response = client.post(
            "/api/admin/auth/login/",
            {"username": "editor", "password": self.password},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 200)
        user = response.json()["user"]
        self.assertEqual(user["username"], "editor")
        self.assertIn("tours.change_tour", user["permissions"])
        self.assertNotIn("tours.delete_tour", user["permissions"])
        token = client.cookies["csrftoken"].value
        self.assertEqual(client.get("/api/admin/auth/me/").json()["user"]["username"], "editor")
        client.post("/api/admin/auth/logout/", content_type="application/json", HTTP_X_CSRFTOKEN=token)
        self.assertIsNone(client.get("/api/admin/auth/me/").json()["user"])

    def test_wrong_password_and_non_staff(self):
        client = Client()
        wrong = client.post("/api/admin/auth/login/", {"username": "root", "password": "nope"}, content_type="application/json")
        self.assertEqual(wrong.status_code, 400)
        visitor = client.post(
            "/api/admin/auth/login/", {"username": "visitor", "password": self.password}, content_type="application/json"
        )
        self.assertEqual(visitor.status_code, 403)

    def test_password_change(self):
        client = self.client_for(self.editor)
        response = client.post(
            "/api/admin/auth/password/",
            {"current_password": self.password, "new_password": "An0ther-strong-pass"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.editor.refresh_from_db()
        self.assertTrue(self.editor.check_password("An0ther-strong-pass"))


class UserManagementTests(AdminAPITestCase):
    def test_create_user_with_hashed_password(self):
        client = self.client_for(self.superuser)
        response = client.post(
            "/api/admin/users/",
            {"username": "newbie", "email": "n@example.com", "password": "Very-secure-123", "is_staff": True, "is_active": True},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertNotIn("password", response.json())
        from django.contrib.auth import get_user_model

        user = get_user_model().objects.get(username="newbie")
        self.assertTrue(user.check_password("Very-secure-123"))
        self.assertNotEqual(user.password, "Very-secure-123")

    def test_weak_password_rejected(self):
        response = self.client_for(self.superuser).post(
            "/api/admin/users/", {"username": "weak", "password": "12345"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_cannot_delete_or_deactivate_self(self):
        client = self.client_for(self.superuser)
        self.assertEqual(client.delete(f"/api/admin/users/{self.superuser.pk}/").status_code, 400)
        response = client.patch(f"/api/admin/users/{self.superuser.pk}/", {"is_active": False}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_editor_cannot_manage_users(self):
        self.assertEqual(self.client_for(self.editor).get("/api/admin/users/").status_code, 403)

    def test_roles_catalog_and_update(self):
        client = self.client_for(self.superuser)
        catalog = client.get("/api/admin/roles/catalog/").json()
        self.assertTrue(any(entry["model"] == "tours.tour" for entry in catalog))
        role = client.post("/api/admin/roles/", {"name": "Фотограф", "permissions": ["media_library.view_mediaasset"]}, format="json")
        self.assertEqual(role.status_code, 201, role.content)
        self.assertEqual(role.json()["permissions"], ["media_library.view_mediaasset"])
        invalid = client.post("/api/admin/roles/", {"name": "Bad", "permissions": ["auth.hack"]}, format="json")
        self.assertEqual(invalid.status_code, 400)

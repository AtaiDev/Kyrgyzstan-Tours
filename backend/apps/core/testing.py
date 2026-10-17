from io import BytesIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient, APITestCase

from apps.accounts.roles import ensure_roles
from apps.demo_data.seeder import DemoSeeder


def make_image_upload(name="photo.png", size=(64, 48), color=(40, 120, 160)):
    buffer = BytesIO()
    Image.new("RGB", size, color).save(buffer, "PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


class SeededAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        DemoSeeder(log=lambda *args: None, with_media=False).run()


class AdminAPITestCase(APITestCase):
    password = "Str0ng-test-pass!"

    @classmethod
    def setUpTestData(cls):
        ensure_roles()
        user_model = get_user_model()
        cls.superuser = user_model.objects.create_superuser("root", "root@example.com", cls.password)
        cls.editor = user_model.objects.create_user("editor", "editor@example.com", cls.password, is_staff=True)
        cls.editor.groups.add(Group.objects.get(name="Редактор"))
        cls.manager = user_model.objects.create_user("manager", "manager@example.com", cls.password, is_staff=True)
        cls.manager.groups.add(Group.objects.get(name="Менеджер заявок"))
        cls.visitor = user_model.objects.create_user("visitor", "visitor@example.com", cls.password)

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

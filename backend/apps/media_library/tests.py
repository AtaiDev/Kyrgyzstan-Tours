from django.core.files.uploadedfile import SimpleUploadedFile

from apps.core.testing import AdminAPITestCase, make_image_upload
from apps.geography.models import Region
from apps.media_library.models import MediaAsset
from apps.people.models import Guide


class MediaUploadTests(AdminAPITestCase):
    def upload(self, client, name="photo.png"):
        return client.post("/api/admin/media/", {"file": make_image_upload(name), "folder": "guides"}, format="multipart")

    def test_upload_creates_variants(self):
        response = self.upload(self.client_for(self.superuser))
        self.assertEqual(response.status_code, 201, response.content)
        data = response.json()
        asset = MediaAsset.objects.get(pk=data["id"])
        self.assertEqual(asset.kind, "image")
        self.assertEqual((asset.width, asset.height), (64, 48))
        self.assertTrue(asset.medium.name.endswith(".webp"))
        self.assertTrue(asset.thumbnail.name.endswith(".webp"))
        self.assertTrue(data["thumbnail_url"].startswith("/media/"))

    def test_rejects_invalid_files(self):
        client = self.client_for(self.superuser)
        fake = SimpleUploadedFile("photo.jpg", b"not an image", content_type="image/jpeg")
        self.assertEqual(client.post("/api/admin/media/", {"file": fake}, format="multipart").status_code, 400)
        script = SimpleUploadedFile("script.exe", b"MZ", content_type="application/octet-stream")
        self.assertEqual(client.post("/api/admin/media/", {"file": script}, format="multipart").status_code, 400)

    def test_replace_file_keeps_identifier(self):
        client = self.client_for(self.superuser)
        created = self.upload(client).json()
        old_name = MediaAsset.objects.get(pk=created["id"]).file.name
        response = client.patch(
            f"/api/admin/media/{created['id']}/", {"file": make_image_upload("new.png", size=(120, 80))}, format="multipart"
        )
        self.assertEqual(response.status_code, 200)
        asset = MediaAsset.objects.get(pk=created["id"])
        self.assertNotEqual(asset.file.name, old_name)
        self.assertEqual(asset.width, 120)
        self.assertFalse(asset.file.storage.exists(old_name))

    def test_assign_photo_to_guide_and_protect_deletion(self):
        client = self.client_for(self.superuser)
        asset_id = self.upload(client).json()["id"]
        response = client.post(
            "/api/admin/guides/",
            {"photo": asset_id, "experience_years": 3, "translations": {"en": {"name": "Test Guide", "headline": "Guide"}}},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["photo"]["id"], asset_id)
        conflict = client.delete(f"/api/admin/media/{asset_id}/")
        self.assertEqual(conflict.status_code, 409)
        self.assertEqual(conflict.json()["code"], "protected")
        guide_id = response.json()["id"]
        client.patch(f"/api/admin/guides/{guide_id}/", {"photo": None}, format="json")
        self.assertIsNone(Guide.objects.get(pk=guide_id).photo)
        self.assertEqual(client.delete(f"/api/admin/media/{asset_id}/").status_code, 204)

    def test_gallery_is_ordered(self):
        client = self.client_for(self.superuser)
        first = self.upload(client, "a.png").json()["id"]
        second = self.upload(client, "b.png").json()["id"]
        region = Region.objects.create(slug="talas", map_code="talas")
        response = client.patch(f"/api/admin/regions/{region.pk}/", {"gallery": [second, first]}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual([item["id"] for item in response.json()["gallery"]], [second, first])

    def test_editor_can_upload_but_not_delete(self):
        client = self.client_for(self.editor)
        asset_id = self.upload(client).json()["id"]
        self.assertEqual(client.delete(f"/api/admin/media/{asset_id}/").status_code, 403)

    def test_inquiry_manager_cannot_upload(self):
        self.assertEqual(self.upload(self.client_for(self.manager)).status_code, 403)

    def test_large_variant_only_for_big_images(self):
        client = self.client_for(self.superuser)
        big = client.post(
            "/api/admin/media/", {"file": make_image_upload("wide.png", size=(3200, 2000)), "folder": "sections"}, format="multipart"
        )
        self.assertEqual(big.status_code, 201, big.content)
        asset = MediaAsset.objects.get(pk=big.json()["id"])
        self.assertTrue(asset.large.name.endswith("-large.webp"))
        self.assertTrue(big.json()["large_url"].endswith("-large.webp"))
        small = MediaAsset.objects.get(pk=self.upload(client).json()["id"])
        self.assertFalse(small.large)
        self.assertEqual(small.large_url, small.url)

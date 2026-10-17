from apps.core.testing import AdminAPITestCase, SeededAPITestCase, make_image_upload
from apps.core.translation import save_translations
from apps.media_library.models import MediaAsset
from apps.site_content.models import InterfaceString, PageSection


class PublicSiteTests(SeededAPITestCase):
    def test_site_endpoint_is_localized(self):
        russian = self.client.get("/api/public/site/?lang=ru").json()
        kyrgyz = self.client.get("/api/public/site/", HTTP_ACCEPT_LANGUAGE="ky-KG,ky;q=0.9").json()
        self.assertEqual(russian["language"], "ru")
        self.assertEqual(kyrgyz["language"], "ky")
        self.assertNotEqual(russian["tagline"], kyrgyz["tagline"])
        self.assertEqual(russian["stats"]["regions"], 7)
        self.assertIn("home", russian["seo"])

    def test_home_sections_follow_visibility_and_order(self):
        PageSection.objects.filter(page="home", key="newsletter").update(is_visible=False)
        sections = self.client.get("/api/public/sections/home/?lang=en").json()["sections"]
        keys = [section["key"] for section in sections]
        self.assertEqual(keys[0], "hero")
        self.assertNotIn("newsletter", keys)
        self.assertEqual(sections[0]["title"], "Discover the Soul of Kyrgyzstan")

    def test_search_finds_cyrillic_content(self):
        results = self.client.get("/api/public/search/?q=СОҢ-КӨЛ&lang=ky").json()["results"]
        self.assertTrue(results["attractions"])

    def test_sitemap_lists_all_languages(self):
        response = self.client.get("/sitemap.xml")
        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        self.assertIn("/ky/tours/ala-kul-trek", content)
        self.assertIn('hreflang="en"', content)

    def test_interface_string_overrides(self):
        InterfaceString.objects.create(key="nav.tours", value_ru="Туры", value_en="", value_ky="Турлар")
        self.assertEqual(self.client.get("/api/public/interface-strings/?lang=ky").json()["strings"], {"nav.tours": "Турлар"})
        self.assertEqual(self.client.get("/api/public/interface-strings/?lang=en").json()["strings"], {})


class AdminSiteContentTests(AdminAPITestCase):
    def test_section_key_is_validated(self):
        client = self.client_for(self.superuser)
        response = client.post(
            "/api/admin/sections/",
            {"page": "home", "key": "unknown", "translations": {"en": {"title": "X"}}},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("key", response.json())

    def test_interface_strings_bulk_upsert(self):
        client = self.client_for(self.superuser)
        response = client.post(
            "/api/admin/interface-strings/bulk_upsert/",
            {"items": [{"key": "hero.cta", "value_ru": "Поехали", "value_en": "Let's go", "value_ky": ""}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(InterfaceString.objects.get(key="hero.cta").value_en, "Let's go")
        client.post("/api/admin/interface-strings/bulk_upsert/", {"items": [{"key": "hero.cta"}]}, format="json")
        self.assertFalse(InterfaceString.objects.filter(key="hero.cta").exists())

    def test_site_settings_singleton_update(self):
        client = self.client_for(self.superuser)
        response = client.patch(
            "/api/admin/site-settings/",
            {"site_name": "Kyrgyzstan-Tours", "translations": {"ky": {"tagline": "Саякат"}}},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["translations"]["ky"]["tagline"], "Саякат")

    def test_translation_coverage_report(self):
        response = self.client_for(self.superuser).get("/api/admin/translations/coverage/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("summary", response.json())

    def test_section_background_videos_in_admin_and_public_api(self):
        client = self.client_for(self.superuser)
        full, light = (
            MediaAsset.objects.create(kind=MediaAsset.Kind.VIDEO, file=f"library/{name}.mp4", original_name=f"{name}.mp4")
            for name in ("hero-2160", "hero-1080")
        )
        poster = client.post("/api/admin/media/", {"file": make_image_upload("poster.png")}, format="multipart").json()["id"]
        section = PageSection.objects.create(page="home", key="hero")
        save_translations(section, {"en": {"title": "Hero"}})
        response = client.patch(
            f"/api/admin/sections/{section.pk}/",
            {"background": poster, "background_video": full.pk, "background_video_light": light.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["background_video_light"]["id"], light.pk)
        rejected = client.patch(f"/api/admin/sections/{section.pk}/", {"background_video": poster}, format="json")
        self.assertEqual(rejected.status_code, 400)
        public = self.client.get("/api/public/sections/home/?lang=en").json()["sections"][0]
        self.assertEqual(public["background_video"]["kind"], "video")
        self.assertTrue(public["background_video_light"]["url"].endswith("hero-1080.mp4"))
        self.assertEqual(public["background"]["id"], poster)

from pathlib import Path

from django.conf import settings
from django.http import Http404
from django.test import RequestFactory, TestCase, override_settings

from apps.core.frontend import frontend_index
from apps.core.languages import fallback_chain, normalize_language
from apps.core.media import serve_media
from apps.core.translation import missing_translation_counts, save_translations
from apps.core.utils import make_slug, split_lines
from apps.geography.models import Region


class LanguageTests(TestCase):
    def test_normalizes_aliases_and_regions(self):
        self.assertEqual(normalize_language("KG"), "ky")
        self.assertEqual(normalize_language("ru-RU"), "ru")
        self.assertEqual(normalize_language("en_US"), "en")
        self.assertIsNone(normalize_language("de"))

    def test_fallback_chain_starts_with_requested_language(self):
        self.assertEqual(fallback_chain("ky")[0], "ky")
        self.assertEqual(sorted(fallback_chain("ky")), ["en", "ky", "ru"])


class TranslationTests(TestCase):
    def setUp(self):
        self.region = Region.objects.create(slug="chuy", map_code="chuy")
        save_translations(
            self.region,
            {
                "ru": {"name": "Чуйская область", "description": "Описание"},
                "en": {"name": "Chuy Region", "description": ""},
            },
        )
        self.region = Region.objects.prefetch_related("translations").get(pk=self.region.pk)

    def test_field_level_fallback(self):
        values = self.region.translated("en", ["name", "description"])
        self.assertEqual(values["name"], "Chuy Region")
        self.assertEqual(values["description"], "Описание")

    def test_missing_language_detection(self):
        self.assertEqual(self.region.missing_languages(), ["en", "ky"])
        self.assertEqual(missing_translation_counts(Region.objects.all()), {"ru": 0, "en": 1, "ky": 1})

    def test_empty_translation_rows_are_removed(self):
        save_translations(self.region, {"en": {"name": "", "description": ""}})
        self.assertFalse(self.region.translations.filter(language="en").exists())

    def test_unicode_case_insensitive_search(self):
        self.assertEqual(Region.objects.filter(translations__name__icontains="ЧУЙСКАЯ").count(), 1)


class UtilityTests(TestCase):
    def test_slug_transliterates_kyrgyz_and_russian(self):
        self.assertEqual(make_slug("Соң-Көл"), "song-kol")
        self.assertEqual(make_slug("Ысык-Көл облусу"), "ysyk-kol-oblusu")

    def test_split_lines_strips_bullets(self):
        self.assertEqual(split_lines("- one\n\n• two\n three "), ["one", "two", "three"])


class MediaRangeTests(TestCase):
    def setUp(self):
        self.root = Path(settings.MEDIA_ROOT)
        (self.root / "library").mkdir(parents=True, exist_ok=True)
        self.payload = bytes(range(256)) * 8
        (self.root / "library" / "clip.mp4").write_bytes(self.payload)
        self.factory = RequestFactory()

    def get(self, path="library/clip.mp4", **headers):
        return serve_media(self.factory.get(f"/media/{path}", **headers), path, self.root)

    def test_full_file_advertises_ranges(self):
        response = self.get()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Accept-Ranges"], "bytes")
        self.assertEqual(b"".join(response.streaming_content), self.payload)

    def test_partial_content(self):
        response = self.get(HTTP_RANGE="bytes=100-199")
        self.assertEqual(response.status_code, 206)
        self.assertEqual(response["Content-Range"], f"bytes 100-199/{len(self.payload)}")
        self.assertEqual(response["Content-Type"], "video/mp4")
        self.assertEqual(b"".join(response.streaming_content), self.payload[100:200])

    def test_open_ended_and_suffix_ranges(self):
        self.assertEqual(b"".join(self.get(HTTP_RANGE="bytes=2000-").streaming_content), self.payload[2000:])
        self.assertEqual(b"".join(self.get(HTTP_RANGE="bytes=-48").streaming_content), self.payload[-48:])

    def test_unsatisfiable_range_and_traversal(self):
        self.assertEqual(self.get(HTTP_RANGE="bytes=99999-").status_code, 416)
        with self.assertRaises(Http404):
            self.get("../settings.py", HTTP_RANGE="bytes=0-10")


class FrontendTests(TestCase):
    def test_index_is_served_for_client_routes(self):
        dist = Path(settings.MEDIA_ROOT) / "frontend-dist"
        dist.mkdir(parents=True, exist_ok=True)
        (dist / "index.html").write_text("<!doctype html><title>Kyrgyzstan-Tours</title>", encoding="utf-8")
        with override_settings(FRONTEND_DIST=dist):
            response = frontend_index(RequestFactory().get("/ru/tours/ala-kul-trek"), "ru/tours/ala-kul-trek")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "no-cache")
        self.assertIn(b"Kyrgyzstan-Tours", response.content)

    def test_missing_build_returns_not_found(self):
        with override_settings(FRONTEND_DIST=Path(settings.MEDIA_ROOT) / "missing-dist"):
            with self.assertRaises(Http404):
                frontend_index(RequestFactory().get("/"))

from datetime import date
from decimal import Decimal

from django.core.files.base import ContentFile

from apps.core.testing import SeededAPITestCase, make_image_upload
from apps.geography.attribution import terrain_credit, texture_metadata
from apps.geography.models import JourneyScene
from apps.media_library.models import MediaAsset


class JourneySceneTests(SeededAPITestCase):
    def scene_payload(self, slug, language="en"):
        scenes = self.client.get(f"/api/public/scenes/?lang={language}").json()
        results = scenes["results"] if isinstance(scenes, dict) else scenes
        return next(scene for scene in results if scene["slug"] == slug)

    def terrain_image(self, name, **credit):
        asset = MediaAsset(kind=MediaAsset.Kind.IMAGE, original_name=name, folder="terrain", **credit)
        asset.file.save(name, ContentFile(make_image_upload(name).read()), save=True)
        return asset

    def attach_terrain(self, scene, far=False):
        scene.terrain_heightmap = self.terrain_image("height.png")
        scene.terrain_texture = self.terrain_image("texture.png", **texture_metadata("2025-09-13"))
        if far:
            scene.terrain_far_heightmap = self.terrain_image("far-height.png")
            scene.terrain_far_texture = self.terrain_image("far-texture.png", **texture_metadata("2026-08-27"))
            scene.terrain_far_size_km = scene.terrain_size_km * 3
        scene.save()
        return scene.terrain_heightmap, scene.terrain_texture

    def test_seeded_scenes_describe_real_locations(self):
        scene = JourneyScene.objects.get(slug="lenin-peak")
        self.assertEqual(JourneyScene.objects.count(), 8)
        self.assertEqual(scene.terrain_center(), (39.42, 72.87))
        self.assertEqual(scene.terrain_captured_on, date(2025, 9, 14))
        self.assertGreater(scene.terrain_max_height, 7000)
        self.assertFalse(scene.has_terrain)

    def test_scene_without_terrain_assets_has_no_terrain_payload(self):
        self.assertIsNone(self.scene_payload("issyk-kul")["terrain"])

    def test_scene_with_terrain_exposes_assets_and_metadata(self):
        scene = JourneyScene.objects.get(slug="ala-kul")
        heightmap, texture = self.attach_terrain(scene)
        terrain = self.scene_payload("ala-kul")["terrain"]
        self.assertEqual(terrain["heightmap"], heightmap.url)
        self.assertEqual(terrain["texture"]["id"], texture.pk)
        self.assertIn("Copernicus Sentinel data 2025", terrain["texture"]["author"])
        self.assertEqual(terrain["latitude"], round(float(scene.terrain_latitude), 4))
        self.assertEqual(terrain["captured_on"], scene.terrain_captured_on.isoformat())
        self.assertEqual((terrain["min_height"], terrain["max_height"]), (scene.terrain_min_height, scene.terrain_max_height))
        self.assertEqual(terrain["heading"], scene.camera_heading)
        self.assertIsNone(terrain["far"])

    def test_far_terrain_ring_is_exposed_when_complete(self):
        scene = JourneyScene.objects.get(slug="tash-rabat")
        self.attach_terrain(scene, far=True)
        far = self.scene_payload("tash-rabat")["terrain"]["far"]
        self.assertEqual(far["heightmap"], scene.terrain_far_heightmap.url)
        self.assertEqual(far["size_km"], scene.terrain_size_km * 3)
        self.assertIn("Copernicus Sentinel data 2026", far["texture"]["author"])
        scene.terrain_far_size_km = None
        scene.save()
        self.assertIsNone(self.scene_payload("tash-rabat")["terrain"]["far"])

    def test_terrain_center_falls_back_to_attraction(self):
        scene = JourneyScene.objects.get(slug="son-kul")
        scene.terrain_latitude = None
        scene.terrain_longitude = None
        self.assertEqual(scene.terrain_center(), (float(scene.attraction.latitude), float(scene.attraction.longitude)))
        scene.attraction = None
        self.assertIsNone(scene.terrain_center())

    def test_texture_credit_names_sources(self):
        credit = terrain_credit("2026-08-27")
        self.assertIn("Contains modified Copernicus Sentinel data 2026", credit)
        self.assertIn("Copernicus WorldDEM-30", credit)
        self.assertEqual(Decimal("42.13"), JourneyScene.objects.get(slug="issyk-kul").terrain_latitude)

import json
from datetime import date
from decimal import Decimal
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import ProtectedError

from apps.core.languages import content_languages
from apps.core.translation import save_translations
from apps.geography.attribution import HEIGHTMAP_ALT, TERRAIN_FOLDER, TEXTURE_ALT, terrain_credit, texture_metadata
from apps.geography.models import JourneyScene
from apps.media_library.models import MediaAsset
from apps.media_library.processing import generate_variants


class Command(BaseCommand):
    help = (
        "Builds real 3D terrain for journey scenes from the Copernicus DEM GLO-30 and a cloud-free Sentinel-2 summer image. "
        "Requires the optional packages from requirements-terrain.txt and internet access."
    )

    def add_arguments(self, parser):
        parser.add_argument("slugs", nargs="*", help="Scene slugs.")
        parser.add_argument("--all", action="store_true", help="Build terrain for every scene.")
        parser.add_argument("--lat", type=float, help="Latitude of the area centre (defaults to the scene or attraction).")
        parser.add_argument("--lon", type=float, help="Longitude of the area centre.")
        parser.add_argument("--size-km", type=float, help="Side of the square area in kilometres.")
        parser.add_argument("--since", default="2022-06-01", help="Earliest image date, YYYY-MM-DD.")
        parser.add_argument("--months", default="7,8,9", help="Comma-separated months to pick images from.")
        parser.add_argument("--date", type=date.fromisoformat, help="Use the Sentinel-2 image of this day, YYYY-MM-DD.")
        parser.add_argument("--exposure", type=float, help="Brightness of the satellite image (default 3.6).")
        parser.add_argument("--saturation", type=float, help="Colour saturation of the satellite image (default 1.3).")
        parser.add_argument("--far-factor", type=float, default=3, help="Size of the distant terrain ring relative to the area; 0 skips it.")
        parser.add_argument("--export-dir", help="Write the files to this folder instead of attaching them to the scenes.")

    def handle(self, *args, **options):
        try:
            from apps.geography.terrain import GradeOptions, build_terrain
        except ImportError as error:
            raise CommandError("Install the optional terrain packages first: pip install -r requirements-terrain.txt") from error

        scenes = JourneyScene.objects.select_related("attraction", "terrain_heightmap", "terrain_texture").order_by("position", "id")
        if not options["all"]:
            if not options["slugs"]:
                raise CommandError("Pass one or more scene slugs, or --all.")
            scenes = scenes.filter(slug__in=options["slugs"])
        if not scenes:
            raise CommandError("No matching scenes.")
        if (options["lat"] is None) != (options["lon"] is None):
            raise CommandError("Pass both --lat and --lon.")
        months = tuple(int(month) for month in options["months"].split(",") if month.strip())
        grade = GradeOptions()
        if options["exposure"]:
            grade.exposure = options["exposure"]
        if options["saturation"]:
            grade.saturation = options["saturation"]
        export_dir = Path(options["export_dir"]) if options["export_dir"] else None

        for scene in scenes:
            center = (options["lat"], options["lon"]) if options["lat"] is not None else scene.terrain_center()
            if center is None:
                raise CommandError(f"{scene.slug}: set terrain coordinates or link an attraction with coordinates.")
            size_km = options["size_km"] or scene.terrain_size_km
            self.stdout.write(f"{scene.slug}: {size_km:g} km around {center[0]:.4f}, {center[1]:.4f}")
            result = build_terrain(
                center[0],
                center[1],
                size_km,
                since=options["since"],
                months=months,
                image_date=options["date"],
                far_factor=options["far_factor"],
                grade_options=grade,
                log=lambda message: self.stdout.write(f"  {message}"),
            )
            if export_dir:
                self.export(export_dir, scene.slug, result, center, size_km)
            else:
                self.attach(scene, result, center, size_km)
            near = result.near
            self.stdout.write(self.style.SUCCESS(f"  ready: {near.min_height:.0f}–{near.max_height:.0f} m, image {near.date}"))

    def export(self, folder, slug, result, center, size_km):
        folder.mkdir(parents=True, exist_ok=True)
        near, far = result.near, result.far
        (folder / f"terrain_{slug}_height.png").write_bytes(near.heightmap)
        (folder / f"terrain_{slug}_texture.webp").write_bytes(near.texture)
        meta = {
            "latitude": center[0],
            "longitude": center[1],
            "size_km": size_km,
            "date": near.date,
            "items": near.items,
            "min_height": round(near.min_height),
            "max_height": round(near.max_height),
            "credit": terrain_credit(near.date),
        }
        if far:
            (folder / f"terrain_{slug}_far_height.png").write_bytes(far.heightmap)
            (folder / f"terrain_{slug}_far_texture.webp").write_bytes(far.texture)
            meta["far"] = {"size_km": far.size_km, "date": far.date, "items": far.items, "credit": terrain_credit(far.date)}
        (folder / f"terrain_{slug}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    @transaction.atomic
    def attach(self, scene, result, center, size_km):
        titles = {language: scene.translated(language, ["title"])["title"] or scene.slug for language in content_languages()}
        near, far = result.near, result.far
        previous = [scene.terrain_heightmap, scene.terrain_texture, scene.terrain_far_heightmap, scene.terrain_far_texture]
        scene.terrain_heightmap = self.create_asset(f"terrain_{scene.slug}_height.png", near.heightmap, HEIGHTMAP_ALT, titles)
        scene.terrain_texture = self.create_asset(f"terrain_{scene.slug}_texture.webp", near.texture, TEXTURE_ALT, titles, **texture_metadata(near.date))
        scene.terrain_far_heightmap = self.create_asset(f"terrain_{scene.slug}_far_height.png", far.heightmap, HEIGHTMAP_ALT, titles) if far else None
        scene.terrain_far_texture = (
            self.create_asset(f"terrain_{scene.slug}_far_texture.webp", far.texture, TEXTURE_ALT, titles, **texture_metadata(far.date)) if far else None
        )
        scene.terrain_far_size_km = far.size_km if far else None
        scene.terrain_latitude = Decimal(f"{center[0]:.6f}")
        scene.terrain_longitude = Decimal(f"{center[1]:.6f}")
        scene.terrain_size_km = size_km
        scene.terrain_captured_on = date.fromisoformat(near.date)
        scene.terrain_min_height = round(near.min_height)
        scene.terrain_max_height = round(near.max_height)
        scene.save()
        for asset in previous:
            if asset is not None and asset.folder == TERRAIN_FOLDER:
                try:
                    asset.delete()
                except ProtectedError:
                    pass

    def create_asset(self, name, content, alt, titles, **credit):
        asset = MediaAsset(kind=MediaAsset.Kind.IMAGE, original_name=name, folder=TERRAIN_FOLDER, **credit)
        asset.file.save(name, ContentFile(content), save=True)
        generate_variants(asset)
        save_translations(asset, {language: {"alt": alt.get(language, alt["en"]).format(title=title)} for language, title in titles.items()})
        return asset

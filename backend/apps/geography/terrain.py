import json
import math
import urllib.request
from dataclasses import dataclass, field
from datetime import date
from io import BytesIO

import numpy as np
import rasterio
from PIL import Image, ImageEnhance, ImageFilter
from rasterio.enums import Resampling
from rasterio.transform import from_origin
from rasterio.warp import reproject, transform, transform_bounds

STAC_URL = "https://earth-search.aws.element84.com/v1/search"
DEM_URL = "https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif"
CLOUD_CLASSES = (3, 8, 9, 10)
SNOW_CLASS = 11
WATER_CLASS = 6
BANDS = ("red", "green", "blue")
GDAL_OPTIONS = {
    "GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
    "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif,.TIF",
    "AWS_NO_SIGN_REQUEST": "YES",
    "GDAL_HTTP_MULTIRANGE": "YES",
    "GDAL_HTTP_MERGE_CONSECUTIVE_RANGES": "YES",
    "GDAL_HTTP_MAX_RETRY": "4",
    "GDAL_HTTP_RETRY_DELAY": "2",
    "VSI_CACHE": "TRUE",
}
HEIGHT_OFFSET = 1000.0
HEIGHT_SCALE = 4.0
QUALITY_SIZE = 256
GLINT_LIMIT = 0.03
MIN_OVERLAP = 5000
METERS_PER_DEGREE = 111320
FAR_FACTOR = 3
FAR_TEXTURE_SIZE = 2048
ACCEPTABLE_INVALID = 0.15
ACCEPTABLE_CLOUD = 0.03
ALL_MONTHS = frozenset(range(1, 13))
MIN_COVERAGE = 0.97


@dataclass
class GradeOptions:
    exposure: float = 3.6
    white: float = 4.0
    saturation: float = 1.3
    black: float = 0.045


@dataclass
class TerrainLayer:
    heightmap: bytes
    texture: bytes
    date: str
    items: list[str]
    min_height: float
    max_height: float
    size_km: float
    texture_size: int


@dataclass
class TerrainResult:
    near: TerrainLayer
    far: TerrainLayer | None
    log: list[str] = field(default_factory=list)


def utm_crs(latitude, longitude):
    zone = int((longitude + 180) // 6) + 1
    return f"EPSG:{(32600 if latitude >= 0 else 32700) + zone}"


def square_grid(latitude, longitude, size_m, pixels):
    crs = utm_crs(latitude, longitude)
    xs, ys = transform("EPSG:4326", crs, [longitude], [latitude])
    half = size_m / 2
    resolution = size_m / pixels
    return {
        "crs": crs,
        "transform": from_origin(xs[0] - half, ys[0] + half, resolution, resolution),
        "bounds": (xs[0] - half, ys[0] - half, xs[0] + half, ys[0] + half),
        "shape": (pixels, pixels),
    }


def resized_grid(grid, pixels):
    west, south, east, north = grid["bounds"]
    resolution = (east - west) / pixels
    return {**grid, "transform": from_origin(west, north, resolution, resolution), "shape": (pixels, pixels)}


def texture_size_for(size_km):
    return 4096 if size_km >= 24 else 2048


def lonlat_bounds(grid):
    return transform_bounds(grid["crs"], "EPSG:4326", *grid["bounds"], densify_pts=21)


def dem_tiles(bounds):
    west, south, east, north = bounds
    for lat in range(math.floor(south), math.floor(north) + 1):
        for lon in range(math.floor(west), math.floor(east) + 1):
            ns = "N" if lat >= 0 else "S"
            ew = "E" if lon >= 0 else "W"
            yield f"Copernicus_DSM_COG_10_{ns}{abs(lat):02d}_00_{ew}{abs(lon):03d}_00_DEM"


def overview_level(source, resolution):
    pixel = abs(source.res[0]) * (METERS_PER_DEGREE if source.crs and source.crs.is_geographic else 1)
    level = None
    for index, factor in enumerate(source.overviews(1)):
        if pixel * factor <= resolution:
            level = index
    return level


def warp_into(href, band, grid, destination, resampling, nodata):
    resolution = (grid["bounds"][2] - grid["bounds"][0]) / grid["shape"][1]
    with rasterio.open(href) as probe:
        level = overview_level(probe, resolution)
    options = {} if level is None else {"overview_level": level}
    with rasterio.open(href, **options) as source:
        reproject(
            source=rasterio.band(source, band),
            destination=destination,
            dst_transform=grid["transform"],
            dst_crs=grid["crs"],
            src_nodata=nodata,
            dst_nodata=nodata,
            resampling=resampling,
        )
    return destination


def read_heights(grid):
    heights = np.full(grid["shape"], np.nan, dtype=np.float32)
    for name in dem_tiles(lonlat_bounds(grid)):
        part = warp_into(DEM_URL.format(name=name), 1, grid, np.full(grid["shape"], np.nan, dtype=np.float32), Resampling.cubic, np.nan)
        heights = np.where(np.isnan(heights), part, heights)
    if np.isnan(heights).all():
        raise RuntimeError("Copernicus DEM has no data for this area.")
    heights[np.isnan(heights)] = np.nanmedian(heights)
    return heights


def search_scenes(bounds, start, end, max_cloud):
    body = {
        "collections": ["sentinel-2-l2a"],
        "bbox": list(bounds),
        "datetime": f"{start}T00:00:00Z/{end}T23:59:59Z",
        "query": {"eo:cloud_cover": {"lt": max_cloud}},
        "limit": 200,
    }
    request = urllib.request.Request(STAC_URL, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)["features"]


def latest_versions(items):
    latest = {}
    for item in items:
        stem = item["id"].removesuffix("_L2A")
        name, _, sequence = stem.rpartition("_")
        if not sequence.isdigit():
            name, sequence = stem, "0"
        current = latest.get(name)
        if current is None or int(sequence) > current[0]:
            latest[name] = (int(sequence), item)
    return [item for _, item in latest.values()]


def polygons(geometry):
    if geometry.get("type") == "Polygon":
        return [geometry["coordinates"][0]]
    if geometry.get("type") == "MultiPolygon":
        return [polygon[0] for polygon in geometry["coordinates"]]
    return []


def inside(point, ring):
    x, y = point
    result = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            result = not result
    return result


def footprint_coverage(items, bounds, samples=24):
    west, south, east, north = bounds
    rings = [ring for item in items for ring in polygons(item.get("geometry") or {})]
    points = [(west + (east - west) * (i + 0.5) / samples, south + (north - south) * (j + 0.5) / samples) for i in range(samples) for j in range(samples)]
    covered = sum(1 for point in points if any(inside(point, ring) for ring in rings))
    return covered / len(points)


def candidate_groups(features):
    by_date = {}
    for item in features:
        by_date.setdefault(item["properties"]["datetime"][:10], []).append(item)
    ranked = sorted(by_date.items(), key=lambda pair: sum(item["properties"]["eo:cloud_cover"] for item in pair[1]) / len(pair[1]))
    for day, items in ranked:
        items = latest_versions(items)
        platforms = sorted({item["properties"].get("platform", "") for item in items})
        if len(platforms) > 1:
            for platform in platforms:
                yield day, [item for item in items if item["properties"].get("platform", "") == platform]
        yield day, items


def scene_quality(items, grid):
    small = resized_grid(grid, QUALITY_SIZE)
    parts = [warp_into(item["assets"]["scl"]["href"], 1, small, np.zeros(small["shape"], dtype=np.uint8), Resampling.nearest, 0) for item in items]
    order = sorted(range(len(items)), key=lambda index: -float((parts[index] > 0).mean()))
    classes = np.zeros(small["shape"], dtype=np.uint8)
    source = np.full(small["shape"], -1, dtype=np.int16)
    for index in order:
        empty = classes == 0
        classes[empty] = parts[index][empty]
        source[empty & (parts[index] > 0)] = index
    water = classes == WATER_CLASS
    glint = 0.0
    if water.mean() > 0.003:
        blue = np.zeros(small["shape"], dtype=np.float32)
        for index in order:
            if not (water & (source == index)).any():
                continue
            asset = items[index]["assets"]["blue"]
            scale = float(((asset.get("raster:bands") or [{}])[0]).get("scale", 0.0001))
            values = warp_into(asset["href"], 1, small, np.zeros(small["shape"], dtype=np.float32), Resampling.average, 0)
            mask = water & (source == index)
            blue[mask] = values[mask] * scale
        glint = float(blue[water].mean())
    quality = {
        "invalid": float((classes == 0).mean()),
        "cloudy": float(np.isin(classes, CLOUD_CLASSES).mean()),
        "snow": float((classes == SNOW_CLASS).mean()),
        "glint": glint,
    }
    return [items[index] for index in order], quality


def quality_score(quality, items):
    platforms = len({item["properties"].get("platform", "") for item in items})
    return (
        quality["invalid"] * 20
        + quality["cloudy"] * 4
        + max(quality["snow"] - 0.25, 0)
        + max(quality["glint"] - GLINT_LIMIT, 0) * 2
        + (platforms - 1) * 0.002
    )


def rank_scenes(grid, start, end, months, max_cloud, candidates, log, stop_score=0.001, min_coverage=MIN_COVERAGE):
    features = [item for item in search_scenes(lonlat_bounds(grid), start, end, max_cloud) if int(item["properties"]["datetime"][5:7]) in months]
    ranked = []
    bounds = lonlat_bounds(grid)
    groups = [(day, items) for day, items in candidate_groups(features) if footprint_coverage(items, bounds) >= min_coverage]
    for checked, (day, items) in enumerate(groups):
        if checked >= candidates:
            break
        ordered, quality = scene_quality(items, grid)
        score = quality_score(quality, ordered)
        log(
            f"{day}: tiles={len(items)} invalid={quality['invalid']:.3f} cloud={quality['cloudy']:.3f} "
            f"snow={quality['snow']:.3f} glint={quality['glint']:.3f} score={score:.4f}"
        )
        ranked.append((score, day, ordered, quality))
        if score < stop_score:
            break
    if not ranked:
        raise RuntimeError("No cloud-free Sentinel-2 image found for this area and period.")
    return sorted(ranked, key=lambda entry: entry[0])


def choose_scene(grid, start, end, months, max_cloud, candidates, log, min_coverage=MIN_COVERAGE):
    _, day, items, quality = rank_scenes(grid, start, end, months, max_cloud, candidates, log, min_coverage=min_coverage)[0]
    return day, items, quality


def find_scene(grid, *, image_date, preferred, since, until, months, max_cloud, candidates, note):
    if image_date:
        day = image_date.isoformat()
        return choose_scene(grid, day, day, ALL_MONTHS, 100, candidates, note, min_coverage=0)
    if preferred:
        try:
            found = choose_scene(grid, preferred, preferred, ALL_MONTHS, 100, candidates, note, min_coverage=0)
        except RuntimeError:
            found = None
        if found and found[2]["invalid"] <= ACCEPTABLE_INVALID and found[2]["cloudy"] <= ACCEPTABLE_CLOUD:
            return found
    return choose_scene(grid, since, until, months, max_cloud, candidates, note)


def water_mask(classes, blur=3):
    mask = Image.fromarray(((classes == WATER_CLASS) * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(radius=blur))
    return np.asarray(mask, dtype=np.float32) / 255


def read_water(items, grid, blur=3):
    return water_mask(read_classes(items, grid), blur)


def read_classes(items, grid):
    classes = np.zeros(grid["shape"], dtype=np.uint8)
    for item in items:
        part = warp_into(item["assets"]["scl"]["href"], 1, grid, np.zeros_like(classes), Resampling.nearest, 0)
        empty = classes == 0
        classes[empty] = part[empty]
    return classes


def cloud_mask(classes, grow=9):
    cloudy = (np.isin(classes, CLOUD_CLASSES) | (classes == 0)).astype(np.uint8) * 255
    image = Image.fromarray(cloudy, "L").filter(ImageFilter.MaxFilter(grow)).filter(ImageFilter.GaussianBlur(radius=grow / 2))
    return np.asarray(image, dtype=np.float32) / 255


def fill_clouds(reflectance, classes, grid, alternatives, note):
    remaining = cloud_mask(classes)
    for _, day, items, _ in alternatives:
        if remaining.mean() < 0.0005:
            break
        other = read_reflectance(items, grid)
        clear = 1 - cloud_mask(read_classes(items, grid), grow=5)
        clear[np.isnan(other[0])] = 0
        weight = remaining * clear
        overlap = (remaining < 0.01) & (clear > 0.99) & ~np.isnan(reflectance[0])
        for band in range(3):
            matched = np.nan_to_num(match_overlap(reflectance[band], other[band], overlap), nan=0.0)
            reflectance[band] = np.nan_to_num(reflectance[band], nan=0.0) * (1 - weight) + matched * weight
        remaining = remaining * (1 - clear)
        note(f"filled clouds from {day}, {remaining.mean() * 100:.2f}% left")
    return reflectance


def match_overlap(reference, values, overlap):
    overlap = overlap & np.isfinite(reference) & np.isfinite(values)
    if overlap.sum() < MIN_OVERLAP:
        return values
    levels = np.linspace(2, 98, 25)
    try:
        slope, intercept = np.polyfit(np.percentile(values[overlap], levels), np.percentile(reference[overlap], levels), 1)
    except np.linalg.LinAlgError:
        return values
    if not 0.7 < slope < 1.4:
        return values
    return values * slope + intercept


def read_reflectance(items, grid):
    reflectance = np.full((3, *grid["shape"]), np.nan, dtype=np.float32)
    for item in items:
        offset_applied = bool(item["properties"].get("earthsearch:boa_offset_applied"))
        for index, band in enumerate(BANDS):
            asset = item["assets"][band]
            info = (asset.get("raster:bands") or [{}])[0]
            scale = float(info.get("scale", 0.0001))
            offset = 0.0 if offset_applied else float(info.get("offset", 0.0))
            part = warp_into(asset["href"], 1, grid, np.zeros(grid["shape"], dtype=np.float32), Resampling.lanczos, 0)
            valid = part > 0
            target = reflectance[index]
            values = match_overlap(target, part * scale + offset, valid & ~np.isnan(target))
            fill = np.isnan(target) & valid
            target[fill] = values[fill]
    return reflectance


def grade(reflectance, options, water=None):
    black = options.black if water is None else options.black * (1 - water)
    rgb = np.clip(np.nan_to_num(reflectance, nan=0.0) - black, 0, None) * options.exposure
    luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
    mapped = luminance * (1 + luminance / (options.white * options.white)) / (1 + luminance)
    ratio = np.divide(mapped, luminance, out=np.zeros_like(luminance), where=luminance > 1e-6)
    out = rgb * ratio
    peak = out.max(axis=0)
    over = peak > 1
    out[:, over] /= peak[over]
    out = np.power(np.clip(out, 0, 1), 1 / 2.2)
    image = Image.fromarray((out.transpose(1, 2, 0) * 255 + 0.5).astype(np.uint8), "RGB")
    image = ImageEnhance.Color(image).enhance(options.saturation)
    image = image.filter(ImageFilter.UnsharpMask(radius=24, percent=14, threshold=0))
    return image.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))


def encode_heights(heights, water=None):
    values = np.clip(np.round((heights + HEIGHT_OFFSET) * HEIGHT_SCALE), 0, 65535).astype(np.uint32)
    rgb = np.zeros((*heights.shape, 3), dtype=np.uint8)
    rgb[..., 0] = (values >> 8) & 255
    rgb[..., 1] = values & 255
    if water is not None:
        rgb[..., 2] = np.clip(np.round(water * 255), 0, 255).astype(np.uint8)
    buffer = BytesIO()
    Image.fromarray(rgb, "RGB").save(buffer, "PNG", optimize=True)
    return buffer.getvalue()


def encode_texture(image, size):
    buffer = BytesIO()
    image.save(buffer, "WEBP", quality=88 if size > FAR_TEXTURE_SIZE else 85, method=6)
    return buffer.getvalue()


def build_layer(latitude, longitude, size_km, texture_size, height_size, grade_options, note, **search):
    size_m = size_km * 1000
    height_grid = square_grid(latitude, longitude, size_m, height_size)
    heights = read_heights(height_grid)
    note(f"{size_km:g} km: heights {heights.min():.0f}–{heights.max():.0f} m")
    image_grid = square_grid(latitude, longitude, size_m, texture_size)
    day, items, _ = find_scene(image_grid, note=note, **search)
    note(f"{size_km:g} km: using Sentinel-2 image of {day} ({len(items)} tiles)")
    reflectance = read_reflectance(items, image_grid)
    classes = read_classes(items, image_grid)
    if cloud_mask(classes).mean() > 0.0005:
        alternatives = rank_scenes(
            image_grid, search["since"], search["until"], search["months"], search["max_cloud"], search["candidates"], note, stop_score=0
        )
        alternatives = [entry for entry in alternatives if entry[1] != day and entry[3]["invalid"] < 0.05][:3]
        reflectance = fill_clouds(reflectance, classes, image_grid, alternatives, note)
    texture = grade(reflectance, grade_options, water_mask(classes))
    return TerrainLayer(
        heightmap=encode_heights(heights, read_water(items, height_grid, blur=1)),
        texture=encode_texture(texture, texture_size),
        date=day,
        items=[item["id"] for item in items],
        min_height=float(heights.min()),
        max_height=float(heights.max()),
        size_km=size_km,
        texture_size=texture_size,
    )


def build_terrain(
    latitude,
    longitude,
    size_km,
    *,
    since="2022-06-01",
    until=None,
    months=(7, 8, 9),
    image_date=None,
    max_cloud=15,
    candidates=14,
    height_size=512,
    far_factor=FAR_FACTOR,
    grade_options=None,
    log=None,
):
    messages = []

    def note(message):
        messages.append(message)
        if log:
            log(message)

    options = grade_options or GradeOptions()
    search = {"since": since, "until": until or date.today().isoformat(), "months": set(months), "max_cloud": max_cloud, "candidates": candidates}
    with rasterio.Env(**GDAL_OPTIONS):
        near = build_layer(latitude, longitude, size_km, texture_size_for(size_km), height_size, options, note, image_date=image_date, preferred=None, **search)
        far = None
        if far_factor and far_factor > 1:
            far = build_layer(
                latitude, longitude, size_km * far_factor, FAR_TEXTURE_SIZE, height_size, options, note, image_date=None, preferred=near.date, **search
            )
    return TerrainResult(near=near, far=far, log=messages)

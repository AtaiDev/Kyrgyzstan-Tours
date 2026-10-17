TERRAIN_FOLDER = "terrain"
TEXTURE_LICENSE = "Copernicus open data"
TEXTURE_LICENSE_URL = "https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice"
TEXTURE_SOURCE_URL = "https://registry.opendata.aws/sentinel-2-l2a-cogs/"
TEXTURE_ALT = {
    "ru": "Спутниковый снимок Sentinel-2: {title}",
    "en": "Sentinel-2 satellite image: {title}",
    "ky": "Sentinel-2 спутниктик сүрөтү: {title}",
}
HEIGHTMAP_ALT = {
    "ru": "Карта высот для 3D-сцены: {title}",
    "en": "Elevation map for the 3D scene: {title}",
    "ky": "3D-көрүнүш үчүн бийиктик картасы: {title}",
}


def terrain_credit(day):
    return (
        f"Contains modified Copernicus Sentinel data {str(day)[:4]}; produced using Copernicus WorldDEM-30 "
        "© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA"
    )


def texture_metadata(day):
    return {
        "author": terrain_credit(day),
        "license": TEXTURE_LICENSE,
        "license_url": TEXTURE_LICENSE_URL,
        "source_url": TEXTURE_SOURCE_URL,
    }

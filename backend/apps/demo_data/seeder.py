import json
from decimal import Decimal
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import transaction
from django.utils.dateparse import parse_date, parse_datetime

from apps.accounts.roles import ensure_roles
from apps.blog.models import Article, ArticleCategory
from apps.core.translation import save_translations
from apps.geography.attribution import HEIGHTMAP_ALT, TERRAIN_FOLDER, TEXTURE_ALT, texture_metadata
from apps.geography.models import (
    Attraction,
    AttractionPhoto,
    Destination,
    DestinationPhoto,
    JourneyScene,
    Region,
    RegionPhoto,
    Season,
    TravelStyle,
)
from apps.media_library.fields import replace_gallery
from apps.media_library.models import MediaAsset
from apps.media_library.processing import generate_variants
from apps.people.models import FounderProfile, Guide, SpokenLanguage, TeamMember
from apps.reviews.models import Review
from apps.site_content.models import FaqItem, PageSection, SectionItem, SeoPage, SiteSettings, StaticPage, VisualSettings
from apps.tours.models import Route, RouteStop, Tour, TourDay

from .content import attractions, geography, media, people, site, stories, tours
from .portraits import make_portrait

SEED_MEDIA_DIR = Path(__file__).resolve().parent / "seed_media"
LANGUAGES = ("ru", "en", "ky")


class DemoSeeder:
    def __init__(self, force=False, log=print, with_media=True):
        self.force = force
        self.with_media = with_media
        self.log = log
        self.assets = {}
        self.counters = {}

    def count(self, label, created):
        bucket = self.counters.setdefault(label, [0, 0])
        bucket[0 if created else 1] += 1

    def upsert(self, model, lookup, defaults=None, translations=None, label=None):
        defaults = defaults or {}
        instance = model.objects.filter(**lookup).first()
        created = instance is None
        if created:
            instance = model(**lookup, **defaults)
            instance.save()
        elif self.force:
            for field, value in defaults.items():
                setattr(instance, field, value)
            instance.save()
        if translations and (created or self.force):
            save_translations(instance, translations)
        self.count(label or model._meta.verbose_name_plural, created)
        return instance, created or self.force

    def run(self):
        with transaction.atomic():
            created_roles = ensure_roles()
            if created_roles:
                self.log(f"Roles created: {', '.join(created_roles)}")
            self.seed_media()
            self.seed_taxonomies()
            self.seed_regions()
            self.seed_destinations()
            self.seed_attractions()
            self.seed_scenes()
            self.seed_people()
            self.seed_routes()
            self.seed_tours()
            self.seed_reviews()
            self.seed_blog()
            self.seed_site()
        for label, (created, existing) in self.counters.items():
            self.log(f"{label}: {created} created, {existing} already present")

    def seed_media(self):
        if not self.with_media:
            return
        credits = json.loads((SEED_MEDIA_DIR / "credits.json").read_text(encoding="utf-8"))
        entries = [(key, folder, alt, {}, f"{key}.webp", MediaAsset.Kind.IMAGE) for key, (folder, alt) in media.MEDIA.items()]
        entries += [
            (key, folder, alt, caption, filename, MediaAsset.Kind.VIDEO)
            for key, (folder, filename, alt, caption) in media.VIDEOS.items()
        ]
        for key, folder, alt, caption, name, kind in entries:
            source = SEED_MEDIA_DIR / name
            asset = MediaAsset.objects.filter(original_name=name, is_demo=True).first()
            created = asset is None
            if created:
                credit = credits.get(key, {})
                asset = MediaAsset(
                    kind=kind,
                    original_name=name,
                    folder=folder,
                    is_demo=True,
                    author=credit.get("author", "")[:255],
                    license=credit.get("license", "")[:120],
                    license_url=credit.get("license_url", "")[:500],
                    source_url=credit.get("source_url", "")[:500],
                )
                asset.file.save(name, ContentFile(source.read_bytes()), save=True)
                generate_variants(asset)
                save_translations(
                    asset, {language: {"alt": alt[language], "caption": caption.get(language, "")} for language in LANGUAGES}
                )
            self.assets[key] = asset
            self.count("media assets", created)

    def portrait(self, slug, initials, palette, seed):
        if not self.with_media:
            return None
        name = f"portrait-{slug}.webp"
        asset = MediaAsset.objects.filter(original_name=name, is_demo=True).first()
        if asset is None:
            asset = MediaAsset(
                kind=MediaAsset.Kind.IMAGE,
                original_name=name,
                folder="people",
                is_demo=True,
                author="Kyrgyzstan-Tours (generated placeholder)",
            )
            asset.file.save(name, ContentFile(make_portrait(initials, palette, seed=seed)), save=True)
            generate_variants(asset)
            save_translations(
                asset,
                {
                    "ru": {"alt": "Демонстрационный портрет — замените фотографией"},
                    "en": {"alt": "Demo portrait — replace with a photograph"},
                    "ky": {"alt": "Демонстрациялык портрет — сүрөт менен алмаштырыңыз"},
                },
            )
            self.count("generated portraits", True)
        return asset

    def asset(self, key):
        return self.assets.get(key) if key else None

    def gallery(self, instance, keys):
        replace_gallery(instance, "gallery_items", [self.assets[key].pk for key in keys if key in self.assets])

    def seed_taxonomies(self):
        for index, data in enumerate(geography.SEASONS):
            self.upsert(
                Season,
                {"code": data["code"]},
                {"position": index, "months": data["months"], "image": self.asset(data["image"])},
                data["tr"],
            )
        for index, (slug, icon, names) in enumerate(geography.TRAVEL_STYLES):
            descriptions = geography.TRAVEL_STYLE_DESCRIPTIONS.get(slug, {})
            self.upsert(
                TravelStyle,
                {"slug": slug},
                {"icon": icon, "position": index},
                {language: {"name": names[language], "description": descriptions.get(language, "")} for language in LANGUAGES},
            )
        for index, (code, names) in enumerate(people.SPOKEN_LANGUAGES):
            self.upsert(
                SpokenLanguage,
                {"code": code},
                {"position": index},
                {language: {"name": names[language]} for language in LANGUAGES},
            )

    def seed_regions(self):
        for index, data in enumerate(geography.REGIONS):
            region, changed = self.upsert(
                Region,
                {"slug": data["slug"]},
                {
                    "map_code": data["map_code"],
                    "accent_color": data["accent_color"],
                    "cover": self.asset(data["cover"]),
                    "area_km2": data["area_km2"],
                    "recommended_days_min": data["days"][0],
                    "recommended_days_max": data["days"][1],
                    "position": index,
                },
                data["tr"],
            )
            if changed:
                region.seasons.set(Season.objects.filter(code__in=data["seasons"]))
                self.gallery(region, data["gallery"])

    def seed_destinations(self):
        for index, data in enumerate(geography.DESTINATIONS):
            destination, changed = self.upsert(
                Destination,
                {"slug": data["slug"]},
                {
                    "region": Region.objects.get(slug=data["region"]),
                    "cover": self.asset(data["cover"]),
                    "latitude": Decimal(str(data["coords"][0])),
                    "longitude": Decimal(str(data["coords"][1])),
                    "is_featured": data["featured"],
                    "position": index,
                },
                data["tr"],
            )
            if changed:
                destination.travel_styles.set(TravelStyle.objects.filter(slug__in=data["styles"]))
                destination.seasons.set(Season.objects.filter(code__in=data["seasons"]))
                self.gallery(destination, data["gallery"])

    def seed_attractions(self):
        for index, data in enumerate(attractions.ATTRACTIONS):
            attraction, changed = self.upsert(
                Attraction,
                {"slug": data["slug"]},
                {
                    "region": Region.objects.get(slug=data["region"]),
                    "destination": Destination.objects.filter(slug=data["destination"]).first() if data["destination"] else None,
                    "kind": data["kind"],
                    "cover": self.asset(data["cover"]),
                    "latitude": Decimal(str(data["coords"][0])),
                    "longitude": Decimal(str(data["coords"][1])),
                    "altitude_m": data["altitude"],
                    "is_featured": data["featured"],
                    "position": index,
                },
                data["tr"],
            )
            if changed:
                attraction.seasons.set(Season.objects.filter(code__in=data["seasons"]))
                self.gallery(attraction, data["gallery"])

    def seed_scenes(self):
        for index, data in enumerate(attractions.SCENES):
            terrain = data["terrain"]
            meta = json.loads((SEED_MEDIA_DIR / f"terrain_{data['slug']}.json").read_text(encoding="utf-8"))
            titles = {language: values["title"] for language, values in data["tr"].items()}
            far = meta.get("far")
            self.upsert(
                JourneyScene,
                {"slug": data["slug"]},
                {
                    "attraction": Attraction.objects.filter(slug=data["attraction"]).first(),
                    "photo": self.asset(data["photo"]),
                    "sky_color": data["sky"],
                    "fog_color": data["fog"],
                    "terrain_heightmap": self.terrain_asset(f"terrain_{data['slug']}_height.png", HEIGHTMAP_ALT, titles),
                    "terrain_texture": self.terrain_asset(
                        f"terrain_{data['slug']}_texture.webp", TEXTURE_ALT, titles, **texture_metadata(meta["date"])
                    ),
                    "terrain_far_heightmap": self.terrain_asset(f"terrain_{data['slug']}_far_height.png", HEIGHTMAP_ALT, titles) if far else None,
                    "terrain_far_texture": (
                        self.terrain_asset(f"terrain_{data['slug']}_far_texture.webp", TEXTURE_ALT, titles, **texture_metadata(far["date"]))
                        if far
                        else None
                    ),
                    "terrain_far_size_km": far["size_km"] if far else None,
                    "terrain_latitude": Decimal(str(terrain["lat"])),
                    "terrain_longitude": Decimal(str(terrain["lon"])),
                    "terrain_size_km": terrain["size_km"],
                    "terrain_exaggeration": terrain["exaggeration"],
                    "terrain_captured_on": parse_date(meta["date"]),
                    "terrain_min_height": meta["min_height"],
                    "terrain_max_height": meta["max_height"],
                    "camera_heading": terrain["heading"],
                    "camera_motion": terrain["motion"],
                    "position": index,
                },
                data["tr"],
            )

    def terrain_asset(self, name, alt, titles, **credit):
        if not self.with_media:
            return None
        asset = MediaAsset.objects.filter(original_name=name, is_demo=True).first()
        created = asset is None
        if created:
            asset = MediaAsset(kind=MediaAsset.Kind.IMAGE, original_name=name, folder=TERRAIN_FOLDER, is_demo=True, **credit)
            asset.file.save(name, ContentFile((SEED_MEDIA_DIR / name).read_bytes()), save=True)
            generate_variants(asset)
            save_translations(asset, {language: {"alt": alt[language].format(title=title)} for language, title in titles.items()})
        self.count("media assets", created)
        return asset

    def seed_people(self):
        for index, data in enumerate(people.GUIDES):
            guide, changed = self.upsert(
                Guide,
                {"slug": data["slug"]},
                {
                    "photo": self.portrait(data["slug"], data["initials"], data["palette"], index + 1),
                    "experience_years": data["experience"],
                    "is_featured": data["featured"],
                    "is_demo": True,
                    "position": index,
                },
                data["tr"],
            )
            if changed:
                guide.languages.set(SpokenLanguage.objects.filter(code__in=data["languages"]))
                guide.regions.set(Region.objects.filter(slug__in=data["regions"]))
                guide.travel_styles.set(TravelStyle.objects.filter(slug__in=data["styles"]))

        self.team = []
        for index, data in enumerate(people.TEAM):
            english_name = data["tr"]["en"]["name"]
            existing = TeamMember.objects.filter(translations__language="en", translations__name=english_name).first()
            created = existing is None
            if created or self.force:
                member = existing or TeamMember()
                member.photo = self.portrait(f"team-{index}", data["initials"], data["palette"], index + 11)
                member.position = index
                member.is_demo = True
                member.save()
                save_translations(member, data["tr"])
                existing = member
            self.count("team members", created)
            self.team.append(existing)

        founder = FounderProfile.load()
        if not founder.translations.exists() or self.force:
            data = people.FOUNDER
            founder.photo = self.portrait("founder", data["initials"], data["palette"], 21)
            founder.experience_years = data["experience"]
            founder.guide = Guide.objects.filter(slug=data["guide"]).first()
            founder.is_demo = True
            founder.is_visible = True
            founder.save()
            save_translations(founder, data["tr"])
            self.count("founder profile", True)

    def seed_routes(self):
        for index, data in enumerate(tours.ROUTES):
            route, changed = self.upsert(
                Route,
                {"slug": data["slug"]},
                {
                    "cover": self.asset(data["cover"]),
                    "distance_km": data["distance"],
                    "duration_days": data["duration"],
                    "difficulty": data["difficulty"],
                    "is_featured": data["featured"],
                    "is_demo": True,
                    "position": index,
                },
                data["tr"],
            )
            if changed:
                route.regions.set(Region.objects.filter(slug__in=data["regions"]))
                route.stops.all().delete()
                for position, (coords, nights, attraction_slug, titles) in enumerate(data["stops"]):
                    stop = RouteStop.objects.create(
                        route=route,
                        position=position,
                        latitude=Decimal(str(coords[0])),
                        longitude=Decimal(str(coords[1])),
                        nights=nights,
                        attraction=Attraction.objects.filter(slug=attraction_slug).first() if attraction_slug else None,
                    )
                    save_translations(
                        stop,
                        {language: {"title": titles[language][0], "description": titles[language][1]} for language in LANGUAGES},
                    )

    def seed_tours(self):
        for index, data in enumerate(tours.TOURS):
            translations = {
                language: {
                    **data["tr"][language],
                    "included": tours.INCLUDED_BASE[language],
                    "excluded": tours.EXCLUDED_BASE[language],
                    "seo_title": data["tr"][language]["title"],
                    "seo_description": data["tr"][language]["summary"][:320],
                }
                for language in LANGUAGES
            }
            tour, changed = self.upsert(
                Tour,
                {"slug": data["slug"]},
                {
                    "region": Region.objects.get(slug=data["region"]),
                    "guide": Guide.objects.filter(slug=data["guide"]).first(),
                    "route": Route.objects.filter(slug=data["route"]).first() if data["route"] else None,
                    "cover": self.asset(data["cover"]),
                    "price": Decimal(data["price"]),
                    "currency": Tour.Currency.USD,
                    "duration_days": data["duration"],
                    "group_size_min": data["group"][0],
                    "group_size_max": data["group"][1],
                    "difficulty": data["difficulty"],
                    "is_featured": data["featured"],
                    "is_demo": True,
                    "position": index,
                },
                translations,
            )
            if changed:
                tour.destinations.set(Destination.objects.filter(slug__in=data["destinations"]))
                tour.attractions.set(Attraction.objects.filter(slug__in=data["attractions"]))
                tour.travel_styles.set(TravelStyle.objects.filter(slug__in=data["styles"]))
                tour.seasons.set(Season.objects.filter(code__in=data["seasons"]))
                self.gallery(tour, data["gallery"])
                tour.days.all().delete()
                for position, entry in enumerate(data["days"]):
                    tour_day = TourDay.objects.create(tour=tour, position=position)
                    save_translations(
                        tour_day,
                        {
                            language: dict(zip(("title", "description", "accommodation", "meals"), entry[language]))
                            for language in LANGUAGES
                        },
                    )

    def seed_reviews(self):
        for index, data in enumerate(stories.REVIEWS):
            tour = Tour.objects.filter(slug=data["tour"]).first()
            self.upsert(
                Review,
                {"author_name": data["author"], "tour": tour},
                {
                    "author_country": data["country"],
                    "rating": data["rating"],
                    "guide": Guide.objects.filter(slug=data["guide"]).first(),
                    "travel_date": parse_date(data["date"]),
                    "original_language": data["original"],
                    "status": Review.Status.APPROVED,
                    "is_featured": data["featured"],
                    "is_demo": True,
                    "position": index,
                },
                {language: {"title": values[0], "text": values[1]} for language, values in data["tr"].items()},
            )

    def seed_blog(self):
        for index, (slug, names) in enumerate(stories.ARTICLE_CATEGORIES):
            self.upsert(
                ArticleCategory,
                {"slug": slug},
                {"position": index},
                {language: {"name": names[language]} for language in LANGUAGES},
            )
        for data in stories.ARTICLES:
            author = self.team[data["author"]] if data["author"] < len(self.team) else None
            article, changed = self.upsert(
                Article,
                {"slug": data["slug"]},
                {
                    "category": ArticleCategory.objects.get(slug=data["category"]),
                    "cover": self.asset(data["cover"]),
                    "author": author,
                    "status": Article.Status.PUBLISHED,
                    "published_at": parse_datetime(data["published"]),
                    "is_featured": data["featured"],
                    "is_demo": True,
                },
                data["tr"],
            )
            if changed:
                article.related_tours.set(Tour.objects.filter(slug__in=data["tours"]))
                article.update_reading_time()

    def seed_site(self):
        settings_data = site.SITE_SETTINGS
        site_settings = SiteSettings.load()
        if not site_settings.translations.exists() or self.force:
            site_settings.site_name = settings_data["site_name"]
            site_settings.default_language = settings_data["default_language"]
            site_settings.email = settings_data["email"]
            site_settings.phone = settings_data["phone"]
            site_settings.whatsapp = settings_data["whatsapp"]
            site_settings.telegram = settings_data["telegram"]
            site_settings.instagram_url = settings_data["instagram_url"]
            site_settings.facebook_url = settings_data["facebook_url"]
            site_settings.youtube_url = settings_data["youtube_url"]
            site_settings.office_latitude = Decimal(str(settings_data["office"][0]))
            site_settings.office_longitude = Decimal(str(settings_data["office"][1]))
            site_settings.default_og_image = self.asset(settings_data["og_image"])
            site_settings.save()
            save_translations(site_settings, settings_data["tr"])
            self.count("site settings", True)
        VisualSettings.load()

        self.seed_sections(PageSection.Page.HOME, site.HOME_SECTIONS, site.HOME_SECTION_ITEMS)
        self.seed_sections(PageSection.Page.ABOUT, site.ABOUT_SECTIONS, site.ABOUT_SECTION_ITEMS)

        for key, values in site.SEO_PAGES.items():
            self.upsert(
                SeoPage,
                {"key": key},
                {"og_image": self.asset("hero_glacier") if key == "home" else None},
                {language: {"title": values[language][0], "description": values[language][1]} for language in LANGUAGES},
            )

        for index, (category, values) in enumerate(site.FAQ):
            question = values["en"][0]
            existing = FaqItem.objects.filter(translations__language="en", translations__question=question).first()
            if existing is None or self.force:
                item = existing or FaqItem()
                item.category = category
                item.position = index
                item.is_demo = True
                item.save()
                save_translations(
                    item, {language: {"question": values[language][0], "answer": values[language][1]} for language in LANGUAGES}
                )
            self.count("faq items", existing is None)

        for slug, values in site.STATIC_PAGES.items():
            self.upsert(
                StaticPage,
                {"slug": slug},
                {"is_published": True},
                {
                    language: {"title": values[language][0], "body": values[language][1], "seo_title": values[language][0]}
                    for language in LANGUAGES
                },
            )

    def seed_sections(self, page, sections, section_items):
        for index, data in enumerate(sections):
            section, changed = self.upsert(
                PageSection,
                {"page": page, "key": data["key"]},
                {
                    "position": index,
                    "background": self.asset(data.get("background")),
                    "background_video": self.asset(data.get("background_video")),
                    "background_video_light": self.asset(data.get("background_video_light")),
                    "primary_link": data.get("primary_link", ""),
                    "secondary_link": data.get("secondary_link", ""),
                    "items_limit": data.get("items_limit", 6),
                },
                data["tr"],
                label=f"{page} sections",
            )
            if changed and data["key"] in section_items:
                section.items.all().delete()
                for position, item in enumerate(section_items[data["key"]]):
                    section_item = SectionItem.objects.create(
                        section=section,
                        position=position,
                        icon=item.get("icon", ""),
                        image=self.asset(item.get("image")),
                        link=item.get("link", ""),
                        value=item.get("value", ""),
                    )
                    save_translations(
                        section_item,
                        {
                            language: dict(zip(("title", "text", "label"), item["tr"][language]))
                            for language in LANGUAGES
                        },
                    )

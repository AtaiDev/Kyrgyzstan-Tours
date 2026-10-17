import { CalendarDays, MapPinned, Ruler } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { useRegion, useRegions } from "@/api/queries";
import { BulletList, DetailSection, FactList } from "@/components/layout/ContentBlocks";
import { DetailState } from "@/components/layout/DetailState";
import { PageHero } from "@/components/layout/PageHero";
import { GalleryGrid } from "@/components/media/Gallery";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Reveal } from "@/components/motion/Reveal";
import { Paragraphs } from "@/components/ui/Markdown";
import { AttractionCard } from "@/features/cards/AttractionCard";
import { DestinationCard } from "@/features/cards/DestinationCard";
import { RouteCard } from "@/features/cards/RouteCard";
import { TourCard } from "@/features/cards/TourCard";
import { projectPoint } from "@/features/map/geo";
import { KyrgyzstanMap } from "@/features/map/KyrgyzstanMap";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import { LANGUAGE_META, LANGUAGES } from "@/i18n/languages";
import type { RegionDetail } from "@/types/api";

function RegionContent({ region }: { region: RegionDetail }) {
  const { t, path, formatNumber } = useI18n();
  const navigate = useNavigate();
  const { data: regions = [] } = useRegions();
  useSeo({ title: region.seo_title || region.name, description: region.seo_description || region.tagline, image: region.cover?.url });

  const colors = useMemo(() => Object.fromEntries(regions.map((item) => [item.map_code, item.accent_color])), [regions]);
  const markers = region.attractions.flatMap((attraction) => {
    const point = projectPoint(attraction);
    return point ? [{ id: attraction.slug, x: point[0], y: point[1], label: attraction.name, onSelect: () => navigate(path(`/attractions/${attraction.slug}`)) }] : [];
  });

  return (
    <>
      <PageHero title={region.name} eyebrow={t("label.region")} subtitle={region.tagline} image={region.cover} size="lg" crumbs={[{ label: t("nav.destinations"), to: "/destinations" }, { label: region.name }]}>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-milk-100/85">
          {LANGUAGES.map((code) => (
            <li key={code} lang={code}>
              <span className="mr-2 text-xs font-bold text-sand-300">{LANGUAGE_META[code].short}</span>
              {region.names[code]}
            </li>
          ))}
        </ul>
      </PageHero>

      <div className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
          <div className="min-w-0 space-y-14">
            <DetailSection title={t("label.overview")}>
              <Paragraphs text={region.description} className="text-lg leading-relaxed text-graphite-700" />
            </DetailSection>
            {region.highlights.length ? (
              <DetailSection title={t("label.highlights")}>
                <BulletList items={region.highlights} />
              </DetailSection>
            ) : null}
            {region.nature ? (
              <DetailSection title={t("label.nature")}>
                <p className="leading-relaxed text-graphite-700">{region.nature}</p>
              </DetailSection>
            ) : null}
            {region.gallery.length ? (
              <DetailSection title={t("label.gallery")}>
                <GalleryGrid images={region.gallery} />
              </DetailSection>
            ) : null}
          </div>
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="dark-surface rounded-[var(--radius-card)] bg-night-900 p-4">
              <KyrgyzstanMap regionColors={colors} selected={region.map_code} markers={markers} interactive={false} />
              <p className="px-2 pt-2 text-[0.6rem] text-milk-200/50">{t("map.attribution")}</p>
            </div>
            <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
              <FactList
                items={[
                  { label: t("label.recommendedDuration"), value: t("map.days", { min: region.recommended_days_min, max: region.recommended_days_max }), icon: <CalendarDays className="h-4 w-4" aria-hidden /> },
                  { label: t("label.area"), value: region.area_km2 ? t("common.squareKm", { value: formatNumber(region.area_km2) }) : null, icon: <Ruler className="h-4 w-4" aria-hidden /> },
                  { label: t("label.keyPlaces"), value: region.key_places, icon: <MapPinned className="h-4 w-4" aria-hidden /> },
                  { label: t("label.seasons"), value: region.seasons.map((season) => season.name).join(", ") },
                ]}
              />
            </div>
          </aside>
        </div>
      </div>

      {region.attractions.length ? (
        <section className="bg-milk-50 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("region.attractions")}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {region.attractions.map((attraction, index) => (
                <Reveal key={attraction.slug} delay={(index % 4) * 0.05}>
                  <AttractionCard attraction={attraction} className="h-full" />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {region.destinations.length ? (
        <section className="bg-milk-100 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("region.destinations")}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {region.destinations.map((destination, index) => (
                <Reveal key={destination.slug} delay={index * 0.06}>
                  <DestinationCard destination={destination} className="h-full" />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {region.tours.length ? (
        <section className="bg-milk-50 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("region.tours")}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {region.tours.map((tour, index) => (
                <Reveal key={tour.slug} delay={(index % 3) * 0.06}>
                  <TourCard tour={tour} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {region.routes.length ? (
        <section className="dark-surface bg-night-900 py-20 text-milk-50">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold">{t("region.routes")}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {region.routes.map((route) => (
                <RouteCard key={route.slug} route={route} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-milk-100 py-16">
        <div className="container-page">
          <h2 className="mb-6 font-display text-3xl font-semibold text-night-900">{t("region.otherRegions")}</h2>
          <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {regions
              .filter((item) => item.slug !== region.slug)
              .map((item) => (
                <Link key={item.slug} to={path(`/regions/${item.slug}`)} className="group relative h-40 w-60 shrink-0 overflow-hidden rounded-2xl">
                  <ResponsiveImage media={item.cover} sizes="240px" className="h-full w-full transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-night-950/80 to-transparent" />
                  <span className="absolute bottom-3 left-4 font-display text-xl font-semibold text-milk-50">{item.name}</span>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function RegionPage() {
  const { slug } = useParams();
  const query = useRegion(slug);
  return <DetailState query={query}>{(region) => <RegionContent region={region} />}</DetailState>;
}

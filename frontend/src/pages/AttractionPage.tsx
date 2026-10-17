import { CalendarDays, Compass, ExternalLink, MapPin, Mountain } from "lucide-react";
import { Link, useParams } from "react-router";

import { useAttraction } from "@/api/queries";
import { BulletList, DetailSection, FactList } from "@/components/layout/ContentBlocks";
import { DetailState } from "@/components/layout/DetailState";
import { PageHero } from "@/components/layout/PageHero";
import { GalleryGrid } from "@/components/media/Gallery";
import { Paragraphs } from "@/components/ui/Markdown";
import { AttractionCard } from "@/features/cards/AttractionCard";
import { RouteCard } from "@/features/cards/RouteCard";
import { TourCard } from "@/features/cards/TourCard";
import { RouteMap } from "@/features/map/RouteMap";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import type { MessageKey } from "@/i18n/types";
import type { AttractionDetail } from "@/types/api";
import { osmLink } from "@/utils/links";
import { split } from "@/utils/text";

function AttractionContent({ attraction }: { attraction: AttractionDetail }) {
  const { t, path, formatNumber } = useI18n();
  useSeo({ title: attraction.seo_title || attraction.name, description: attraction.seo_description || attraction.tagline, image: attraction.cover?.url });
  const mapLink = osmLink(attraction.latitude, attraction.longitude);
  const points = [attraction, ...attraction.nearby]
    .filter((item) => item.latitude && item.longitude)
    .map((item) => ({ latitude: item.latitude, longitude: item.longitude, title: item.name }));

  return (
    <>
      <PageHero
        title={attraction.name}
        eyebrow={t(`kind.${attraction.kind}` as MessageKey)}
        subtitle={attraction.tagline}
        image={attraction.cover}
        size="lg"
        crumbs={[{ label: t("nav.destinations"), to: "/destinations?view=attractions" }, { label: attraction.region.name, to: `/regions/${attraction.region.slug}` }, { label: attraction.name }]}
      />
      <div className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div className="min-w-0 space-y-14">
            <DetailSection>
              <Paragraphs text={attraction.description} className="text-lg leading-relaxed text-graphite-700" />
            </DetailSection>
            {attraction.visitor_info ? (
              <DetailSection title={t("label.visitorInfo")}>
                <div className="rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-soft)]">
                  <BulletList items={split(attraction.visitor_info)} />
                </div>
              </DetailSection>
            ) : null}
            {attraction.gallery.length ? (
              <DetailSection title={t("label.gallery")}>
                <GalleryGrid images={attraction.gallery} />
              </DetailSection>
            ) : null}
            {points.length ? (
              <DetailSection title={t("attraction.location")}>
                <RouteMap points={points} activeIndex={0} highlightRegions={[attraction.region.map_code]} />
              </DetailSection>
            ) : null}
          </div>
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
              <FactList
                items={[
                  { label: t("label.region"), value: <Link to={path(`/regions/${attraction.region.slug}`)} className="hover:text-glacier-700">{attraction.region.name}</Link>, icon: <MapPin className="h-4 w-4" aria-hidden /> },
                  {
                    label: t("label.destination"),
                    value: attraction.destination ? <Link to={path(`/destinations/${attraction.destination.slug}`)} className="hover:text-glacier-700">{attraction.destination.name}</Link> : null,
                    icon: <Compass className="h-4 w-4" aria-hidden />,
                  },
                  { label: t("label.altitude"), value: attraction.altitude_m ? t("common.meters", { value: formatNumber(attraction.altitude_m) }) : null, icon: <Mountain className="h-4 w-4" aria-hidden /> },
                  { label: t("label.seasons"), value: attraction.seasons.map((season) => season.name).join(", "), icon: <CalendarDays className="h-4 w-4" aria-hidden /> },
                ]}
              />
              {mapLink ? (
                <a href={mapLink} target="_blank" rel="noreferrer noopener" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-glacier-700 hover:text-glacier-800">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  {t("common.openMap")}
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
      {attraction.tours.length ? (
        <section className="bg-milk-50 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("attraction.tours")}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {attraction.tours.map((tour) => (
                <TourCard key={tour.slug} tour={tour} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {attraction.routes.length ? (
        <section className="dark-surface bg-night-900 py-20 text-milk-50">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold">{t("label.routes")}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {attraction.routes.map((route) => (
                <RouteCard key={route.slug} route={route} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {attraction.nearby.length ? (
        <section className="bg-milk-100 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("attraction.nearby")}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {attraction.nearby.map((item) => (
                <AttractionCard key={item.slug} attraction={item} className="h-full" />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default function AttractionPage() {
  const { slug } = useParams();
  const query = useAttraction(slug);
  return <DetailState query={query}>{(attraction) => <AttractionContent attraction={attraction} />}</DetailState>;
}

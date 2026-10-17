import { CalendarDays, ExternalLink, MapPin, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";

import { useDestination } from "@/api/queries";
import { DetailSection, FactList } from "@/components/layout/ContentBlocks";
import { DetailState } from "@/components/layout/DetailState";
import { PageHero } from "@/components/layout/PageHero";
import { GalleryGrid } from "@/components/media/Gallery";
import { Reveal } from "@/components/motion/Reveal";
import { Paragraphs } from "@/components/ui/Markdown";
import { AttractionCard } from "@/features/cards/AttractionCard";
import { DestinationCard } from "@/features/cards/DestinationCard";
import { RouteCard } from "@/features/cards/RouteCard";
import { TourCard } from "@/features/cards/TourCard";
import { RouteMap } from "@/features/map/RouteMap";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import type { DestinationDetail } from "@/types/api";
import { osmLink } from "@/utils/links";

function DestinationContent({ destination }: { destination: DestinationDetail }) {
  const { t, path } = useI18n();
  useSeo({ title: destination.seo_title || destination.name, description: destination.seo_description || destination.summary, image: destination.cover?.url });
  const mapLink = osmLink(destination.latitude, destination.longitude);
  const points = [
    { latitude: destination.latitude, longitude: destination.longitude, title: destination.name },
    ...destination.attractions.map((attraction) => ({ latitude: attraction.latitude, longitude: attraction.longitude, title: attraction.name })),
  ].filter((point) => point.latitude && point.longitude);

  return (
    <>
      <PageHero title={destination.name} eyebrow={destination.region.name} subtitle={destination.tagline} image={destination.cover} size="lg" crumbs={[{ label: t("nav.destinations"), to: "/destinations" }, { label: destination.name }]} />
      <div className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div className="min-w-0 space-y-14">
            <DetailSection>
              <p className="font-display text-3xl leading-snug text-night-900">{destination.summary}</p>
              <Paragraphs text={destination.description} className="mt-6 text-lg leading-relaxed text-graphite-700" />
            </DetailSection>
            {destination.gallery.length ? (
              <DetailSection title={t("label.gallery")}>
                <GalleryGrid images={destination.gallery} />
              </DetailSection>
            ) : null}
            {points.length ? (
              <DetailSection title={t("attraction.location")}>
                <RouteMap points={points} highlightRegions={[destination.region.map_code]} />
              </DetailSection>
            ) : null}
          </div>
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
              <FactList
                items={[
                  { label: t("label.region"), value: <Link to={path(`/regions/${destination.region.slug}`)} className="hover:text-glacier-700">{destination.region.name}</Link>, icon: <MapPin className="h-4 w-4" aria-hidden /> },
                  { label: t("label.travelStyle"), value: destination.travel_styles.map((style) => style.name).join(", "), icon: <Sparkles className="h-4 w-4" aria-hidden /> },
                  { label: t("label.seasons"), value: destination.seasons.map((season) => season.name).join(", "), icon: <CalendarDays className="h-4 w-4" aria-hidden /> },
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
      {destination.attractions.length ? (
        <section className="bg-milk-50 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("destination.attractions")}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {destination.attractions.map((attraction, index) => (
                <Reveal key={attraction.slug} delay={(index % 4) * 0.05}>
                  <AttractionCard attraction={attraction} className="h-full" />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {destination.tours.length ? (
        <section className="bg-milk-100 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("destination.tours")}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destination.tours.map((tour) => (
                <TourCard key={tour.slug} tour={tour} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {destination.routes.length ? (
        <section className="dark-surface bg-night-900 py-20 text-milk-50">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold">{t("destination.routes")}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {destination.routes.map((route) => (
                <RouteCard key={route.slug} route={route} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {destination.related.length ? (
        <section className="bg-milk-50 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("destination.related")}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {destination.related.map((item) => (
                <DestinationCard key={item.slug} destination={item} className="h-full" />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default function DestinationPage() {
  const { slug } = useParams();
  const query = useDestination(slug);
  return <DetailState query={query}>{(destination) => <DestinationContent destination={destination} />}</DetailState>;
}

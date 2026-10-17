import { Moon } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { useRoute } from "@/api/queries";
import { DetailSection, FactList } from "@/components/layout/ContentBlocks";
import { DetailState } from "@/components/layout/DetailState";
import { PageHero } from "@/components/layout/PageHero";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Paragraphs } from "@/components/ui/Markdown";
import { DifficultyMeter } from "@/features/cards/DifficultyMeter";
import { TourCard } from "@/features/cards/TourCard";
import { RouteMap } from "@/features/map/RouteMap";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import type { RouteDetail } from "@/types/api";
import { cn } from "@/utils/cn";

function RouteContent({ route }: { route: RouteDetail }) {
  const { t, path, plural, formatNumber } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  useSeo({ title: route.seo_title || route.title, description: route.seo_description || route.summary, image: route.cover?.url });

  return (
    <>
      <PageHero title={route.title} eyebrow={route.regions.map((region) => region.name).join(" · ")} subtitle={route.summary} image={route.cover} crumbs={[{ label: t("nav.routes"), to: "/routes" }, { label: route.title }]} />
      <div className="dark-surface bg-night-950 py-16 text-milk-50 sm:py-20">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <RouteMap points={route.stops} activeIndex={active} onSelect={setActive} highlightRegions={route.regions.map((region) => region.map_code)} className="border border-white/10" />
            <div className="mt-6 rounded-[var(--radius-card)] bg-white/5 p-6">
              <FactList
                tone="dark"
                items={[
                  { label: t("label.distance"), value: t("common.km", { value: formatNumber(route.distance_km) }) },
                  { label: t("label.duration"), value: plural("days", route.duration_days) },
                  { label: t("label.difficulty"), value: <DifficultyMeter value={route.difficulty} tone="dark" /> },
                  { label: t("label.stops"), value: String(route.stops.length) },
                ]}
              />
            </div>
          </div>
          <div>
            {route.description ? <Paragraphs text={route.description} className="mb-10 text-lg leading-relaxed text-milk-100/85" /> : null}
            <h2 className="mb-6 font-display text-3xl font-semibold">{t("route.stops")}</h2>
            <ol className="space-y-3">
              {route.stops.map((stop, index) => (
                <li key={`${stop.title}-${index}`}>
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    onMouseEnter={() => setActive(index)}
                    aria-pressed={active === index}
                    className={cn(
                      "flex w-full gap-4 rounded-2xl border p-4 text-left transition",
                      active === index ? "border-sand-400/60 bg-white/10" : "border-white/10 hover:border-white/30",
                    )}
                  >
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", active === index ? "bg-sand-400 text-night-950" : "bg-white/10 text-sand-200")}>
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-display text-xl font-semibold">{stop.title}</span>
                        {index === 0 ? <span className="text-[0.65rem] font-bold tracking-wide text-glacier-300 uppercase">{t("route.start")}</span> : null}
                        {index === route.stops.length - 1 ? <span className="text-[0.65rem] font-bold tracking-wide text-sand-300 uppercase">{t("route.finish")}</span> : null}
                      </span>
                      {stop.description ? <span className="mt-1 block text-sm text-milk-200/75">{stop.description}</span> : null}
                      {stop.nights ? (
                        <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-milk-200/60">
                          <Moon className="h-3.5 w-3.5" aria-hidden />
                          {plural("nights", stop.nights)}
                        </span>
                      ) : null}
                    </span>
                    {stop.attraction ? <ResponsiveImage media={stop.attraction.cover} sizes="80px" className="hidden h-16 w-20 shrink-0 rounded-xl sm:block" /> : null}
                  </button>
                  {stop.attraction ? (
                    <Link to={path(`/attractions/${stop.attraction.slug}`)} className="mt-1 ml-[3.25rem] inline-block text-xs font-semibold text-sand-300 hover:text-sand-200">
                      {stop.attraction.name} →
                    </Link>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      {route.tours.length ? (
        <section className="bg-milk-100 py-20">
          <div className="container-page">
            <DetailSection title={t("route.tours")}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {route.tours.map((tour) => (
                  <TourCard key={tour.slug} tour={tour} />
                ))}
              </div>
            </DetailSection>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default function RoutePage() {
  const { slug } = useParams();
  const query = useRoute(slug);
  return <DetailState query={query}>{(route) => <RouteContent route={route} />}</DetailState>;
}

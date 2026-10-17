import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { useSeasons } from "@/api/queries";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Skeleton } from "@/components/ui/States";
import { useI18n } from "@/i18n/context";
import type { PageSection } from "@/types/api";
import { cn } from "@/utils/cn";

export function SeasonsSection({ section }: { section: PageSection }) {
  const { t, path, formatMonth, formatPrice, plural } = useI18n();
  const { data: seasons = [], isLoading } = useSeasons();
  const [active, setActive] = useState(() => {
    const month = new Date().getMonth() + 1;
    return month >= 3 && month <= 5 ? 0 : month >= 6 && month <= 8 ? 1 : month >= 9 && month <= 11 ? 2 : 3;
  });
  const season = seasons[Math.min(active, Math.max(seasons.length - 1, 0))];

  return (
    <section className="bg-milk-50 py-24 sm:py-32" aria-labelledby="seasons-title">
      <div className="container-page">
        <SectionHeading id={`${section.key}-title`} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
        <div role="tablist" aria-label={section.title} className="mb-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {seasons.map((item, index) => (
            <button
              key={item.code}
              type="button"
              role="tab"
              id={`season-tab-${item.code}`}
              aria-selected={index === active}
              aria-controls="season-panel"
              onClick={() => setActive(index)}
              className={cn(
                "rounded-2xl border px-5 py-4 text-left transition",
                index === active ? "border-night-900 bg-night-900 text-milk-50" : "border-graphite-200 bg-white text-night-900 hover:border-night-900/40",
              )}
            >
              <span className="block font-display text-2xl font-semibold">{item.name}</span>
              <span className={cn("text-xs", index === active ? "text-milk-200/70" : "text-graphite-500")}>
                {item.month_numbers.map((month) => formatMonth(month)).join(" · ")}
              </span>
            </button>
          ))}
        </div>
        {isLoading || !season ? (
          <Skeleton className="h-[420px] w-full rounded-[var(--radius-card)]" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={season.code}
              id="season-panel"
              role="tabpanel"
              aria-labelledby={`season-tab-${season.code}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14"
            >
              <div className="relative min-h-[320px] overflow-hidden rounded-[var(--radius-card)] lg:min-h-[480px]">
                <ResponsiveImage media={season.image} sizes="(min-width: 1024px) 55vw, 92vw" className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night-950/80 to-transparent p-6">
                  <p className="text-xs font-semibold tracking-[0.2em] text-sand-300 uppercase">{t("seasons.months")}</p>
                  <div className="mt-3 grid grid-cols-12 gap-1" aria-hidden>
                    {Array.from({ length: 12 }, (_, index) => {
                      const month = index + 1;
                      const on = season.month_numbers.includes(month);
                      return (
                        <div key={month} className="text-center">
                          <div className={cn("h-1.5 rounded-full", on ? "bg-sand-400" : "bg-white/20")} />
                          <span className={cn("mt-1 block text-[0.6rem] uppercase", on ? "text-milk-50" : "text-milk-200/50")}>
                            {formatMonth(month).slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <h3 className="display-md text-night-900">{season.name}</h3>
                <p className="mt-4 text-lg leading-relaxed text-graphite-700">{season.description}</p>
                <ul className="mt-6 space-y-3">
                  {season.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-graphite-800">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-glacier-600" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <h4 className="mt-10 text-xs font-bold tracking-[0.2em] text-glacier-700 uppercase">{t("seasons.tours")}</h4>
                {season.tours.length ? (
                  <ul className="mt-3 divide-y divide-graphite-200 border-y border-graphite-200">
                    {season.tours.map((tour) => (
                      <li key={tour.slug}>
                        <Link to={path(`/tours/${tour.slug}`)} className="group flex items-center gap-4 py-4">
                          <ResponsiveImage media={tour.cover} sizes="80px" className="h-14 w-16 shrink-0 rounded-xl" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-night-900 group-hover:text-glacier-700">{tour.title}</span>
                            <span className="text-xs text-graphite-500">
                              {plural("days", tour.duration_days)} · {tour.region.name}
                            </span>
                          </span>
                          <span className="shrink-0 font-display text-xl text-night-900">{formatPrice(tour.price, tour.currency)}</span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-graphite-400 transition group-hover:translate-x-1 group-hover:text-night-900" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-graphite-500">{t("seasons.noTours")}</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}

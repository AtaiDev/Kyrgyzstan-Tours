import { ArrowUpRight, Clock, MapPin, Users } from "lucide-react";
import { Link } from "react-router";

import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { useI18n } from "@/i18n/context";
import type { TourCard as TourCardData } from "@/types/api";
import { cn } from "@/utils/cn";

import { DifficultyMeter } from "./DifficultyMeter";

export function TourCard({ tour, className, priority }: { tour: TourCardData; className?: string; priority?: boolean }) {
  const { t, plural, path, formatPrice } = useI18n();
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)] transition duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ResponsiveImage
          media={tour.cover}
          priority={priority}
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 92vw"
          className="h-full w-full transition duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950/60 via-transparent to-transparent" />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {tour.is_featured ? <Badge tone="light">{t("common.featured")}</Badge> : null}
          <Badge tone="light" icon={<Clock className="h-3 w-3" aria-hidden />}>
            {plural("days", tour.duration_days)}
          </Badge>
        </div>
        <span className="absolute right-4 bottom-4 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-milk-50 text-night-900 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-[0.16em] text-glacier-700 uppercase">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {tour.region.name}
        </p>
        <h3 className="font-display text-[1.65rem] leading-tight font-semibold text-night-900">
          <Link to={path(`/tours/${tour.slug}`)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {tour.title}
          </Link>
        </h3>
        {tour.summary ? <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-graphite-600">{tour.summary}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-graphite-600">
          <DifficultyMeter value={tour.difficulty} />
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {t("tour.groupSize", { min: tour.group_size_min, max: tour.group_size_max })}
          </span>
          {tour.rating ? (
            <span className="inline-flex items-center gap-1.5">
              <Rating value={tour.rating} />
              <span>{tour.rating.toFixed(1)}</span>
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-graphite-100 pt-5">
          <div>
            <p className="text-[0.7rem] tracking-wide text-graphite-500 uppercase">{t("common.from")}</p>
            <p className="font-display text-3xl leading-none font-semibold text-night-900">{formatPrice(tour.price, tour.currency)}</p>
            <p className="mt-1 text-xs text-graphite-500">{t("common.perPerson")}</p>
          </div>
          {tour.guide ? (
            <div className="flex items-center gap-2 text-right text-xs text-graphite-600">
              <span className="hidden sm:block">{tour.guide.name}</span>
              <ResponsiveImage media={tour.guide.photo} sizes="40px" className="h-10 w-10 rounded-full" />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

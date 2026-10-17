import { Mountain } from "lucide-react";
import { Link } from "react-router";

import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { useI18n } from "@/i18n/context";
import type { MessageKey } from "@/i18n/types";
import type { AttractionCard as AttractionCardData } from "@/types/api";
import { cn } from "@/utils/cn";

export function AttractionCard({ attraction, className }: { attraction: AttractionCardData; className?: string }) {
  const { t, path, formatNumber } = useI18n();
  return (
    <article className={cn("group relative overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)] transition duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]", className)}>
      <div className="relative aspect-[5/4] overflow-hidden">
        <ResponsiveImage media={attraction.cover} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 92vw" className="h-full w-full transition duration-[1.4s] group-hover:scale-105" />
        <span className="absolute top-3 left-3 rounded-full bg-night-950/70 px-3 py-1 text-[0.68rem] font-semibold tracking-wide text-milk-50 backdrop-blur-md">
          {t(`kind.${attraction.kind}` as MessageKey)}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-2xl leading-tight font-semibold text-night-900">
          <Link to={path(`/attractions/${attraction.slug}`)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {attraction.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-graphite-600">{attraction.tagline}</p>
        <div className="mt-4 flex items-center justify-between text-xs font-medium text-graphite-500">
          <span>{attraction.region.name}</span>
          {attraction.altitude_m ? (
            <span className="inline-flex items-center gap-1">
              <Mountain className="h-3.5 w-3.5" aria-hidden />
              {t("common.meters", { value: formatNumber(attraction.altitude_m) })}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

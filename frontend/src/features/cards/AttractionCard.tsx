import { Mountain } from "lucide-react";
import { Link } from "react-router";

import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { useI18n } from "@/i18n/context";
import type { MessageKey } from "@/i18n/types";
import type { AttractionCard as AttractionCardData } from "@/types/api";
import { cn } from "@/utils/cn";
import { HOVER_ZOOM } from "@/utils/motion";

export function AttractionCard({ attraction, className }: { attraction: AttractionCardData; className?: string }) {
  const { t, path, formatNumber } = useI18n();
  return (
    // Static hover target with a lifting inner surface, so the card can't slide out from under the cursor.
    <article className={cn("group relative", className)}>
      <span
        className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] shadow-[var(--shadow-lift)] opacity-0 transition duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-1 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative h-full overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-1">
        <div className="relative aspect-[5/4] overflow-hidden">
          <ResponsiveImage
            media={attraction.cover}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 92vw"
            className={cn(HOVER_ZOOM, "h-full w-full group-hover:-translate-y-[1.5%] group-hover:scale-[1.06]")}
          />
          <span className="absolute top-3 left-3 rounded-full bg-night-950/70 px-3 py-1 text-[0.68rem] font-semibold tracking-wide text-milk-50 transition-colors duration-500 group-hover:bg-sand-400 group-hover:text-night-950">
            {t(`kind.${attraction.kind}` as MessageKey)}
          </span>
        </div>
        <div className="p-5">
          <h3 className="font-display text-2xl leading-tight font-semibold text-night-900 transition-colors duration-300 group-hover:text-glacier-700">
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
      </div>
    </article>
  );
}

import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { useI18n } from "@/i18n/context";
import type { DestinationCard as DestinationCardData } from "@/types/api";
import { cn } from "@/utils/cn";
import { HOVER_ZOOM } from "@/utils/motion";

export function DestinationCard({ destination, variant = "default", className }: { destination: DestinationCardData; variant?: "default" | "feature" | "wide"; className?: string }) {
  const { path, plural } = useI18n();
  return (
    <article className={cn("group relative isolate overflow-hidden rounded-[var(--radius-card)] bg-night-900 text-milk-50", className)}>
      <ResponsiveImage
        media={destination.cover}
        sizes={variant === "feature" ? "(min-width: 1024px) 55vw, 92vw" : "(min-width: 1024px) 30vw, 92vw"}
        className={cn(HOVER_ZOOM, "absolute inset-0 -z-10 h-full w-full group-hover:scale-[1.05]")}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950/95 via-night-950/55 to-night-950/15" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950/60 via-night-950/25 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden />
      <div className={cn("flex h-full min-h-[320px] flex-col justify-end p-6 sm:p-8", variant === "feature" && "min-h-[460px] lg:min-h-[560px]")}>
        <p className="eyebrow eyebrow-hover mb-3 text-sand-300">{destination.region.name}</p>
        <h3 className={cn("font-display leading-[1.02] font-semibold", variant === "feature" ? "text-4xl sm:text-5xl" : "text-3xl")}>
          <Link to={path(`/destinations/${destination.slug}`)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {destination.name}
          </Link>
        </h3>
        {destination.tagline ? <p className="mt-2 text-milk-100/85 transition-colors duration-500 group-hover:text-milk-50">{destination.tagline}</p> : null}
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {destination.travel_styles.slice(0, variant === "feature" ? 3 : 2).map((style) => (
              <span key={style.slug} className="rounded-full border border-white/25 bg-night-950/25 px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-milk-100/90 transition-colors duration-500 group-hover:border-white/45">
                {style.name}
              </span>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-milk-100/80">
            {destination.tours_count ? plural("tours", destination.tours_count) : null}
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/30 transition-colors duration-500 group-hover:border-milk-50 group-hover:text-night-900">
              <span className="absolute inset-0 scale-0 rounded-full bg-milk-50 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-100" aria-hidden />
              <ArrowUpRight className="relative h-4 w-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-45" aria-hidden />
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { useI18n } from "@/i18n/context";
import type { DestinationCard as DestinationCardData } from "@/types/api";
import { cn } from "@/utils/cn";

export function DestinationCard({ destination, variant = "default", className }: { destination: DestinationCardData; variant?: "default" | "feature" | "wide"; className?: string }) {
  const { path, plural } = useI18n();
  return (
    <article className={cn("group relative isolate overflow-hidden rounded-[var(--radius-card)] bg-night-900 text-milk-50", className)}>
      <ResponsiveImage
        media={destination.cover}
        sizes={variant === "feature" ? "(min-width: 1024px) 55vw, 92vw" : "(min-width: 1024px) 30vw, 92vw"}
        className="absolute inset-0 -z-10 h-full w-full transition duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.07]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950/95 via-night-950/55 to-night-950/15 transition duration-700 group-hover:via-night-950/65" />
      <div className={cn("flex h-full min-h-[320px] flex-col justify-end p-6 sm:p-8", variant === "feature" && "min-h-[460px] lg:min-h-[560px]")}>
        <p className="eyebrow mb-3 text-sand-300">{destination.region.name}</p>
        <h3 className={cn("font-display leading-[1.02] font-semibold", variant === "feature" ? "text-4xl sm:text-5xl" : "text-3xl")}>
          <Link to={path(`/destinations/${destination.slug}`)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {destination.name}
          </Link>
        </h3>
        {destination.tagline ? <p className="mt-2 text-milk-100/85">{destination.tagline}</p> : null}
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {destination.travel_styles.slice(0, variant === "feature" ? 3 : 2).map((style) => (
              <span key={style.slug} className="rounded-full border border-white/25 px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-milk-100/90 backdrop-blur-sm">
                {style.name}
              </span>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-milk-100/80">
            {destination.tours_count ? plural("tours", destination.tours_count) : null}
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 transition duration-500 group-hover:bg-milk-50 group-hover:text-night-900">
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

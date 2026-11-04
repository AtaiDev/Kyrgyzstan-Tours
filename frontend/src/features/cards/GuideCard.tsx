import { Languages } from "lucide-react";
import { Link } from "react-router";

import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Rating } from "@/components/ui/Rating";
import { useI18n } from "@/i18n/context";
import type { GuideCard as GuideCardData } from "@/types/api";
import { cn } from "@/utils/cn";
import { HOVER_ZOOM } from "@/utils/motion";

export function GuideCard({ guide, className, tone = "light" }: { guide: GuideCardData; className?: string; tone?: "light" | "dark" }) {
  const { path, plural } = useI18n();
  const dark = tone === "dark";
  return (
    <article className={cn("group relative", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
        <ResponsiveImage media={guide.photo} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 92vw" className={cn(HOVER_ZOOM, "h-full w-full group-hover:scale-[1.05]")} />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950/80 via-transparent to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950/90 via-night-950/30 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden />
        {guide.quote ? (
          <p className="absolute inset-x-5 bottom-5 translate-y-4 font-display text-lg leading-snug text-milk-50 italic opacity-0 transition duration-700 ease-[var(--ease-out-expo)] group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-100">
            “{guide.quote}”
          </p>
        ) : null}
      </div>
      <div className="mt-5">
        <h3 className={cn("font-display text-2xl font-semibold", dark ? "text-milk-50" : "text-night-900")}>
          <Link to={path(`/guides/${guide.slug}`)} className="after:absolute after:inset-0 focus-visible:outline-none">
            <span className="bg-gradient-to-r from-current to-current bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 ease-[var(--ease-out-expo)] group-hover:bg-[length:100%_1px]">
              {guide.name}
            </span>
          </Link>
        </h3>
        <p className={cn("mt-1 text-sm", dark ? "text-milk-200/75" : "text-graphite-600")}>{guide.headline}</p>
        <div className={cn("mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium", dark ? "text-milk-200/70" : "text-graphite-500")}>
          <span className="inline-flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5" aria-hidden />
            {guide.languages.map((language) => language.code.toUpperCase()).join(" · ")}
          </span>
          <span>{plural("years", guide.experience_years)}</span>
          {guide.rating ? <Rating value={guide.rating} /> : null}
        </div>
      </div>
    </article>
  );
}

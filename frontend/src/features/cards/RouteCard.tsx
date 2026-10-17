import { ArrowRight, Route as RouteIcon } from "lucide-react";
import { Link } from "react-router";

import { RouteSketch } from "@/features/map/RouteMap";
import { useI18n } from "@/i18n/context";
import type { RouteCard as RouteCardData } from "@/types/api";
import { cn } from "@/utils/cn";

import { DifficultyMeter } from "./DifficultyMeter";

export function RouteCard({ route, className }: { route: RouteCardData; className?: string }) {
  const { t, path, plural, formatNumber } = useI18n();
  const start = route.path[0]?.title;
  const finish = route.path[route.path.length - 1]?.title;
  return (
    <article
      className={cn(
        "dark-surface group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-night-800/80 p-6 text-milk-50 transition duration-500 hover:border-sand-400/40 hover:bg-night-800",
        className,
      )}
    >
      <div className="mb-5 rounded-2xl bg-night-950/40 p-3">
        <RouteSketch points={route.path} />
      </div>
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-sand-300 uppercase">
        <RouteIcon className="h-3.5 w-3.5" aria-hidden />
        {route.regions.map((region) => region.name).join(" · ")}
      </p>
      <h3 className="font-display text-2xl leading-tight font-semibold">
        <Link to={path(`/routes/${route.slug}`)} className="after:absolute after:inset-0 focus-visible:outline-none">
          {route.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-milk-200/75">{route.summary}</p>
      {start && finish ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-milk-100">
          <span>{start}</span>
          <ArrowRight className="h-3.5 w-3.5 text-sand-300" aria-hidden />
          <span>{finish}</span>
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs font-medium text-milk-200/80">
        <span>{t("common.km", { value: formatNumber(route.distance_km) })}</span>
        <span>{plural("days", route.duration_days)}</span>
        <DifficultyMeter value={route.difficulty} tone="dark" />
      </div>
    </article>
  );
}

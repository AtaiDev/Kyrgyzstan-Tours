import { motion } from "framer-motion";
import { useMemo } from "react";

import { useMotionSettings } from "@/hooks/useMotionSettings";
import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

import { boundsOf, CITIES, FULL_VIEW, geometry, isNear, project, projectPoint, smoothPath, viewBoxFor } from "./geo";
import { KyrgyzstanMap } from "./KyrgyzstanMap";

interface RoutePointLike {
  latitude: string | number | null;
  longitude: string | number | null;
  title: string;
}

interface RouteMapProps {
  points: RoutePointLike[];
  activeIndex?: number | null;
  onSelect?: (index: number) => void;
  className?: string;
  highlightRegions?: string[];
}

export function RouteMap({ points, activeIndex, onSelect, className, highlightRegions = [] }: RouteMapProps) {
  const { t } = useI18n();
  const { reduceMotion } = useMotionSettings();
  const projected = useMemo(
    () => points.map((point) => ({ point, xy: projectPoint(point) })).filter((item): item is { point: RoutePointLike; xy: [number, number] } => item.xy !== null),
    [points],
  );
  const view = projected.length ? viewBoxFor(boundsOf(projected.map((item) => item.xy)), 0.35, geometry.width * 0.3) : FULL_VIEW;
  const zoom = geometry.width / Number(view.split(" ")[2]);
  const pathD = smoothPath(projected.map((item) => item.xy));
  const hiddenCities = CITIES.filter((city) => projected.some((item) => isNear(item.xy, project(city.latitude, city.longitude), 30 / zoom))).map((city) => city.key);
  const colors = Object.fromEntries(
    geometry.regions.map((region) => [region.code, highlightRegions.includes(region.code) ? "#26a99b" : "#3b5a84"]),
  );

  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-card)] bg-night-900", className)}>
      <KyrgyzstanMap regionColors={colors} focusView={view} interactive={false} animate={!reduceMotion} hiddenCities={hiddenCities}>
        <motion.path
          d={pathD}
          fill="none"
          stroke="#d4b07a"
          strokeWidth={3 / zoom}
          strokeLinecap="round"
          strokeDasharray={`${8 / zoom} ${6 / zoom}`}
          initial={reduceMotion ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {projected.map(({ point, xy }, index) => {
          const active = activeIndex === index;
          return (
            <g
              key={`${point.title}-${index}`}
              transform={`translate(${xy[0]} ${xy[1]})`}
              className={cn(onSelect && "cursor-pointer")}
              onClick={() => onSelect?.(index)}
            >
              <circle r={(active ? 13 : 10) / zoom} fill={active ? "#d4b07a" : "#0b1524"} stroke="#d4b07a" strokeWidth={2 / zoom} />
              <text
                textAnchor="middle"
                dy={4 / zoom}
                className={cn("font-sans font-bold", active ? "fill-night-950" : "fill-sand-200")}
                style={{ fontSize: 10 / zoom }}
              >
                {index + 1}
              </text>
              <text
                x={14 / zoom}
                y={-10 / zoom}
                className="fill-milk-50 font-sans font-semibold"
                style={{ fontSize: 11 / zoom, paintOrder: "stroke" }}
                stroke="rgba(7,13,23,0.75)"
                strokeWidth={3 / zoom}
              >
                {point.title}
              </text>
            </g>
          );
        })}
      </KyrgyzstanMap>
      <p className="px-4 pb-3 text-[0.65rem] text-milk-200/50">{t("map.attribution")}</p>
    </div>
  );
}

export function RouteSketch({ points, className }: { points: RoutePointLike[]; className?: string }) {
  const projected = points.map((point) => projectPoint(point)).filter((xy): xy is [number, number] => xy !== null);
  if (projected.length < 2) return null;
  const outline = geometry.regions.map((region) => region.path).join("");
  return (
    <svg viewBox={FULL_VIEW} className={cn("h-auto w-full", className)} aria-hidden>
      <path d={outline} fill="rgba(247,242,234,0.06)" stroke="rgba(247,242,234,0.25)" strokeWidth={1.2} fillRule="evenodd" />
      <path d={smoothPath(projected)} fill="none" stroke="#d4b07a" strokeWidth={5} strokeLinecap="round" />
      {projected.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r={index === 0 || index === projected.length - 1 ? 9 : 6} fill={index === 0 ? "#4fc7b8" : "#d4b07a"} stroke="#0b1524" strokeWidth={2} />
      ))}
    </svg>
  );
}

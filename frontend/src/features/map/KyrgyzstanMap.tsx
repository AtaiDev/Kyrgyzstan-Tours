import { motion } from "framer-motion";
import type { KeyboardEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

import { CITIES, FULL_VIEW, geometry, project, viewBoxFor } from "./geo";

export interface MapMarker {
  id: string;
  x: number;
  y: number;
  label: string;
  onSelect?: () => void;
}

const LABEL_OFFSETS: Record<string, [number, number]> = { chuy: [-16, 18] };

interface KyrgyzstanMapProps {
  regionColors?: Record<string, string>;
  regionNames?: Record<string, string>;
  selected?: string | null;
  onSelect?: (code: string) => void;
  markers?: MapMarker[];
  animate?: boolean;
  className?: string;
  children?: ReactNode;
  focusView?: string | null;
  interactive?: boolean;
  hiddenCities?: string[];
  regionLabels?: Record<string, string>;
  highlighted?: string | null;
  onHover?: (code: string | null) => void;
}

export function KyrgyzstanMap({
  regionColors = {},
  regionNames = {},
  selected,
  onSelect,
  markers = [],
  animate = true,
  className,
  children,
  focusView,
  interactive = true,
  hiddenCities = [],
  regionLabels,
  highlighted = null,
  onHover,
}: KyrgyzstanMapProps) {
  const { t } = useI18n();
  const [hoveredLocal, setHoveredLocal] = useState<string | null>(null);
  const hovered = hoveredLocal ?? highlighted;
  const setHovered = (code: string | null) => {
    setHoveredLocal(code);
    onHover?.(code);
  };
  const selectedShape = geometry.regions.find((region) => region.code === selected);
  const viewBox = focusView ?? (selectedShape ? viewBoxFor(selectedShape.bbox, 0.22) : FULL_VIEW);
  const zoom = useMemo(() => geometry.width / Number(viewBox.split(" ")[2]), [viewBox]);
  const cities = useMemo(() => CITIES.map((city) => ({ ...city, point: project(city.latitude, city.longitude) })), []);

  const handleKey = (event: KeyboardEvent<SVGPathElement>, code: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(code);
    }
  };

  return (
    <motion.svg
      role="group"
      aria-label={t("map.label")}
      className={cn("h-auto w-full select-none", className)}
      initial={false}
      animate={{ viewBox }}
      transition={animate ? { duration: 1.1, ease: [0.65, 0, 0.35, 1] } : { duration: 0 }}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="map-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        </pattern>
      </defs>
      <g>
        {geometry.regions.map((region) => {
          const color = regionColors[region.code] ?? "#3b5a84";
          const isSelected = region.code === selected;
          const isHovered = region.code === hovered;
          const dimmed = Boolean(selected) && !isSelected;
          return (
            <g key={region.code}>
              <path
                d={region.path}
                fillRule="evenodd"
                fill={color}
                fillOpacity={isSelected ? 0.95 : isHovered ? 0.75 : dimmed ? 0.22 : 0.48}
                stroke={isSelected ? "#f7f2ea" : "rgba(247,242,234,0.45)"}
                strokeWidth={(isSelected ? 2.2 : 1) / zoom}
                strokeLinejoin="round"
                filter={isSelected ? "url(#map-glow)" : undefined}
                className={cn("transition-[fill-opacity,stroke] duration-500", interactive && "cursor-pointer focus:outline-none")}
                tabIndex={interactive ? 0 : -1}
                role={interactive ? "button" : undefined}
                aria-pressed={interactive ? isSelected : undefined}
                aria-label={regionNames[region.code] ?? region.code}
                onClick={interactive ? () => onSelect?.(region.code) : undefined}
                onKeyDown={interactive ? (event) => handleKey(event, region.code) : undefined}
                onMouseEnter={() => setHovered(region.code)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(region.code)}
                onBlur={() => setHovered(null)}
              />
              <path d={region.path} fillRule="evenodd" fill="url(#map-hatch)" pointerEvents="none" />
            </g>
          );
        })}
      </g>
      {geometry.lakes.map((lake) => (
        <path key={lake.name} d={lake.path} fill="#2f7fa8" fillOpacity={0.9} stroke="rgba(191,240,233,0.6)" strokeWidth={0.8 / zoom} pointerEvents="none" />
      ))}
      {!selected ? (
        <g className="max-sm:hidden">
          {geometry.regions.map((region) => {
            const label = regionLabels?.[region.code] ?? regionNames[region.code];
            if (!label) return null;
            const isHovered = region.code === hovered;
            const [dx, dy] = LABEL_OFFSETS[region.code] ?? [0, 0];
            return (
              <text
                key={`label-${region.code}`}
                x={region.label[0] + dx}
                y={region.label[1] + dy}
                textAnchor="middle"
                className={cn("pointer-events-none font-sans font-bold tracking-wide transition-[fill] duration-300", isHovered ? "fill-white" : "fill-milk-50")}
                style={{ fontSize: 17, paintOrder: "stroke" }}
                stroke="rgba(7,13,23,0.7)"
                strokeWidth={4.5}
                strokeLinejoin="round"
              >
                {label}
              </text>
            );
          })}
        </g>
      ) : null}
      {cities.filter((city) => !hiddenCities.includes(city.key)).map((city) => (
        <g key={city.key} pointerEvents="none">
          <circle cx={city.point[0]} cy={city.point[1]} r={4.5 / zoom} fill="#d4b07a" stroke="#070d17" strokeWidth={1.5 / zoom} />
          <text
            x={city.point[0] + 9 / zoom}
            y={city.point[1] + 5 / zoom}
            className="fill-sand-200 font-sans font-semibold max-sm:hidden"
            style={{ fontSize: 14 / zoom, paintOrder: "stroke" }}
            stroke="rgba(7,13,23,0.75)"
            strokeWidth={4 / zoom}
            strokeLinejoin="round"
          >
            {city.key === "bishkek" ? t("map.bishkek") : t("map.osh")}
          </text>
        </g>
      ))}
      {markers.map((marker) => (
        <g
          key={marker.id}
          transform={`translate(${marker.x} ${marker.y})`}
          className={cn(marker.onSelect && "cursor-pointer")}
          onClick={marker.onSelect}
          role={marker.onSelect ? "button" : undefined}
          tabIndex={marker.onSelect ? 0 : undefined}
          aria-label={marker.label}
          onKeyDown={(event) => {
            if (marker.onSelect && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              marker.onSelect();
            }
          }}
        >
          <circle r={10 / zoom} fill="rgba(79,199,184,0.25)">
            <animate attributeName="r" values={`${8 / zoom};${14 / zoom};${8 / zoom}`} dur="2.6s" repeatCount="indefinite" />
          </circle>
          <circle r={4.5 / zoom} fill="#4fc7b8" stroke="#f7f2ea" strokeWidth={1.4 / zoom} />
          <title>{marker.label}</title>
        </g>
      ))}
      {children}
    </motion.svg>
  );
}

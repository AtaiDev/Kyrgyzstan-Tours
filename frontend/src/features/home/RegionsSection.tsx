import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MapPinned, RotateCcw } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { useRegion, useRegions, useSite } from "@/api/queries";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Skeleton } from "@/components/ui/States";
import { projectPoint } from "@/features/map/geo";
import { KyrgyzstanMap } from "@/features/map/KyrgyzstanMap";
import type { MapMarker } from "@/features/map/KyrgyzstanMap";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useMotionSettings } from "@/hooks/useMotionSettings";
import { useI18n } from "@/i18n/context";
import { LANGUAGE_META, LANGUAGES } from "@/i18n/languages";
import type { PluralKey } from "@/i18n/types";
import type { Media, PageSection, RegionCard, RegionDetail, SiteStats } from "@/types/api";
import { cn } from "@/utils/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

function shortRegionName(name: string) {
  return name.replace(/\s+область$/i, " обл.").replace(/\s+region$/i, "").replace(/\s+облусу$/i, "");
}

function usePluralLabel() {
  const { plural, formatNumber } = useI18n();
  return (key: PluralKey, count: number) => plural(key, count).replace(formatNumber(count), "").trim();
}

interface Stat {
  value: string;
  label: string;
}

function StatRow({ items }: { items: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 sm:gap-x-0 lg:grid-cols-2 lg:gap-x-4 xl:grid-cols-4 xl:gap-x-0">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn("flex min-w-0 flex-col", index > 0 && "sm:border-l sm:border-white/10 sm:pl-5 lg:border-l-0 lg:pl-0 xl:border-l xl:pl-5")}
        >
          <dt className="order-2 mt-1.5 text-[0.8rem] leading-snug text-milk-200/75">{item.label}</dt>
          <dd className="order-1 font-display text-[1.9rem] leading-none font-semibold text-milk-50">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const primaryLink =
  "group inline-flex items-center gap-2 rounded-full bg-sand-400 px-5 py-2.5 text-sm font-semibold text-night-950 transition hover:bg-sand-300";
const secondaryLink =
  "inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-milk-50 transition hover:border-white/50 hover:bg-white/5";

function CountryOverview({ stats }: { stats: SiteStats | undefined }) {
  const { t, path, formatNumber } = useI18n();
  const label = usePluralLabel();
  const items: Stat[] = stats
    ? [
        { value: formatNumber(stats.regions), label: label("regions", stats.regions) },
        { value: formatNumber(stats.destinations), label: label("destinations", stats.destinations) },
        { value: formatNumber(stats.attractions), label: label("places", stats.attractions) },
        { value: formatNumber(stats.tours), label: label("tours", stats.tours) },
      ]
    : [];
  return (
    <div className="flex h-full flex-col">
      <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-sand-300 uppercase">{t("map.wholeCountry")}</p>
      <h3 className="mt-2 font-display text-[1.85rem] leading-tight font-semibold text-milk-50 sm:text-[2.1rem]">{t("map.overviewTitle")}</h3>
      <p className="mt-2 line-clamp-3 text-[0.95rem] leading-relaxed text-milk-100/80">{t("map.overviewText")}</p>
      {items.length ? (
        <div className="mt-5">
          <StatRow items={items} />
        </div>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link to={path("/tours")} className={primaryLink}>
          {t("map.allTours")}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function RegionDetails({ region, detail }: { region: RegionCard; detail: RegionDetail | undefined }) {
  const { t, path, language, formatNumber } = useI18n();
  const label = usePluralLabel();
  const otherNames = LANGUAGES.filter((code) => code !== language && region.names[code]);
  const days =
    region.recommended_days_min === region.recommended_days_max
      ? formatNumber(region.recommended_days_max)
      : `${formatNumber(region.recommended_days_min)}–${formatNumber(region.recommended_days_max)}`;
  const items: Stat[] = [
    { value: formatNumber(region.tours_count), label: label("tours", region.tours_count) },
    { value: formatNumber(region.attractions_count), label: label("places", region.attractions_count) },
    { value: formatNumber(region.destinations_count), label: label("destinations", region.destinations_count) },
    { value: days, label: label("days", region.recommended_days_max) },
  ];
  return (
    <div className="flex h-full flex-col">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] font-semibold tracking-[0.12em] text-milk-200/65 uppercase">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: region.accent_color }} aria-hidden />
        {otherNames.map((code) => (
          <span key={code} lang={code}>
            <span className="mr-1.5 text-sand-300">{LANGUAGE_META[code].short}</span>
            {region.names[code]}
          </span>
        ))}
      </p>
      <h3 className="mt-2 font-display text-[1.85rem] leading-tight font-semibold text-milk-50 sm:text-[2.1rem]">{region.name}</h3>
      {region.tagline ? <p className="mt-1 text-[0.95rem] font-medium text-sand-200">{region.tagline}</p> : null}
      {detail ? (
        <p className="mt-2 line-clamp-2 text-[0.95rem] leading-relaxed text-milk-100/80">{detail.description}</p>
      ) : (
        <div className="mt-3 space-y-2" aria-hidden>
          <Skeleton className="h-3.5 w-full bg-white/10" />
          <Skeleton className="h-3.5 w-4/5 bg-white/10" />
        </div>
      )}
      <div className="mt-5">
        <StatRow items={items} />
      </div>
      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link to={path(`/regions/${region.slug}`)} className={primaryLink}>
          {t("map.exploreRegion")}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
        </Link>
        {region.tours_count ? (
          <Link to={path(`/tours?region=${region.slug}`)} className={secondaryLink}>
            {t("map.regionTours")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

interface RegionTileProps {
  media: Media | null | undefined;
  title: string;
  subtitle: string;
  badge: string;
  accent?: string;
  active: boolean;
  highlighted: boolean;
  wide: boolean;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
}

function RegionTile({ media, title, subtitle, badge, accent, active, highlighted, wide, onSelect, onHover }: RegionTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      aria-pressed={active}
      className={cn(
        "group relative isolate flex h-full w-full flex-col justify-end overflow-hidden rounded-2xl text-left transition duration-300 focus-visible:outline-none lg:aspect-auto",
        wide ? "aspect-[2/1]" : "aspect-[4/3]",
        active
          ? "ring-2 ring-sand-300 ring-offset-2 ring-offset-night-900"
          : highlighted
            ? "ring-2 ring-white/60 ring-inset"
            : "ring-1 ring-white/10 ring-inset hover:ring-white/40 focus-visible:ring-2 focus-visible:ring-sand-300",
      )}
    >
      <ResponsiveImage
        media={media}
        alt=""
        sizes="(min-width: 1024px) 22vw, 50vw"
        className="absolute inset-0 -z-10 h-full w-full transition duration-700 ease-out group-hover:scale-[1.06]"
      />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950/95 via-night-950/45 to-night-950/0" aria-hidden />
      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-night-950/75 px-2.5 py-1 text-[0.72rem] font-semibold text-milk-50">
        {accent ? <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} aria-hidden /> : null}
        {badge}
      </span>
      <span className="block p-3.5 sm:p-4">
        <span className="block font-display text-[1.15rem] leading-[1.1] font-semibold text-milk-50 sm:text-2xl">{title}</span>
        <span className="mt-1 hidden truncate text-[0.82rem] text-milk-100/85 sm:block">{subtitle}</span>
      </span>
    </button>
  );
}

export function RegionsSection({ section }: { section: PageSection }) {
  const { t, path, plural } = useI18n();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { mapAnimations, reduceMotion } = useMotionSettings();
  const { data: regions = [], isLoading } = useRegions();
  const { data: site } = useSite();
  const stageRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const selectedRegion = regions.find((region) => region.map_code === selected) ?? null;
  const { data: detail } = useRegion(selectedRegion?.slug);
  const regionDetail = detail && detail.map_code === selected ? detail : undefined;

  const colors = useMemo(() => Object.fromEntries(regions.map((region) => [region.map_code, region.accent_color])), [regions]);
  const names = useMemo(() => Object.fromEntries(regions.map((region) => [region.map_code, region.name])), [regions]);
  const labels = useMemo(() => Object.fromEntries(regions.map((region) => [region.map_code, shortRegionName(region.name)])), [regions]);
  const markers = useMemo<MapMarker[]>(() => {
    if (!regionDetail) return [];
    return regionDetail.attractions.flatMap((attraction) => {
      const point = projectPoint(attraction);
      return point
        ? [{ id: attraction.slug, x: point[0], y: point[1], label: attraction.name, onSelect: () => navigate(path(`/attractions/${attraction.slug}`)) }]
        : [];
    });
  }, [regionDetail, navigate, path]);

  const toggleFromMap = (code: string) => setSelected((current) => (current === code ? null : code));
  const chooseFromTile = (code: string | null) => {
    setSelected(code);
    if (!isDesktop) stageRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  const tileCount = regions.length + 1;
  const rows = Math.ceil(tileCount / 2);
  const overviewMedia = site?.default_og_image ?? regions[0]?.cover ?? null;

  return (
    <section className="dark-surface relative overflow-hidden bg-night-900 py-24 text-milk-50 sm:py-32" aria-labelledby="regions-title">
      <div className="pointer-events-none absolute -top-32 -right-40 h-[36rem] w-[36rem] rounded-full bg-glacier-600/10 blur-3xl" aria-hidden />
      <div className="container-page relative">
        <SectionHeading
          id={`${section.key}-title`}
          eyebrow={section.eyebrow}
          title={section.title}
          subtitle={section.subtitle}
          tone="dark"
          action={section.primary_label ? { label: section.primary_label, to: section.primary_link || "/destinations" } : null}
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <div
            ref={stageRef}
            className="flex scroll-mt-24 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-night-950/55 lg:col-span-7"
          >
            <div className="flex min-h-14 items-center justify-between gap-3 px-5 pt-4 sm:px-7 sm:pt-5">
              <p className={cn("inline-flex min-w-0 items-center gap-2 text-[0.82rem] font-medium text-milk-200/75", selected && "max-sm:hidden")}>
                <MapPinned className="h-4 w-4 shrink-0 text-sand-300" aria-hidden />
                <span className="truncate">{t("map.hint")}</span>
              </p>
              {selected ? (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-night-900/80 px-3.5 py-1.5 text-xs font-semibold text-milk-50 transition hover:border-white/40"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {t("map.reset")}
                </button>
              ) : null}
            </div>
            <div className="relative px-2 pt-1 pb-6 sm:px-6">
              <KyrgyzstanMap
                regionColors={colors}
                regionNames={names}
                regionLabels={labels}
                selected={selected}
                onSelect={toggleFromMap}
                markers={markers}
                animate={mapAnimations}
                highlighted={hovered}
                onHover={setHovered}
              />
              <p className="absolute right-5 bottom-1.5 text-[0.6rem] text-milk-200/40 sm:right-7">{t("map.attribution")}</p>
            </div>
            <div className="flex-1 border-t border-white/10 bg-night-950/45 px-5 py-6 sm:px-7 lg:min-h-[21rem]" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selectedRegion?.slug ?? "overview"}
                  className="h-full"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  {selectedRegion ? <RegionDetails region={selectedRegion} detail={regionDetail} /> : <CountryOverview stats={site?.stats} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <ul
            aria-label={t("map.hint")}
            style={{ "--rows": rows } as CSSProperties}
            className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-5 lg:[grid-template-rows:repeat(var(--rows),minmax(0,1fr))]"
          >
            {isLoading && !regions.length
              ? Array.from({ length: 8 }, (_, index) => (
                  <li key={index} className="min-h-0">
                    <Skeleton className="aspect-[4/3] h-full w-full rounded-2xl bg-white/10 lg:aspect-auto" />
                  </li>
                ))
              : [null, ...regions].map((region, index) => {
                  const wide = index === tileCount - 1 && tileCount % 2 === 1;
                  return (
                    <li key={region?.slug ?? "overview"} className={cn("min-h-0", wide && "col-span-2")}>
                      {region ? (
                        <RegionTile
                          media={region.cover}
                          title={region.name}
                          subtitle={region.tagline}
                          badge={region.tours_count ? plural("tours", region.tours_count) : plural("places", region.attractions_count)}
                          accent={region.accent_color}
                          active={selected === region.map_code}
                          highlighted={hovered === region.map_code}
                          wide={wide}
                          onSelect={() => chooseFromTile(region.map_code)}
                          onHover={(hovering) => setHovered(hovering ? region.map_code : null)}
                        />
                      ) : (
                        <RegionTile
                          media={overviewMedia}
                          title={t("map.wholeCountry")}
                          subtitle={t("map.wholeCountryHint", { regions: plural("regions", regions.length) })}
                          badge={plural("regions", regions.length)}
                          active={selected === null}
                          highlighted={false}
                          wide={wide}
                          onSelect={() => chooseFromTile(null)}
                          onHover={() => setHovered(null)}
                        />
                      )}
                    </li>
                  );
                })}
          </ul>
        </div>
      </div>
    </section>
  );
}

import type { Variants } from "framer-motion";
import { animate, AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, Hand, MapPin, Mountain, MousePointer2, Satellite } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import { useScenes } from "@/api/queries";
import { PhotoCredit, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { useDeviceCapabilities } from "@/hooks/useDeviceCapabilities";
import { useInView } from "@/hooks/useInView";
import { useCoarsePointer } from "@/hooks/useMediaQuery";
import { useMotionSettings } from "@/hooks/useMotionSettings";
import { useI18n } from "@/i18n/context";
import type { JourneyControls } from "@/scenes/controls";
import type { JourneyScene, PageSection } from "@/types/api";
import { cn } from "@/utils/cn";

const JourneyCanvas = lazy(() => import("@/scenes/JourneyCanvas"));

const EASE = [0.16, 1, 0.3, 1] as const;
const TITLE_ZONE = 0.12;

const ENTRANCES = [
  { opacity: 0, x: 0, y: 32, scale: 1 },
  { opacity: 0, x: -40, y: 0, scale: 1 },
  { opacity: 0, x: 0, y: 0, scale: 0.92 },
  { opacity: 0, x: 40, y: 0, scale: 1 },
];

const cardVariants: Variants = {
  hidden: (index: number) => ENTRANCES[index % ENTRANCES.length],
  visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0.7, delay: 0.25, ease: EASE, staggerChildren: 0.07, delayChildren: 0.35 } },
  exit: { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.28, ease: "easeIn" } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  exit: { opacity: 0, y: -14, transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] } },
};

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 26, clipPath: "inset(0% 0% 100% 0%)" },
  visible: { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.8, ease: EASE }, transitionEnd: { clipPath: "none" } },
};

const charVariants: Variants = {
  hidden: { opacity: 0, y: "0.5em" },
  visible: { opacity: 1, y: "0em", transition: { duration: 0.8, ease: EASE } },
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.1, ease: EASE } },
};

const accentVariants: Variants = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: { duration: 1.1, ease: EASE } },
};

const headerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function useTerrainFacts(scene: JourneyScene) {
  const { t, locale, formatNumber, formatDate } = useI18n();
  const terrain = scene.terrain;
  if (!terrain) return null;
  const degrees = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    coordinates:
      terrain.latitude !== null && terrain.longitude !== null
        ? `${t("journey.latitude", { value: degrees.format(terrain.latitude) })} · ${t("journey.longitude", { value: degrees.format(terrain.longitude) })}`
        : null,
    elevation:
      terrain.min_height !== null && terrain.max_height !== null
        ? t("journey.elevationRange", { min: formatNumber(terrain.min_height), max: formatNumber(terrain.max_height) })
        : null,
    imagery: terrain.captured_on
      ? `Sentinel-2 · ${formatDate(terrain.captured_on, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`
      : null,
  };
}

function SplitTitle({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.h3 className={className} aria-label={text} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}>
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`} aria-hidden>
          {wordIndex > 0 ? " " : null}
          <motion.span variants={charVariants} className="inline-block whitespace-nowrap">
            {word}
          </motion.span>
        </span>
      ))}
    </motion.h3>
  );
}

function RevealWords({ text, className }: { text: string; className?: string }) {
  return (
    <motion.p className={className} variants={wordVariants}>
      {text}
    </motion.p>
  );
}

function CountUp({ value, format }: { value: number; format: (value: number) => string }) {
  const node = useRef<HTMLSpanElement>(null);
  const formatter = useRef(format);

  useEffect(() => {
    formatter.current = format;
  }, [format]);

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    const controls = animate(0, value, {
      duration: 1.3,
      delay: 0.35,
      ease: EASE,
      onUpdate: (latest) => {
        element.textContent = formatter.current(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span ref={node}>{format(0)}</span>;
}

function SceneBackdrop({ scene, animate }: { scene: JourneyScene; animate: boolean }) {
  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={scene.slug}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.1 }}
      >
        <ResponsiveImage media={scene.photo} sizes="100vw" className={cn("h-full w-full", animate && "animate-ken-burns")} />
      </motion.div>
    </AnimatePresence>
  );
}

function SceneTelemetry({ scene }: { scene: JourneyScene }) {
  const { t } = useI18n();
  const facts = useTerrainFacts(scene);
  if (!facts) return null;
  const rows = [
    facts.coordinates ? { icon: MapPin, label: t("journey.coordinates"), value: facts.coordinates } : null,
    facts.elevation ? { icon: Mountain, label: t("journey.elevation"), value: facts.elevation } : null,
    facts.imagery ? { icon: Satellite, label: t("journey.imagery"), value: facts.imagery } : null,
  ].filter((row) => row !== null);
  if (rows.length === 0) return null;
  return (
    <motion.dl
      key={scene.slug}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -6, transition: { duration: 0.25 } }}
      variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, staggerChildren: 0.08 } } }}
      className="glass-panel-dark grid gap-2.5 rounded-2xl px-4 py-3.5"
    >
      {rows.map(({ icon: Icon, label, value }) => (
        <motion.div key={label} variants={itemVariants} className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sand-300" aria-hidden />
          <div>
            <dt className="text-[0.62rem] font-bold tracking-[0.18em] text-milk-200/60 uppercase">{label}</dt>
            <dd className="text-sm font-semibold text-milk-50 tabular-nums">{value}</dd>
          </div>
        </motion.div>
      ))}
    </motion.dl>
  );
}

function SceneInfo({ scene, index, total }: { scene: JourneyScene; index: number; total: number }) {
  const { t, path, formatNumber } = useI18n();
  const facts = useTerrainFacts(scene);
  const meters = useCallback((value: number) => t("common.meters", { value: formatNumber(value) }), [t, formatNumber]);
  return (
    <motion.div
      key={scene.slug}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative w-full overflow-hidden rounded-[1.5rem] border border-white/12 bg-gradient-to-br from-night-900/95 via-night-950/92 to-night-950/95 p-5 pl-6 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)] sm:max-w-[27rem] sm:rounded-[1.75rem] sm:p-7 sm:pl-8"
    >
      <span aria-hidden className="pointer-events-none absolute -right-3 -bottom-8 font-display text-[8.5rem] leading-none font-semibold text-white/[0.045] select-none sm:text-[10rem]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <motion.span aria-hidden variants={accentVariants} className="absolute top-6 bottom-6 left-0 w-[3px] origin-top rounded-full bg-gradient-to-b from-sand-300 via-sand-400/70 to-transparent" />
      <motion.p variants={itemVariants} className="relative flex items-start justify-between gap-3 text-[0.68rem] font-semibold tracking-[0.16em] text-sand-300 uppercase sm:text-[0.72rem]">
        <span className="flex min-w-0 items-start gap-2 pt-1 leading-snug">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{scene.attraction?.region.name ?? scene.subtitle}</span>
        </span>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-milk-100 tabular-nums">
          {String(index + 1).padStart(2, "0")} <span className="text-milk-200/50">/ {String(total).padStart(2, "0")}</span>
        </span>
      </motion.p>
      <SplitTitle text={scene.title} className="relative mt-4 pb-1 font-display text-[2.6rem] leading-[0.95] font-semibold text-milk-50 sm:text-[3.1rem]" />
      {scene.subtitle ? (
        <motion.p variants={itemVariants} className="relative mt-2 flex items-center gap-3 text-base font-medium text-sand-200">
          <motion.span aria-hidden variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.6, ease: EASE } } }} className="h-px w-6 origin-left bg-sand-300/70" />
          {scene.subtitle}
        </motion.p>
      ) : null}
      <RevealWords text={scene.description} className="relative mt-3 line-clamp-2 text-[0.94rem] leading-relaxed text-milk-100/90 sm:line-clamp-3" />
      <motion.div variants={itemVariants} className="relative mt-4 flex flex-wrap gap-2 text-xs text-milk-100/85">
        {scene.attraction?.altitude_m ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 tabular-nums">
            <Mountain className="h-3.5 w-3.5 text-sand-300" aria-hidden />
            <CountUp value={scene.attraction.altitude_m} format={meters} />
          </span>
        ) : null}
        {facts?.coordinates ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 tabular-nums lg:hidden">
            <MapPin className="h-3.5 w-3.5 text-sand-300" aria-hidden />
            {facts.coordinates}
          </span>
        ) : null}
      </motion.div>
      {scene.routes.length ? (
        <motion.div variants={itemVariants} className="relative mt-5 hidden lg:block">
          <p className="text-[0.68rem] font-bold tracking-[0.2em] text-milk-200/60 uppercase">{t("journey.routes")}</p>
          <ul className="mt-2 space-y-1">
            {scene.routes.map((route) => (
              <li key={route.slug}>
                <Link to={path(`/routes/${route.slug}`)} className="inline-flex items-center gap-2 text-sm font-semibold text-milk-50 hover:text-sand-200">
                  <ArrowRight className="h-3.5 w-3.5 text-sand-300" aria-hidden />
                  {route.title}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}
      {scene.attraction ? (
        <motion.div variants={itemVariants} className="relative mt-5">
          <Link
            to={path(`/attractions/${scene.attraction.slug}`)}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-sand-400 px-5 py-2.5 text-sm font-semibold text-night-950 shadow-[0_10px_30px_-10px_rgb(214_178_120/0.7)] transition hover:bg-sand-300"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition duration-700 group-hover:translate-x-full" aria-hidden />
            <span className="relative">{scene.cta_label || t("journey.viewPlace")}</span>
            <ArrowRight className="relative h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
          </Link>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

function PlaceSelector({ scenes, active, onSelect }: { scenes: JourneyScene[]; active: number; onSelect: (index: number) => void }) {
  const { t } = useI18n();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const tab = list?.children[active] as HTMLElement | undefined;
    if (!list || !tab) return;
    const left = tab.offsetLeft - list.offsetLeft;
    const visibleStart = list.scrollLeft;
    const visibleEnd = visibleStart + list.clientWidth;
    if (left < visibleStart + 16 || left + tab.offsetWidth > visibleEnd - 48) {
      list.scrollTo({ left: Math.max(left - list.clientWidth / 2 + tab.offsetWidth / 2, 0), behavior: "smooth" });
    }
  }, [active]);

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={t("journey.selectPlace")}
      className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-2.5rem),transparent)]"
    >
      {scenes.map((scene, index) => (
        <button
          key={scene.slug}
          type="button"
          role="tab"
          aria-selected={index === active}
          onClick={() => onSelect(index)}
          className={cn(
            "group relative shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition duration-300",
            index === active ? "border-transparent bg-milk-50 text-night-900 shadow-[0_8px_30px_rgb(0_0_0/0.35)]" : "border-white/25 bg-night-950/70 text-milk-100/90 hover:border-white/60",
          )}
        >
          <span className="mr-2 text-[0.65rem] opacity-60">{String(index + 1).padStart(2, "0")}</span>
          {scene.title}
        </button>
      ))}
    </div>
  );
}

const chapterVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  exit: { opacity: 0, transition: { when: "afterChildren", duration: 0.2, staggerChildren: 0.04, staggerDirection: -1 } },
};

const chapterLetterVariants: Variants = {
  hidden: { opacity: 0, y: "0.55em" },
  visible: { opacity: 1, y: "0em", transition: { duration: 0.85, ease: EASE } },
  exit: { opacity: 0, y: "-0.4em", transition: { duration: 0.38, ease: [0.7, 0, 0.84, 0] } },
};

const growLine: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.9, ease: EASE } },
};

function ChapterTitle({ scene, index, total }: { scene: JourneyScene; index: number; total: number }) {
  const { t, formatNumber } = useI18n();
  const facts = useTerrainFacts(scene);
  const details = [
    scene.attraction?.altitude_m ? t("common.meters", { value: formatNumber(scene.attraction.altitude_m) }) : null,
    facts?.coordinates ?? null,
  ].filter(Boolean);
  const words = scene.title.split(" ");
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 pb-[16vh] text-center sm:pb-[4vh]"
      variants={chapterVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_55%_42%_at_50%_48%,rgb(255_255_255/0.62),rgb(255_255_255/0.18)_55%,transparent_75%)]"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.9 } }, exit: { opacity: 0, transition: { duration: 0.5 } } }}
      />
      <div className="relative max-w-4xl">
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-3 text-[0.66rem] font-bold tracking-[0.3em] text-night-800/75 uppercase sm:gap-4 sm:text-xs"
        >
          <motion.span variants={growLine} className="h-px w-8 origin-right bg-night-800/40 sm:w-14" />
          <span className="tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          {scene.attraction ? <span className="max-sm:hidden">· {scene.attraction.region.name}</span> : null}
          <motion.span variants={growLine} className="h-px w-8 origin-left bg-night-800/40 sm:w-14" />
        </motion.div>
        {scene.attraction ? (
          <motion.p variants={itemVariants} className="mt-2 text-[0.66rem] font-bold tracking-[0.3em] text-night-800/70 uppercase sm:hidden">
            {scene.attraction.region.name}
          </motion.p>
        ) : null}
        <motion.p
          className="mt-4 pb-2 font-display text-[3.4rem] leading-[0.95] font-semibold text-night-900 sm:mt-5 sm:text-[7.5rem]"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
            exit: { transition: { staggerChildren: 0.06, staggerDirection: -1 } },
          }}
        >
          {words.map((word, wordIndex) => (
            <span key={`${word}-${wordIndex}`}>
              {wordIndex > 0 ? " " : null}
              <motion.span variants={chapterLetterVariants} className="inline-block whitespace-nowrap">
                {word}
              </motion.span>
            </span>
          ))}
        </motion.p>
        {scene.subtitle ? (
          <motion.p variants={itemVariants} className="mt-3 text-base font-medium text-night-800/85 sm:mt-4 sm:text-xl">
            {scene.subtitle}
          </motion.p>
        ) : null}
        <motion.span variants={growLine} className="mx-auto mt-6 block h-[2px] w-40 origin-center rounded-full bg-gradient-to-r from-transparent via-sand-500 to-transparent sm:w-56" />
        {details.length ? (
          <motion.p variants={itemVariants} className="mt-4 text-xs font-semibold tracking-[0.12em] text-night-800/70 tabular-nums sm:text-sm">
            {details.join("  ·  ")}
          </motion.p>
        ) : null}
      </div>
    </motion.div>
  );
}

function DataCredit({ scene }: { scene: JourneyScene }) {
  const { t, path } = useI18n();
  if (!scene.terrain) return <PhotoCredit media={scene.photo} />;
  const year = scene.terrain.captured_on?.slice(0, 4) ?? "";
  return (
    <Link to={path("/credits")} className="text-[0.64rem] tracking-wide text-white/65 hover:text-white sm:text-[0.68rem]">
      {t("journey.dataCredit", { year })}
    </Link>
  );
}

export function JourneySection({ section }: { section: PageSection }) {
  const { data: scenes = [] } = useScenes();
  if (scenes.length === 0) return null;
  return <JourneyExperience section={section} scenes={scenes} />;
}

function JourneyExperience({ section, scenes }: { section: PageSection; scenes: JourneyScene[] }) {
  const { t } = useI18n();
  const motionSettings = useMotionSettings();
  const { webgl, lowPower } = useDeviceCapabilities();
  const coarse = useCoarsePointer();
  const containerRef = useRef<HTMLElement>(null);
  const [viewportRef, nearViewport] = useInView<HTMLDivElement>({ rootMargin: "600px 0px" });
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const [chapter, setChapter] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set());
  const controls = useRef<JourneyControls>({ progress: 0.5, yaw: 0, pitch: 0 });
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  const hasTerrain = useMemo(() => scenes.some((scene) => scene.terrain), [scenes]);
  const use3d = webgl && hasTerrain && motionSettings.enable3d && !lowPower && !motionSettings.reduceMotion;
  const quality = coarse && motionSettings.sceneQuality === "high" ? "medium" : motionSettings.sceneQuality;
  const sticky = !motionSettings.reduceMotion && scenes.length > 1;
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  useEffect(() => {
    if (nearViewport) setMounted(true);
  }, [nearViewport]);

  const scrollToScene = useCallback(
    (position: number, behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      if (!container) return;
      const top = container.getBoundingClientRect().top + window.scrollY;
      const segment = (container.offsetHeight - window.innerHeight) / scenes.length;
      window.scrollTo({ top: top + segment * position, behavior });
    },
    [scenes.length],
  );

  const updateProgress = useCallback(
    (progress: number) => {
      const scaled = Math.min(Math.max(progress, 0) * scenes.length, scenes.length - 0.0001);
      controls.current.progress = scaled;
      const index = Math.floor(scaled);
      const local = scaled - index;
      const title = index > 0 && local < TITLE_ZONE ? index : index < scenes.length - 1 && local > 1 - TITLE_ZONE ? index + 1 : null;
      setActive((current) => (current === index ? current : index));
      setChapter((current) => (current === title ? current : title));
    },
    [scenes.length],
  );

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (sticky) updateProgress(progress);
  });

  useEffect(() => {
    if (sticky) updateProgress(scrollYProgress.get());
  }, [sticky, scrollYProgress, updateProgress]);

  useEffect(() => {
    if (!sticky) controls.current.progress = active + 0.5;
  }, [sticky, active]);

  const onReady = useCallback(() => setReady(true), []);
  const onFailed = useCallback((index: number) => setFailed((current) => new Set(current).add(index)), []);

  const selectScene = (index: number) => {
    if (!sticky || !containerRef.current) {
      setActive(index);
      return;
    }
    scrollToScene(index + 0.45);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    drag.current = { x: event.clientX, y: event.clientY, yaw: controls.current.yaw, pitch: controls.current.pitch };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current) {
      controls.current.yaw = Math.max(-0.7, Math.min(0.7, drag.current.yaw - (event.clientX - drag.current.x) * 0.004));
      controls.current.pitch = Math.max(-0.6, Math.min(0.6, drag.current.pitch + (event.clientY - drag.current.y) * 0.003));
      return;
    }
    if (event.pointerType === "mouse") {
      const rect = event.currentTarget.getBoundingClientRect();
      controls.current.yaw = ((event.clientX - rect.left) / rect.width - 0.5) * -0.3;
      controls.current.pitch = ((event.clientY - rect.top) / rect.height - 0.5) * 0.3;
    }
  };
  const endDrag = () => {
    drag.current = null;
  };

  const scene = scenes[Math.min(active, scenes.length - 1)];
  const showCanvas = use3d && ready && Boolean(scene.terrain) && !failed.has(active);
  const titleScene = chapter !== null && showCanvas && sticky ? scenes[chapter] : null;

  return (
    <section
      ref={containerRef}
      aria-labelledby="journey-title"
      className="dark-surface relative bg-night-950 text-milk-50"
      style={sticky ? { height: `${scenes.length * 85 + 100}svh` } : undefined}
    >
      <div ref={viewportRef} className={cn("relative overflow-hidden", sticky ? "sticky top-0 h-[100svh]" : "min-h-[100svh]")}>
        <div
          className="absolute inset-0 touch-pan-y"
          onPointerDown={use3d ? onPointerDown : undefined}
          onPointerMove={use3d ? onPointerMove : undefined}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        >
          {showCanvas ? null : <SceneBackdrop scene={scene} animate={!motionSettings.reduceMotion} />}
          {use3d && mounted ? (
            <Suspense fallback={null}>
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: showCanvas ? 1 : 0, scale: showCanvas ? 1 : 1.06 }}
                transition={{ duration: 1.4, ease: EASE }}
              >
                <JourneyCanvas scenes={scenes} controls={controls} quality={quality} active={nearViewport} onReady={onReady} onFailed={onFailed} />
              </motion.div>
            </Suspense>
          ) : null}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_58%,rgb(5_10_20/0.32))]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-night-950/65 via-night-950/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-night-950/90 via-night-950/40 to-transparent sm:h-[50%] sm:from-night-950/85 sm:via-night-950/30" />
        <AnimatePresence>
          {titleScene && chapter !== null ? <ChapterTitle key={titleScene.slug} scene={titleScene} index={chapter} total={scenes.length} /> : null}
        </AnimatePresence>

        <div className="pointer-events-none relative flex h-full min-h-[100svh] flex-col justify-between">
          <motion.div
            className="container-page flex items-start justify-between gap-8 pt-24 sm:pt-32"
            variants={headerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <div>
              {section.eyebrow ? (
                <motion.p variants={itemVariants} className="eyebrow mb-3 text-sand-300 sm:mb-4">
                  {section.eyebrow}
                </motion.p>
              ) : null}
              <motion.h2 id="journey-title" variants={titleVariants} className="display-lg max-w-2xl pb-1 text-shadow-soft">
                {section.title}
              </motion.h2>
              {section.subtitle ? (
                <motion.p variants={itemVariants} className="mt-4 max-w-xl text-milk-100/85 text-shadow-soft max-sm:hidden [@media(max-height:820px)]:hidden">
                  {section.subtitle}
                </motion.p>
              ) : null}
              {!use3d && webgl === false ? <p className="mt-3 max-w-xl text-xs text-milk-200/70">{t("journey.webglUnavailable")}</p> : null}
              {use3d && !ready ? <p className="mt-3 text-xs text-milk-200/75">{t("journey.loading")}</p> : null}
            </div>
            <div className="hidden w-72 shrink-0 lg:block">
              <AnimatePresence mode="wait">
                {titleScene ? null : <SceneTelemetry key={scene.slug} scene={scene} />}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="container-page pointer-events-auto pb-4 sm:pb-10">
            <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
              <AnimatePresence mode="wait" custom={active}>
                {titleScene ? null : <SceneInfo key={scene.slug} scene={scene} index={active} total={scenes.length} />}
              </AnimatePresence>
              <div className="flex min-w-0 flex-col gap-3 lg:max-w-[46%] lg:items-end">
                {use3d ? (
                  <p className="flex items-center gap-2 text-xs text-milk-200/75 max-sm:hidden">
                    {coarse ? <Hand className="h-4 w-4" aria-hidden /> : <MousePointer2 className="h-4 w-4" aria-hidden />}
                    {sticky ? `${t("journey.scrollHint")} · ${t("journey.dragHint")}` : t("journey.dragHint")}
                  </p>
                ) : null}
                <PlaceSelector scenes={scenes} active={active} onSelect={selectScene} />
              </div>
            </div>
            {sticky ? (
              <div className="mt-3 h-px w-full bg-white/15 sm:mt-5" aria-hidden>
                <motion.div className="h-px origin-left bg-sand-400" style={{ scaleX: scrollYProgress }} />
              </div>
            ) : null}
            <div className="mt-2 flex justify-end sm:mt-3">
              <DataCredit scene={scene} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

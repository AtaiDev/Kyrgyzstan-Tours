import { motion } from "framer-motion";
import { ArrowRight, Compass } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { QuickSearch } from "@/features/search/QuickSearch";
import { useDeviceCapabilities } from "@/hooks/useDeviceCapabilities";
import { useInView } from "@/hooks/useInView";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useMotionSettings } from "@/hooks/useMotionSettings";
import { useI18n } from "@/i18n/context";
import type { Media, PageSection, SectionItem } from "@/types/api";
import { cn } from "@/utils/cn";

const EASE = [0.16, 1, 0.3, 1] as const;
const FULL_QUALITY_DROP_LIMIT = 0.08;
const LIGHT_QUALITY_DROP_LIMIT = 0.25;
const QUALITY_WINDOW_MS = 2500;
const SLOW_BUFFER_MS = 7000;

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

function usePageVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState === "visible");
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

function prefersFullQuality(isDesktop: boolean) {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  const slow = Boolean(connection?.saveData) || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");
  const physicalWidth = window.screen.width * (window.devicePixelRatio || 1);
  return isDesktop && !slow && physicalWidth >= 1800;
}

function rise(enabled: boolean, delay: number) {
  return {
    initial: enabled ? { opacity: 0, y: 22 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay, ease: EASE },
  } as const;
}

function HeroTitle({ text, animate }: { text: string; animate: boolean }) {
  const words = text.trim().split(/\s+/);
  return (
    <h1
      id="hero-title"
      aria-label={text}
      className="max-w-[17ch] font-display text-[clamp(2.6rem,min(7vw,10.5vh),7.2rem)] leading-[0.95] font-semibold tracking-[-0.015em] text-milk-50 text-shadow-soft"
    >
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span aria-hidden className="-mr-[0.08em] -mb-[0.18em] -ml-[0.08em] inline-block overflow-hidden pr-[0.14em] pb-[0.3em] pl-[0.08em] align-bottom">
            <motion.span
              className={cn(
                "-mr-[0.14em] -mb-[0.3em] -ml-[0.08em] inline-block pr-[0.14em] pb-[0.3em] pl-[0.08em]",
                words.length > 1 && index === words.length - 1 && "hero-title-accent italic",
              )}
              initial={animate ? { y: "112%" } : false}
              animate={{ y: 0 }}
              transition={{ duration: 1.25, delay: 0.3 + index * 0.09, ease: EASE }}
            >
              {word}
            </motion.span>
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </h1>
  );
}

function splitStat(value: string) {
  const match = value.trim().match(/^(\D*)(\d[\d\s.,]*)(.*)$/);
  if (!match) return null;
  const number = Number(match[2].replace(/[\s,]/g, ""));
  return Number.isFinite(number) ? { prefix: match[1], number, suffix: match[3] } : null;
}

function HeroStats({ items }: { items: SectionItem[] }) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:gap-6 lg:flex lg:items-center lg:justify-between lg:gap-8">
      {items.map((item, index) => {
        const stat = splitStat(item.value);
        return (
          <li
            key={item.id}
            className={cn("flex min-w-0 items-center gap-3 sm:gap-4", index > 0 && "border-l border-white/15 pl-3 sm:pl-6 lg:pl-8", index >= 3 && "max-lg:hidden")}
          >
            {item.icon ? (
              <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-sand-300 sm:flex lg:hidden xl:flex" aria-hidden>
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
            ) : null}
            <span className="flex min-w-0 flex-col">
              <span className="font-display text-2xl leading-none font-semibold whitespace-nowrap text-milk-50 sm:text-4xl">
                {stat ? (
                  <>
                    {stat.prefix}
                    <AnimatedCounter value={stat.number} />
                    {stat.suffix}
                  </>
                ) : (
                  item.value
                )}
              </span>
              <span className="mt-1 text-[0.7rem] leading-snug text-milk-200/80 sm:text-xs">{item.title}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

interface BackgroundVideoProps {
  video: Media;
  play: boolean;
  dropLimit: number;
  onFallback: () => void;
  fallbackOnSlowBuffer: boolean;
}

function BackgroundVideo({ video, play, dropLimit, onFallback, fallbackOnSlowBuffer }: BackgroundVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [buffered, setBuffered] = useState(false);
  const [smooth, setSmooth] = useState(false);
  const visible = buffered || smooth;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.muted = true;
    element.defaultMuted = true;
    if (play) {
      element.play().catch(() => undefined);
    } else {
      element.pause();
    }
  }, [play]);

  useEffect(() => {
    if (!fallbackOnSlowBuffer || visible) return;
    const timer = window.setTimeout(onFallback, SLOW_BUFFER_MS);
    return () => window.clearTimeout(timer);
  }, [fallbackOnSlowBuffer, onFallback, visible]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !play || !visible || typeof element.getVideoPlaybackQuality !== "function") return;
    let previous = element.getVideoPlaybackQuality();
    let strikes = 0;
    const timer = window.setInterval(() => {
      const current = element.getVideoPlaybackQuality();
      const total = current.totalVideoFrames - previous.totalVideoFrames;
      const dropped = current.droppedVideoFrames - previous.droppedVideoFrames;
      previous = current;
      if (total < 30) return;
      strikes = dropped / total > dropLimit ? strikes + 1 : 0;
      if (strikes >= 2) onFallback();
    }, QUALITY_WINDOW_MS);
    return () => window.clearInterval(timer);
  }, [dropLimit, onFallback, play, visible]);

  return (
    <video
      ref={ref}
      className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-out", visible ? "opacity-100" : "opacity-0")}
      src={video.url}
      muted
      loop
      autoPlay
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      onCanPlayThrough={() => setBuffered(true)}
      onTimeUpdate={(event) => {
        if (!smooth && event.currentTarget.currentTime > 1.5 && event.currentTarget.readyState >= 3) setSmooth(true);
      }}
    />
  );
}

export function HeroSection({ section }: { section: PageSection }) {
  const { path } = useI18n();
  const motionSettings = useMotionSettings();
  const isDesktop = useIsDesktop();
  const { saveData, lowPower } = useDeviceCapabilities();
  const pageVisible = usePageVisible();
  const [viewRef, inView] = useInView<HTMLDivElement>();
  const [downgraded, setDowngraded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const animate = !motionSettings.reduceMotion;
  const full = section.background_video;
  const light = section.background_video_light;
  const wantsFull = !downgraded && !lowPower && prefersFullQuality(isDesktop);
  const video = (wantsFull ? full ?? light : light ?? full) ?? null;
  const showVideo = Boolean(video) && motionSettings.heroVideo && !saveData && !videoFailed;
  const playing = showVideo && pageVisible && inView;
  const poster = section.background;
  const strength = Math.min(0.35 + motionSettings.overlayOpacity * 0.7, 0.9);
  const stats = section.items.slice(0, section.items_limit || section.items.length);
  const canDowngrade = Boolean(video && light && video.id !== light.id);
  const fallback = useCallback(() => (canDowngrade ? setDowngraded(true) : setVideoFailed(true)), [canDowngrade]);

  return (
    <section
      className="dark-surface relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-night-950 text-milk-50"
      aria-labelledby="hero-title"
    >
      <div ref={viewRef} className="absolute inset-0 -z-10 overflow-hidden bg-night-950" aria-hidden>
        <ResponsiveImage media={poster} alt="" priority sizes="100vw" className="absolute inset-0 h-full w-full" />
        {showVideo && video ? (
          <BackgroundVideo
            key={video.url}
            video={video}
            play={playing}
            dropLimit={canDowngrade ? FULL_QUALITY_DROP_LIMIT : LIGHT_QUALITY_DROP_LIMIT}
            onFallback={fallback}
            fallbackOnSlowBuffer={canDowngrade}
          />
        ) : null}
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background: [
              `linear-gradient(90deg, rgba(7,13,23,${strength}) 0%, rgba(7,13,23,${strength * 0.72}) 30%, rgba(7,13,23,${strength * 0.25}) 55%, rgba(7,13,23,0) 72%)`,
              "linear-gradient(180deg, rgba(7,13,23,0.55) 0%, rgba(7,13,23,0) 22%, rgba(7,13,23,0) 68%, rgba(11,21,36,0.88) 100%)",
            ].join(","),
          }}
        />
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background: `linear-gradient(180deg, rgba(7,13,23,${strength * 0.75}) 0%, rgba(7,13,23,${strength * 0.6}) 40%, rgba(7,13,23,${strength * 0.8}) 70%, rgba(11,21,36,0.95) 100%)`,
          }}
        />
      </div>

      <div className="container-page relative flex flex-1 flex-col justify-center pt-28 pb-10 sm:pt-32 lg:pb-12 [@media(min-width:640px)_and_(max-height:820px)]:pt-24 [@media(min-width:640px)_and_(max-height:820px)]:pb-8">
        {section.eyebrow ? (
          <motion.p
            {...rise(animate, 0.15)}
            className="mb-6 inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-night-950/60 py-2 pr-5 pl-3.5 text-[0.68rem] font-semibold tracking-[0.26em] text-sand-200 uppercase shadow-[0_10px_30px_-12px_rgba(0,0,0,0.7)] sm:text-xs"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-sand-300 [animation:hero-pulse_2.6s_ease-in-out_infinite]" aria-hidden />
            {section.eyebrow}
          </motion.p>
        ) : null}
        <HeroTitle text={section.title} animate={animate} />
        {section.subtitle ? (
          <motion.p
            {...rise(animate, 0.75)}
            className="mt-6 max-w-2xl text-base leading-relaxed text-milk-100/90 [text-shadow:0_1px_18px_rgb(0_0_0/0.55)] sm:text-xl [@media(max-height:820px)]:mt-5 [@media(max-height:820px)]:text-lg"
          >
            {section.subtitle}
          </motion.p>
        ) : null}
        <motion.div {...rise(animate, 0.9)} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {section.primary_label ? (
            <LinkButton
              to={path(section.primary_link || "/destinations")}
              variant="accent"
              size="lg"
              iconAfter={<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />}
            >
              {section.primary_label}
            </LinkButton>
          ) : null}
          {section.secondary_label ? (
            <LinkButton to={path(section.secondary_link || "/guides")} variant="glass" size="lg" icon={<Compass className="h-4 w-4" aria-hidden />}>
              {section.secondary_label}
            </LinkButton>
          ) : null}
        </motion.div>
        <motion.div {...rise(animate, 1.05)} className="mt-6 max-w-xl">
          <QuickSearch />
        </motion.div>
      </div>

      {stats.length ? (
        <motion.div {...rise(animate, 1.25)} className="relative border-t border-white/10 bg-night-950/45">
          <div className="container-page py-5 sm:py-6">
            <HeroStats items={stats} />
          </div>
        </motion.div>
      ) : null}
    </section>
  );
}

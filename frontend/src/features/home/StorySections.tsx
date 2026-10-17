import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";

import { useFounder, useReviews, useSite } from "@/api/queries";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { PhotoCredit, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/Rating";
import { NewsletterForm } from "@/features/forms/NewsletterForm";
import { useMotionSettings } from "@/hooks/useMotionSettings";
import { useI18n } from "@/i18n/context";
import type { PageSection } from "@/types/api";
import { cn } from "@/utils/cn";

export function CultureSection({ section }: { section: PageSection }) {
  const { path } = useI18n();
  return (
    <section className="dark-surface relative isolate overflow-hidden bg-night-900 py-24 text-milk-50 sm:py-32" aria-labelledby="culture-title">
      <ResponsiveImage media={section.background} sizes="100vw" className="absolute inset-0 -z-20 h-full w-full opacity-[0.12] mix-blend-luminosity" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night-900 via-night-900/85 to-night-900" aria-hidden />
      <div className="container-page">
        <SectionHeading id={`${section.key}-title`} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} tone="dark" align="center" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item, index) => {
            const content = (
              <>
                <ResponsiveImage media={item.image} sizes="(min-width: 1024px) 30vw, 92vw" className="absolute inset-0 -z-10 h-full w-full transition duration-[1.4s] group-hover:scale-105" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950/95 via-night-950/40 to-transparent" />
                <span className="mb-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sand-300 backdrop-blur-md">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <h3 className="font-display text-3xl font-semibold">{item.title}</h3>
                <p className="mt-2 max-h-0 overflow-hidden text-sm leading-relaxed text-milk-100/85 opacity-0 transition-all duration-500 group-hover:max-h-40 group-hover:opacity-100 group-focus-visible:max-h-40 group-focus-visible:opacity-100 max-lg:max-h-40 max-lg:opacity-100">
                  {item.text}
                </p>
              </>
            );
            const classes = cn(
              "group relative isolate flex min-h-[340px] flex-col overflow-hidden rounded-[var(--radius-card)] p-6",
              index % 3 === 1 && "lg:translate-y-10",
            );
            return (
              <Reveal key={item.id} delay={index * 0.07}>
                {item.link ? (
                  <Link to={path(item.link)} className={classes}>
                    {content}
                  </Link>
                ) : (
                  <div className={classes}>{content}</div>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function NatureSection({ section }: { section: PageSection }) {
  const { path } = useI18n();
  const [active, setActive] = useState(0);
  const current = section.items[active];
  return (
    <section className="bg-milk-100 py-24 sm:py-32" aria-labelledby="nature-title">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <SectionHeading id={`${section.key}-title`} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} className="mb-10 md:mb-12" />
          <ul className="divide-y divide-graphite-200 border-y border-graphite-200">
            {section.items.map((item, index) => (
              <li key={item.id}>
                <Link
                  to={path(item.link || "/tours")}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  className="group flex items-center gap-5 py-6"
                >
                  <span className={cn("font-display text-lg transition", index === active ? "text-glacier-700" : "text-graphite-400")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">
                    <span className={cn("block font-display text-3xl font-semibold transition", index === active ? "text-night-900" : "text-graphite-600")}>{item.title}</span>
                    <span className="mt-1 block text-sm text-graphite-600">{item.text}</span>
                  </span>
                  <ArrowRight className={cn("h-5 w-5 transition", index === active ? "translate-x-0 text-night-900" : "-translate-x-2 text-graphite-300")} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          {section.primary_label ? (
            <LinkButton to={path(section.primary_link || "/tours")} className="mt-10" iconAfter={<ArrowRight className="h-4 w-4" aria-hidden />}>
              {section.primary_label}
            </LinkButton>
          ) : null}
        </div>
        <div className="relative hidden min-h-[560px] overflow-hidden rounded-[var(--radius-card)] lg:block">
          <AnimatePresence mode="sync">
            {current ? (
              <motion.div key={current.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
                <ResponsiveImage media={current.image} sizes="50vw" className="h-full w-full" />
                <PhotoCredit media={current.image} className="absolute right-4 bottom-3" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection({ section }: { section: PageSection }) {
  const { t, path, languageName } = useI18n();
  const { data: site } = useSite();
  const { data } = useReviews({ featured: "true", page_size: section.items_limit || 6 });
  const reviews = data?.results ?? [];
  const [index, setIndex] = useState(0);
  const review = reviews[index];
  if (!review) return null;
  const go = (delta: number) => setIndex((current) => (current + delta + reviews.length) % reviews.length);
  return (
    <section className="dark-surface relative overflow-hidden bg-night-950 py-24 text-milk-50 sm:py-32" aria-labelledby="testimonials-title">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <SectionHeading id={`${section.key}-title`} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} tone="dark" action={section.primary_label ? { label: section.primary_label, to: section.primary_link || "/reviews" } : null} className="md:flex-col md:items-start" />
          {site?.stats.average_rating ? (
            <div className="flex items-center gap-4">
              <span className="font-display text-6xl text-sand-300">{site.stats.average_rating.toFixed(1)}</span>
              <span>
                <Rating value={site.stats.average_rating} size="md" />
                <span className="mt-1 block text-sm text-milk-200/70">{t("reviews.average")}</span>
              </span>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <Quote className="absolute -top-6 -left-2 h-20 w-20 text-white/5" aria-hidden />
          <AnimatePresence mode="wait">
            <motion.figure key={review.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} aria-live="polite">
              <Rating value={review.rating} size="md" />
              <blockquote className="mt-6 font-display text-3xl leading-snug sm:text-4xl">“{review.text}”</blockquote>
              {review.is_translated ? <p className="mt-3 text-xs text-milk-200/50 italic">{t("reviews.translatedFrom", { language: languageName(review.original_language) })}</p> : null}
              <figcaption className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-semibold">{review.author_name}</span>
                <span className="text-sm text-milk-200/60">{review.author_country}</span>
                {review.tour ? (
                  <Link to={path(`/tours/${review.tour.slug}`)} className="text-sm font-semibold text-sand-300 hover:text-sand-200">
                    {review.tour.title}
                  </Link>
                ) : null}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
          <div className="mt-10 flex items-center gap-3">
            <button type="button" onClick={() => go(-1)} aria-label={t("a11y.previous")} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 hover:bg-white/10">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t("a11y.next")} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 hover:bg-white/10">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <div className="ml-4 flex gap-1.5" aria-hidden>
              {reviews.map((item, position) => (
                <span key={item.id} className={cn("h-1.5 rounded-full transition-all", position === index ? "w-8 bg-sand-400" : "w-1.5 bg-white/25")} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FounderSection({ section }: { section: PageSection }) {
  const { t, path } = useI18n();
  const { data: founder } = useFounder();
  if (!founder) return null;
  return (
    <section className="bg-milk-100 py-24 sm:py-32" aria-labelledby="founder-title">
      <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
            <ResponsiveImage media={founder.photo} sizes="(min-width: 1024px) 40vw, 92vw" className="h-full w-full" />
          </div>
          <div className="absolute -right-4 -bottom-6 hidden rounded-2xl bg-night-900 px-6 py-5 text-milk-50 shadow-[var(--shadow-lift)] sm:block">
            <p className="font-display text-4xl text-sand-300">{founder.experience_years}+</p>
            <p className="text-xs tracking-wide text-milk-200/75 uppercase">{t("label.yearsOfExperience")}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow mb-5 text-glacier-700">{section.eyebrow || section.title}</p>
          <h2 id="founder-title" className="display-md text-night-900">
            {founder.headline}
          </h2>
          {founder.quote ? <blockquote className="mt-8 border-l-2 border-sand-400 pl-6 font-display text-2xl leading-snug text-graphite-800 italic">{founder.quote}</blockquote> : null}
          <p className="mt-8 leading-relaxed text-graphite-700">{founder.bio}</p>
          <div className="mt-8 flex items-center gap-4">
            <div>
              <p className="font-display text-2xl font-semibold text-night-900">{founder.name}</p>
              <p className="text-sm text-graphite-500">{founder.role}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {founder.guide_slug ? (
              <LinkButton to={path(`/guides/${founder.guide_slug}`)} variant="outline">
                {t("founder.profile")}
              </LinkButton>
            ) : null}
            {section.primary_label ? (
              <LinkButton to={path(section.primary_link || "/about")} iconAfter={<ArrowRight className="h-4 w-4" aria-hidden />}>
                {section.primary_label}
              </LinkButton>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function AdvantagesSection({ section }: { section: PageSection }) {
  return (
    <section className="dark-surface bg-night-900 py-24 text-milk-50 sm:py-32" aria-labelledby="advantages-title">
      <div className="container-page">
        <SectionHeading id={`${section.key}-title`} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} tone="dark" />
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.06} className="bg-night-900 p-8 transition hover:bg-night-800">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-glacier-500/15 text-glacier-300">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <span className="font-display text-xl text-milk-200/30">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-8 font-display text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-milk-200/75">{item.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaSection({ section }: { section: PageSection }) {
  const { path } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const { parallax } = useMotionSettings();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], parallax ? ["-12%", "12%"] : ["0%", "0%"]);
  return (
    <section ref={ref} className="dark-surface relative isolate overflow-hidden bg-night-950 py-32 text-milk-50 sm:py-44" aria-labelledby="cta-title">
      <motion.div style={{ y }} className="absolute -inset-y-[14%] inset-x-0 -z-20">
        <ResponsiveImage media={section.background} sizes="100vw" className="h-full w-full" />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-night-950/55" aria-hidden />
      <div className="container-page text-center">
        <Reveal>
          {section.eyebrow ? <p className="eyebrow mb-6 justify-center text-sand-300">{section.eyebrow}</p> : null}
          <h2 id="cta-title" className="display-xl mx-auto max-w-4xl text-shadow-soft">
            {section.title}
          </h2>
          {section.subtitle ? <p className="mx-auto mt-6 max-w-2xl text-lg text-milk-100/85">{section.subtitle}</p> : null}
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            {section.primary_label ? (
              <LinkButton to={path(section.primary_link || "/tours")} variant="accent" size="lg" iconAfter={<ArrowRight className="h-4 w-4" aria-hidden />}>
                {section.primary_label}
              </LinkButton>
            ) : null}
            {section.secondary_label ? (
              <LinkButton to={path(section.secondary_link || "/contact")} variant="glass" size="lg">
                {section.secondary_label}
              </LinkButton>
            ) : null}
          </div>
        </Reveal>
      </div>
      <PhotoCredit media={section.background} className="absolute right-4 bottom-3" />
    </section>
  );
}

export function NewsletterSection({ section }: { section: PageSection }) {
  return (
    <section className="dark-surface border-b border-white/5 bg-night-950 py-20 text-milk-50" aria-labelledby="newsletter-title">
      <div className="container-page grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          {section.eyebrow ? <p className="eyebrow mb-4 text-sand-300">{section.eyebrow}</p> : null}
          <h2 id="newsletter-title" className="display-md">
            {section.title}
          </h2>
          {section.subtitle ? <p className="mt-4 max-w-lg text-milk-200/75">{section.subtitle}</p> : null}
        </div>
        <div className="lg:justify-self-end">
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}

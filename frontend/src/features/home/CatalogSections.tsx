import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { useArticles, useDestinations, useGuides, useRoutes, useTours } from "@/api/queries";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { CardSkeletonGrid } from "@/components/ui/States";
import { ArticleCard } from "@/features/cards/ArticleCard";
import { DestinationCard } from "@/features/cards/DestinationCard";
import { GuideCard } from "@/features/cards/GuideCard";
import { RouteCard } from "@/features/cards/RouteCard";
import { TourCard } from "@/features/cards/TourCard";
import { useI18n } from "@/i18n/context";
import type { PageSection } from "@/types/api";
import { cn } from "@/utils/cn";

function action(section: PageSection, fallback: string) {
  return section.primary_label ? { label: section.primary_label, to: section.primary_link || fallback } : null;
}

export function DestinationsSection({ section }: { section: PageSection }) {
  const { data, isLoading } = useDestinations({ featured: "true", page_size: section.items_limit || 5 });
  const items = data?.results ?? [];
  return (
    <section className="bg-milk-100 py-24 sm:py-32" aria-labelledby="destinations-title">
      <div className="container-page">
        <SectionHeading id={`${section.key}-title`} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} action={action(section, "/destinations")} />
        {isLoading ? (
          <CardSkeletonGrid count={3} />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
            {items.map((destination, index) => (
              <Reveal
                key={destination.slug}
                delay={index * 0.08}
                className={cn(index === 0 && "md:col-span-2 lg:row-span-2", index === 3 && "lg:col-span-2")}
              >
                <DestinationCard destination={destination} variant={index === 0 ? "feature" : "default"} className="h-full" />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ToursSection({ section }: { section: PageSection }) {
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useTours({ featured: "true", page_size: section.items_limit || 6 });
  const items = data?.results ?? [];
  const scrollBy = (direction: number) => {
    const node = scroller.current;
    if (node) node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <section className="overflow-hidden bg-milk-50 py-24 sm:py-32" aria-labelledby="tours-title">
      <div className="container-page">
        <SectionHeading id={`${section.key}-title`} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} action={action(section, "/tours")}>
          <div className="mt-8 hidden gap-2 md:flex">
            <button type="button" onClick={() => scrollBy(-1)} aria-label={t("a11y.previous")} className="flex h-12 w-12 items-center justify-center rounded-full border border-night-900/15 transition hover:bg-night-900 hover:text-milk-50">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => scrollBy(1)} aria-label={t("a11y.next")} className="flex h-12 w-12 items-center justify-center rounded-full border border-night-900/15 transition hover:bg-night-900 hover:text-milk-50">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </SectionHeading>
        {isLoading ? (
          <CardSkeletonGrid count={3} />
        ) : (
          <div ref={scroller} className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 pb-6 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10">
            {items.map((tour, index) => (
              <Reveal key={tour.slug} delay={index * 0.06} className="w-[86%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]">
                <TourCard tour={tour} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function GuidesSection({ section }: { section: PageSection }) {
  const { data, isLoading } = useGuides({ featured: "true", page_size: section.items_limit || 4 });
  return (
    <section className="bg-milk-100 py-24 sm:py-32" aria-labelledby="guides-title">
      <div className="container-page">
        <SectionHeading id={`${section.key}-title`} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} action={action(section, "/guides")} />
        {isLoading ? (
          <CardSkeletonGrid count={4} className="lg:grid-cols-4" />
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.results ?? []).map((guide, index) => (
              <Reveal key={guide.slug} delay={index * 0.08} className={index % 2 === 1 ? "lg:mt-16" : undefined}>
                <GuideCard guide={guide} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function RoutesSection({ section }: { section: PageSection }) {
  const { data, isLoading } = useRoutes({ featured: "true", page_size: section.items_limit || 3 });
  return (
    <section className="dark-surface relative overflow-hidden bg-night-900 py-24 text-milk-50 sm:py-32" aria-labelledby="routes-title">
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-sand-500/10 blur-3xl" aria-hidden />
      <div className="container-page relative">
        <SectionHeading id={`${section.key}-title`} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} tone="dark" action={action(section, "/routes")} />
        {isLoading ? (
          <CardSkeletonGrid count={3} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(data?.results ?? []).map((route, index) => (
              <Reveal key={route.slug} delay={index * 0.08}>
                <RouteCard route={route} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function StoriesSection({ section }: { section: PageSection }) {
  const { data, isLoading } = useArticles({ featured: "true", page_size: section.items_limit || 3 });
  const [first, ...rest] = data?.results ?? [];
  return (
    <section className="bg-milk-100 py-24 sm:py-32" aria-labelledby="stories-title">
      <div className="container-page">
        <SectionHeading id={`${section.key}-title`} eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} action={action(section, "/blog")} />
        {isLoading ? (
          <CardSkeletonGrid count={3} />
        ) : first ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_1fr]">
            <Reveal>
              <ArticleCard article={first} variant="large" />
            </Reveal>
            <div className="grid grid-cols-1 gap-10">
              {rest.map((article, index) => (
                <Reveal key={article.slug} delay={0.1 + index * 0.08}>
                  <ArticleCard article={article} />
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

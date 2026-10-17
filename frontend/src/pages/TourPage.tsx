import { CalendarDays, Clock, MapPin, MessageSquareQuote, Mountain, Users } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { useTour } from "@/api/queries";
import { BulletList, DetailSection, FactList } from "@/components/layout/ContentBlocks";
import { DetailState } from "@/components/layout/DetailState";
import { PageHero } from "@/components/layout/PageHero";
import { GalleryGrid } from "@/components/media/Gallery";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Paragraphs } from "@/components/ui/Markdown";
import { Rating } from "@/components/ui/Rating";
import { DifficultyMeter } from "@/features/cards/DifficultyMeter";
import { GuideCard } from "@/features/cards/GuideCard";
import { ReviewCard } from "@/features/cards/ReviewCard";
import { TourCard } from "@/features/cards/TourCard";
import { BookingForm } from "@/features/forms/BookingForm";
import { ReviewForm } from "@/features/forms/ReviewForm";
import { RouteMap } from "@/features/map/RouteMap";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import type { TourDetail } from "@/types/api";

function TourContent({ tour }: { tour: TourDetail }) {
  const { t, path, plural, formatPrice } = useI18n();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(0);
  useSeo({ title: tour.seo_title || tour.title, description: tour.seo_description || tour.summary, image: tour.cover?.url });

  const facts = [
    { label: t("label.duration"), value: plural("days", tour.duration_days), icon: <Clock className="h-4 w-4" aria-hidden /> },
    { label: t("label.groupSize"), value: t("tour.groupSize", { min: tour.group_size_min, max: tour.group_size_max }), icon: <Users className="h-4 w-4" aria-hidden /> },
    { label: t("label.difficulty"), value: <DifficultyMeter value={tour.difficulty} />, icon: <Mountain className="h-4 w-4" aria-hidden /> },
    { label: t("label.region"), value: <Link to={path(`/regions/${tour.region.slug}`)} className="hover:text-glacier-700">{tour.region.name}</Link>, icon: <MapPin className="h-4 w-4" aria-hidden /> },
    { label: t("label.seasons"), value: tour.seasons.map((season) => season.name).join(", "), icon: <CalendarDays className="h-4 w-4" aria-hidden /> },
  ];

  return (
    <>
      <PageHero
        title={tour.title}
        eyebrow={tour.tagline || tour.region.name}
        subtitle={tour.summary}
        image={tour.cover}
        size="lg"
        crumbs={[{ label: t("nav.tours"), to: "/tours" }, { label: tour.title }]}
      >
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">{plural("days", tour.duration_days)}</span>
          <span className="rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">{t(`difficulty.${tour.difficulty}`)}</span>
          {tour.rating ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">
              <Rating value={tour.rating} />
              {plural("reviews", tour.reviews_count)}
            </span>
          ) : null}
        </div>
      </PageHero>

      <div className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div className="min-w-0 space-y-16">
            <DetailSection title={t("label.overview")}>
              <Paragraphs text={tour.description} className="text-lg leading-relaxed text-graphite-700" />
            </DetailSection>

            {tour.days.length ? (
              <DetailSection title={t("label.itinerary")} id="itinerary">
                <ol className="relative space-y-4 before:absolute before:top-3 before:bottom-3 before:left-[1.15rem] before:w-px before:bg-graphite-200">
                  {tour.days.map((day, index) => {
                    const open = openDay === index;
                    return (
                      <li key={day.day} className="relative pl-14">
                        <span className="absolute top-3 left-0 flex h-9 w-9 items-center justify-center rounded-full bg-night-900 text-sm font-bold text-milk-50">{day.day}</span>
                        <div className="rounded-2xl bg-white shadow-[var(--shadow-soft)]">
                          <button
                            type="button"
                            onClick={() => setOpenDay(open ? null : index)}
                            aria-expanded={open}
                            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                          >
                            <span>
                              <span className="block text-xs font-bold tracking-[0.18em] text-glacier-700 uppercase">{t("tour.day", { day: day.day })}</span>
                              <span className="mt-1 block font-display text-2xl font-semibold text-night-900">{day.title}</span>
                            </span>
                            <span className="text-2xl text-graphite-400" aria-hidden>
                              {open ? "−" : "+"}
                            </span>
                          </button>
                          {open ? (
                            <div className="border-t border-graphite-100 px-6 py-5">
                              <p className="leading-relaxed text-graphite-700">{day.description}</p>
                              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-graphite-600">
                                {day.accommodation ? (
                                  <span>
                                    <strong className="text-night-900">{t("label.accommodation")}:</strong> {day.accommodation}
                                  </span>
                                ) : null}
                                {day.meals ? (
                                  <span>
                                    <strong className="text-night-900">{t("label.meals")}:</strong> {day.meals}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </DetailSection>
            ) : null}

            <DetailSection>
              <div className="grid grid-cols-1 gap-8 rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-soft)] sm:grid-cols-2">
                <div>
                  <h3 className="mb-4 font-display text-2xl font-semibold text-night-900">{t("label.included")}</h3>
                  <BulletList items={tour.included} marker="check" />
                </div>
                <div>
                  <h3 className="mb-4 font-display text-2xl font-semibold text-night-900">{t("label.excluded")}</h3>
                  <BulletList items={tour.excluded} marker="cross" />
                </div>
              </div>
            </DetailSection>

            {tour.route ? (
              <DetailSection title={t("tour.routeMap")}>
                <RouteMap points={tour.route.stops} highlightRegions={tour.route.regions.map((region) => region.map_code)} />
                <Link to={path(`/routes/${tour.route.slug}`)} className="mt-4 inline-block text-sm font-semibold text-glacier-700 hover:text-glacier-800">
                  {tour.route.title} →
                </Link>
              </DetailSection>
            ) : null}

            {tour.attractions.length ? (
              <DetailSection title={t("tour.places")}>
                <div className="flex flex-wrap gap-3">
                  {tour.attractions.map((attraction) => (
                    <Link key={attraction.slug} to={path(`/attractions/${attraction.slug}`)} className="group flex items-center gap-3 rounded-full bg-white py-1.5 pr-5 pl-1.5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5">
                      <ResponsiveImage media={attraction.cover} sizes="48px" className="h-10 w-10 rounded-full" />
                      <span className="text-sm font-semibold text-night-900 group-hover:text-glacier-700">{attraction.name}</span>
                    </Link>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            {tour.gallery.length ? (
              <DetailSection title={t("label.gallery")}>
                <GalleryGrid images={tour.gallery} />
              </DetailSection>
            ) : null}

            <DetailSection title={t("tour.reviews")}>
              {tour.reviews.length ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {tour.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-graphite-600">{t("tour.noReviews")}</p>
              )}
              <Button variant="outline" className="mt-6" icon={<MessageSquareQuote className="h-4 w-4" aria-hidden />} onClick={() => setReviewOpen(true)}>
                {t("reviews.write")}
              </Button>
            </DetailSection>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-lift)]">
              <p className="text-xs tracking-wide text-graphite-500 uppercase">{t("common.from")}</p>
              <p className="font-display text-5xl font-semibold text-night-900">{formatPrice(tour.price, tour.currency)}</p>
              <p className="text-sm text-graphite-500">{t("common.perPerson")}</p>
              <div className="mt-6">
                <FactList items={facts} />
              </div>
              {tour.meeting_point ? (
                <p className="mt-4 rounded-xl bg-milk-100 p-4 text-sm text-graphite-700">
                  <strong className="block text-night-900">{t("label.meetingPoint")}</strong>
                  {tour.meeting_point}
                </p>
              ) : null}
              <Button variant="primary" size="lg" className="mt-6 w-full" onClick={() => setBookingOpen(true)}>
                {t("tour.book")}
              </Button>
            </div>
            {tour.guide_profile ? (
              <div className="mt-8 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
                <p className="mb-4 text-xs font-bold tracking-[0.2em] text-glacier-700 uppercase">{t("tour.yourGuide")}</p>
                <GuideCard guide={tour.guide_profile} />
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      {tour.related.length ? (
        <section className="bg-milk-50 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("tour.similar")}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tour.related.map((related, index) => (
                <Reveal key={related.slug} delay={index * 0.06}>
                  <TourCard tour={related} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-graphite-200 bg-milk-50/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div>
          <p className="text-[0.65rem] text-graphite-500 uppercase">{t("common.from")}</p>
          <p className="font-display text-2xl font-semibold text-night-900">{formatPrice(tour.price, tour.currency)}</p>
        </div>
        <Button onClick={() => setBookingOpen(true)}>{t("tour.book")}</Button>
      </div>

      <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} title={t("form.bookingTitle")} description={`${tour.title} · ${t("form.bookingSubtitle")}`} size="lg" closeLabel={t("common.close")}>
        <BookingForm tourSlug={tour.slug} />
      </Dialog>
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} title={t("reviews.formTitle")} description={t("reviews.formText")} size="lg" closeLabel={t("common.close")}>
        <ReviewForm tours={[{ slug: tour.slug, title: tour.title }]} defaultTour={tour.slug} />
      </Dialog>
    </>
  );
}

export default function TourPage() {
  const { slug } = useParams();
  const query = useTour(slug);
  return <DetailState query={query}>{(tour) => <TourContent tour={tour} />}</DetailState>;
}

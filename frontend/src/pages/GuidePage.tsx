import { Award, Languages, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { useGuide } from "@/api/queries";
import { BulletList, DetailSection, FactList } from "@/components/layout/ContentBlocks";
import { DetailState } from "@/components/layout/DetailState";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { RevealWords } from "@/components/motion/Reveal";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Paragraphs } from "@/components/ui/Markdown";
import { Rating } from "@/components/ui/Rating";
import { ReviewCard } from "@/features/cards/ReviewCard";
import { TourCard } from "@/features/cards/TourCard";
import { BookingForm } from "@/features/forms/BookingForm";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import type { GuideDetail } from "@/types/api";

function GuideContent({ guide }: { guide: GuideDetail }) {
  const { t, path, plural } = useI18n();
  const [contactOpen, setContactOpen] = useState(false);
  useSeo({ title: guide.seo_title || guide.name, description: guide.seo_description || guide.headline, image: guide.photo?.url });

  return (
    <>
      <section className="dark-surface relative overflow-hidden bg-night-900 pt-32 pb-16 text-milk-50 sm:pb-24">
        <div className="pointer-events-none absolute top-0 right-0 h-[40rem] w-[40rem] rounded-full bg-glacier-600/10 blur-3xl" aria-hidden />
        <div className="container-page relative grid grid-cols-1 items-end gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-lift)]">
            <ResponsiveImage media={guide.photo} priority sizes="(min-width: 1024px) 38vw, 92vw" className="h-full w-full" />
          </div>
          <div>
            <Breadcrumbs items={[{ label: t("nav.guides"), to: "/guides" }, { label: guide.name }]} className="mb-8" />
            <p className="eyebrow mb-5 text-sand-300">{guide.headline}</p>
            <h1 className="display-xl">
              <RevealWords text={guide.name} />
            </h1>
            {guide.quote ? <p className="mt-6 max-w-xl font-display text-2xl leading-snug text-milk-100/85 italic">“{guide.quote}”</p> : null}
            <div className="mt-8 max-w-xl rounded-[var(--radius-card)] bg-white/5 p-6">
              <FactList
                tone="dark"
                items={[
                  { label: t("label.languages"), value: guide.languages.map((language) => language.name).join(", "), icon: <Languages className="h-4 w-4" aria-hidden /> },
                  { label: t("guide.areas"), value: guide.regions.map((region) => region.name).join(", "), icon: <MapPin className="h-4 w-4" aria-hidden /> },
                  { label: t("label.experience"), value: plural("years", guide.experience_years), icon: <Award className="h-4 w-4" aria-hidden /> },
                  {
                    label: t("label.rating"),
                    value: guide.rating ? (
                      <span className="inline-flex items-center gap-2">
                        <Rating value={guide.rating} /> {plural("reviews", guide.reviews_count)}
                      </span>
                    ) : null,
                  },
                ]}
              />
            </div>
            <Button variant="accent" size="lg" className="mt-8" icon={<MessageCircle className="h-4 w-4" aria-hidden />} onClick={() => setContactOpen(true)}>
              {t("guide.contact")}
            </Button>
          </div>
        </div>
      </section>
      <div className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <DetailSection title={t("label.overview")}>
            <Paragraphs text={guide.bio} className="text-lg leading-relaxed text-graphite-700" />
          </DetailSection>
          {guide.specialization.length ? (
            <DetailSection title={t("label.specialization")}>
              <div className="rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-soft)]">
                <BulletList items={guide.specialization} />
                <div className="mt-6 flex flex-wrap gap-2">
                  {guide.travel_styles.map((style) => (
                    <Link key={style.slug} to={path(`/tours?style=${style.slug}`)} className="rounded-full border border-graphite-200 px-3 py-1 text-xs font-semibold text-graphite-700 hover:border-night-900">
                      {style.name}
                    </Link>
                  ))}
                </div>
              </div>
            </DetailSection>
          ) : null}
        </div>
      </div>
      {guide.tours.length ? (
        <section className="bg-milk-50 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("guide.tours")}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {guide.tours.map((tour) => (
                <TourCard key={tour.slug} tour={tour} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {guide.reviews.length ? (
        <section className="bg-milk-100 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("guide.reviews")}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {guide.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <Dialog open={contactOpen} onClose={() => setContactOpen(false)} title={t("guide.bookTitle", { name: guide.name })} description={t("form.bookingSubtitle")} size="lg" closeLabel={t("common.close")}>
        <BookingForm guideSlug={guide.slug} tours={guide.tours.map((tour) => ({ slug: tour.slug, title: tour.title }))} />
      </Dialog>
    </>
  );
}

export default function GuidePage() {
  const { slug } = useParams();
  const query = useGuide(slug);
  return <DetailState query={query}>{(guide) => <GuideContent guide={guide} />}</DetailState>;
}

import { MessageSquareQuote } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { useReviews, useSite, useTours } from "@/api/queries";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Rating } from "@/components/ui/Rating";
import { ReviewCard } from "@/features/cards/ReviewCard";
import { ReviewForm } from "@/features/forms/ReviewForm";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import { paramsFromSearch } from "@/utils/query";

export default function ReviewsPage() {
  const { t, plural } = useI18n();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(false);
  const { data: site } = useSite();
  const { data: tours } = useTours({ page_size: 60 });
  const query = useReviews(paramsFromSearch(params, ["tour", "guide", "page"]));
  useSeo({ pageKey: "reviews", title: t("page.reviewsTitle") });

  return (
    <>
      <PageHero title={t("page.reviewsTitle")} subtitle={t("page.reviewsSubtitle")} image={site?.default_og_image} crumbs={[{ label: t("nav.reviews") }]}>
        <div className="flex flex-wrap items-center gap-6">
          {site?.stats.average_rating ? (
            <div className="flex items-center gap-3">
              <span className="font-display text-5xl text-sand-300">{site.stats.average_rating.toFixed(1)}</span>
              <span>
                <Rating value={site.stats.average_rating} size="md" />
                <span className="block text-sm text-milk-200/70">{plural("reviews", site.stats.reviews)}</span>
              </span>
            </div>
          ) : null}
          <Button variant="accent" icon={<MessageSquareQuote className="h-4 w-4" aria-hidden />} onClick={() => setOpen(true)}>
            {t("reviews.write")}
          </Button>
        </div>
      </PageHero>
      <section className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page">
          <CatalogResults
            query={query}
            render={(review, index) => (
              <Reveal key={review.id} delay={(index % 3) * 0.05}>
                <ReviewCard review={review} />
              </Reveal>
            )}
          />
        </div>
      </section>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("reviews.formTitle")} description={t("reviews.formText")} size="lg" closeLabel={t("common.close")}>
        <ReviewForm tours={(tours?.results ?? []).map((tour) => ({ slug: tour.slug, title: tour.title }))} />
      </Dialog>
    </>
  );
}

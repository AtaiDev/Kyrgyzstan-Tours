import { useSearchParams } from "react-router";

import { useSite, useTaxonomies, useTourFacets, useTours } from "@/api/queries";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import type { FilterDefinition } from "@/components/catalog/FilterPanel";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { TourCard } from "@/features/cards/TourCard";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import { paramsFromSearch } from "@/utils/query";

const TOUR_PARAMS = ["region", "style", "season", "difficulty", "price_min", "price_max", "duration_min", "duration_max", "search", "ordering", "page", "guide", "destination"] as const;

export default function ToursPage() {
  const { t, plural } = useI18n();
  const [params] = useSearchParams();
  const { data: taxonomies } = useTaxonomies();
  const { data: facets } = useTourFacets();
  const { data: site } = useSite();
  const query = useTours(paramsFromSearch(params, TOUR_PARAMS));
  useSeo({ pageKey: "tours", title: t("page.toursTitle") });

  const priceMax = facets?.price_max ? Math.ceil(Number(facets.price_max)) : undefined;
  const filters: FilterDefinition[] = [
    { key: "region", label: t("filter.region"), type: "select", options: (taxonomies?.regions ?? []).map((item) => ({ value: item.slug, label: item.name })) },
    { key: "style", label: t("filter.style"), type: "select", options: (taxonomies?.travel_styles ?? []).map((item) => ({ value: item.slug, label: item.name })) },
    { key: "season", label: t("filter.season"), type: "select", options: (taxonomies?.seasons ?? []).map((item) => ({ value: item.code, label: item.name })) },
    { key: "difficulty", label: t("filter.difficulty"), type: "select", options: (taxonomies?.difficulties ?? []).map((value) => ({ value, label: t(`difficulty.${value}`) })) },
    { key: "price_max", label: t("filter.priceMax"), type: "number", min: 0, max: priceMax, placeholder: priceMax ? `≤ ${priceMax}` : undefined },
    { key: "duration_max", label: t("filter.durationMax"), type: "number", min: 1, max: facets?.duration_max ?? undefined, placeholder: facets?.duration_max ? `≤ ${facets.duration_max}` : undefined },
  ];
  const sortOptions = [
    { value: "", label: t("sort.recommended") },
    { value: "price", label: t("sort.priceAsc") },
    { value: "-price", label: t("sort.priceDesc") },
    { value: "duration_days", label: t("sort.durationAsc") },
    { value: "-duration_days", label: t("sort.durationDesc") },
    { value: "-rating", label: t("sort.rating") },
  ];

  return (
    <>
      <PageHero
        title={t("page.toursTitle")}
        subtitle={t("page.toursSubtitle")}
        image={query.data?.results[0]?.cover ?? site?.default_og_image}
        crumbs={[{ label: t("nav.tours") }]}
      />
      <section className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page">
          <FilterPanel
            filters={filters}
            searchPlaceholder={t("filter.searchTours")}
            sortOptions={sortOptions}
            resultLabel={query.data ? plural("tours", query.data.count) : undefined}
          />
          <CatalogResults
            query={query}
            render={(tour, index) => (
              <Reveal key={tour.slug} delay={(index % 3) * 0.06}>
                <TourCard tour={tour} priority={index < 3} />
              </Reveal>
            )}
          />
        </div>
      </section>
    </>
  );
}

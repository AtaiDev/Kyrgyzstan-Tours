import { useSearchParams } from "react-router";

import { useAttractions, useDestinations, useSite, useTaxonomies } from "@/api/queries";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import type { FilterDefinition } from "@/components/catalog/FilterPanel";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { AttractionCard } from "@/features/cards/AttractionCard";
import { DestinationCard } from "@/features/cards/DestinationCard";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import type { MessageKey } from "@/i18n/types";
import { cn } from "@/utils/cn";
import { paramsFromSearch, updateSearch } from "@/utils/query";

export default function DestinationsPage() {
  const { t, plural } = useI18n();
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "attractions" ? "attractions" : "destinations";
  const { data: taxonomies } = useTaxonomies();
  const { data: site } = useSite();
  const destinationQuery = useDestinations(view === "destinations" ? paramsFromSearch(params, ["region", "style", "season", "search", "page"]) : { page_size: 1 });
  const attractionQuery = useAttractions(view === "attractions" ? paramsFromSearch(params, ["region", "kind", "season", "search", "page"]) : { page_size: 1 });
  useSeo({ pageKey: "destinations", title: t("page.destinationsTitle") });

  const regionFilter: FilterDefinition = {
    key: "region",
    label: t("filter.region"),
    type: "select",
    options: (taxonomies?.regions ?? []).map((region) => ({ value: region.slug, label: region.name })),
  };
  const seasonFilter: FilterDefinition = {
    key: "season",
    label: t("filter.season"),
    type: "select",
    options: (taxonomies?.seasons ?? []).map((season) => ({ value: season.code, label: season.name })),
  };
  const filters: FilterDefinition[] =
    view === "destinations"
      ? [
          regionFilter,
          { key: "style", label: t("filter.style"), type: "select", options: (taxonomies?.travel_styles ?? []).map((style) => ({ value: style.slug, label: style.name })) },
          seasonFilter,
        ]
      : [
          regionFilter,
          { key: "kind", label: t("filter.kind"), type: "select", options: (taxonomies?.attraction_kinds ?? []).map((kind) => ({ value: kind, label: t(`kind.${kind}` as MessageKey) })) },
          seasonFilter,
        ];

  const activeQuery = view === "destinations" ? destinationQuery : attractionQuery;
  const count = activeQuery.data?.count;

  return (
    <>
      <PageHero
        title={t("page.destinationsTitle")}
        subtitle={t("page.destinationsSubtitle")}
        image={destinationQuery.data?.results[0]?.cover ?? site?.default_og_image}
        crumbs={[{ label: t("nav.destinations") }]}
      />
      <section className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page">
          <div role="tablist" className="mb-8 inline-flex rounded-full bg-white p-1 shadow-[var(--shadow-soft)]">
            {(["destinations", "attractions"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={view === tab}
                onClick={() => setParams(updateSearch(new URLSearchParams(), { view: tab === "attractions" ? "attractions" : null }))}
                className={cn("rounded-full px-5 py-2.5 text-sm font-semibold transition", view === tab ? "bg-night-900 text-milk-50" : "text-graphite-600 hover:text-night-900")}
              >
                {tab === "destinations" ? t("label.destinations") : t("label.attractions")}
              </button>
            ))}
          </div>
          <FilterPanel
            filters={filters}
            searchPlaceholder={t("filter.searchDestinations")}
            resultLabel={count !== undefined ? (view === "destinations" ? plural("destinations", count) : plural("attractions", count)) : undefined}
          />
          {view === "destinations" ? (
            <CatalogResults
              query={destinationQuery}
              render={(destination, index) => (
                <Reveal key={destination.slug} delay={(index % 3) * 0.06}>
                  <DestinationCard destination={destination} className="h-full" />
                </Reveal>
              )}
            />
          ) : (
            <CatalogResults
              query={attractionQuery}
              className="lg:grid-cols-4"
              render={(attraction, index) => (
                <Reveal key={attraction.slug} delay={(index % 4) * 0.05}>
                  <AttractionCard attraction={attraction} className="h-full" />
                </Reveal>
              )}
            />
          )}
        </div>
      </section>
    </>
  );
}

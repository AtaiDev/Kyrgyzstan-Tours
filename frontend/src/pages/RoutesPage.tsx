import { useSearchParams } from "react-router";

import { useRoutes, useTaxonomies } from "@/api/queries";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import type { FilterDefinition } from "@/components/catalog/FilterPanel";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { RouteCard } from "@/features/cards/RouteCard";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import { paramsFromSearch } from "@/utils/query";

export default function RoutesPage() {
  const { t, plural } = useI18n();
  const [params] = useSearchParams();
  const { data: taxonomies } = useTaxonomies();
  const query = useRoutes(paramsFromSearch(params, ["region", "difficulty", "search", "ordering", "page"]));
  useSeo({ pageKey: "routes", title: t("page.routesTitle") });

  const filters: FilterDefinition[] = [
    { key: "region", label: t("filter.region"), type: "select", options: (taxonomies?.regions ?? []).map((item) => ({ value: item.slug, label: item.name })) },
    { key: "difficulty", label: t("filter.difficulty"), type: "select", options: (taxonomies?.difficulties ?? []).map((value) => ({ value, label: t(`difficulty.${value}`) })) },
  ];

  return (
    <>
      <PageHero title={t("page.routesTitle")} subtitle={t("page.routesSubtitle")} image={query.data?.results[0]?.cover} crumbs={[{ label: t("nav.routes") }]} />
      <section className="dark-surface bg-night-950 py-16 text-milk-50 sm:py-20">
        <div className="container-page">
          <div className="rounded-[var(--radius-card)] bg-milk-100 p-5 text-graphite-900 sm:p-6">
            <FilterPanel
              filters={filters}
              searchPlaceholder={t("filter.search")}
              sortOptions={[
                { value: "", label: t("sort.recommended") },
                { value: "duration_days", label: t("sort.durationAsc") },
                { value: "-duration_days", label: t("sort.durationDesc") },
              ]}
              resultLabel={query.data ? plural("results", query.data.count) : undefined}
            />
          </div>
          <div className="mt-10">
            <CatalogResults
              query={query}
              render={(route, index) => (
                <Reveal key={route.slug} delay={(index % 3) * 0.06}>
                  <RouteCard route={route} />
                </Reveal>
              )}
            />
          </div>
        </div>
      </section>
    </>
  );
}

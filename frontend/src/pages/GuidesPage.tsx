import { useSearchParams } from "react-router";

import { useGuides, useSite, useTaxonomies } from "@/api/queries";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import type { FilterDefinition } from "@/components/catalog/FilterPanel";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { GuideCard } from "@/features/cards/GuideCard";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import { paramsFromSearch } from "@/utils/query";

export default function GuidesPage() {
  const { t, plural } = useI18n();
  const [params] = useSearchParams();
  const { data: taxonomies } = useTaxonomies();
  const { data: site } = useSite();
  const query = useGuides(paramsFromSearch(params, ["language", "region", "style", "search", "ordering", "page"]));
  useSeo({ pageKey: "guides", title: t("page.guidesTitle") });

  const filters: FilterDefinition[] = [
    { key: "language", label: t("filter.language"), type: "select", options: (taxonomies?.languages ?? []).map((item) => ({ value: item.code, label: item.name })) },
    { key: "region", label: t("filter.region"), type: "select", options: (taxonomies?.regions ?? []).map((item) => ({ value: item.slug, label: item.name })) },
    { key: "style", label: t("filter.style"), type: "select", options: (taxonomies?.travel_styles ?? []).map((item) => ({ value: item.slug, label: item.name })) },
  ];

  return (
    <>
      <PageHero title={t("page.guidesTitle")} subtitle={t("page.guidesSubtitle")} image={site?.default_og_image} crumbs={[{ label: t("nav.guides") }]} />
      <section className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page">
          <FilterPanel
            filters={filters}
            searchPlaceholder={t("filter.searchGuides")}
            sortOptions={[
              { value: "", label: t("sort.recommended") },
              { value: "-experience_years", label: t("sort.experience") },
              { value: "-rating", label: t("sort.rating") },
            ]}
            resultLabel={query.data ? plural("guides", query.data.count) : undefined}
          />
          <CatalogResults
            query={query}
            className="gap-y-12 lg:grid-cols-4"
            skeletonCount={4}
            render={(guide, index) => (
              <Reveal key={guide.slug} delay={(index % 4) * 0.06}>
                <GuideCard guide={guide} />
              </Reveal>
            )}
          />
        </div>
      </section>
    </>
  );
}

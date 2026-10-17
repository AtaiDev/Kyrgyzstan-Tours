import { useSearchParams } from "react-router";

import { useArticleCategories, useArticles, useSite } from "@/api/queries";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { ArticleCard } from "@/features/cards/ArticleCard";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";
import { paramsFromSearch, updateSearch } from "@/utils/query";

export default function BlogPage() {
  const { t, plural } = useI18n();
  const [params, setParams] = useSearchParams();
  const { data: categories = [] } = useArticleCategories();
  const { data: site } = useSite();
  const query = useArticles(paramsFromSearch(params, ["category", "search", "page"]));
  useSeo({ pageKey: "blog", title: t("page.blogTitle") });
  const active = params.get("category") ?? "";

  return (
    <>
      <PageHero title={t("page.blogTitle")} subtitle={t("page.blogSubtitle")} image={query.data?.results[0]?.cover ?? site?.default_og_image} crumbs={[{ label: t("nav.blog") }]} />
      <section className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page">
          <div className="scrollbar-none -mx-4 mb-8 flex gap-2 overflow-x-auto px-4" role="tablist">
            {[{ slug: "", name: t("blog.allCategories") }, ...categories].map((category) => (
              <button
                key={category.slug || "all"}
                type="button"
                role="tab"
                aria-selected={active === category.slug}
                onClick={() => setParams(updateSearch(params, { category: category.slug || null }))}
                className={cn(
                  "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition",
                  active === category.slug ? "bg-night-900 text-milk-50" : "bg-white text-graphite-700 hover:text-night-900",
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
          <FilterPanel filters={[]} searchPlaceholder={t("filter.searchArticles")} resultLabel={query.data ? plural("results", query.data.count) : undefined} />
          <CatalogResults
            query={query}
            className="gap-y-14"
            render={(article, index) => (
              <Reveal key={article.slug} delay={(index % 3) * 0.06}>
                <ArticleCard article={article} />
              </Reveal>
            )}
          />
        </div>
      </section>
    </>
  );
}

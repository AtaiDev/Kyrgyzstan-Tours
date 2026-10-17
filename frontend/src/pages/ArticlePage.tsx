import { useParams } from "react-router";

import { useArticle } from "@/api/queries";
import { DetailState } from "@/components/layout/DetailState";
import { PageHero } from "@/components/layout/PageHero";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Markdown } from "@/components/ui/Markdown";
import { ArticleCard } from "@/features/cards/ArticleCard";
import { TourCard } from "@/features/cards/TourCard";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import type { ArticleDetail } from "@/types/api";

function ArticleContent({ article }: { article: ArticleDetail }) {
  const { t, formatDate, plural } = useI18n();
  useSeo({ title: article.seo_title || article.title, description: article.seo_description || article.excerpt, image: article.cover?.url, type: "article" });
  return (
    <>
      <PageHero
        title={article.title}
        eyebrow={article.category?.name}
        subtitle={article.excerpt}
        image={article.cover}
        crumbs={[{ label: t("nav.blog"), to: "/blog" }, { label: article.title }]}
      />
      <article className="bg-milk-50 py-16 sm:py-20">
        <div className="container-page max-w-3xl">
          <div className="mb-10 flex flex-wrap items-center gap-4 border-b border-graphite-200 pb-8 text-sm text-graphite-600">
            {article.author ? (
              <span className="flex items-center gap-3">
                <ResponsiveImage media={article.author.photo} sizes="48px" className="h-11 w-11 rounded-full" />
                <span>
                  <span className="block font-semibold text-night-900">{article.author.name}</span>
                  <span className="text-xs">{article.author.role}</span>
                </span>
              </span>
            ) : null}
            <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
            <span>· {plural("minutes", article.reading_minutes)}</span>
          </div>
          <Markdown>{article.body}</Markdown>
        </div>
      </article>
      {article.tours.length ? (
        <section className="bg-milk-100 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("blog.relatedTours")}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {article.tours.map((tour) => (
                <TourCard key={tour.slug} tour={tour} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {article.related.length ? (
        <section className="bg-milk-50 py-20">
          <div className="container-page">
            <h2 className="mb-10 font-display text-4xl font-semibold text-night-900">{t("blog.related")}</h2>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              {article.related.map((item) => (
                <ArticleCard key={item.slug} article={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default function ArticlePage() {
  const { slug } = useParams();
  const query = useArticle(slug);
  return <DetailState query={query}>{(article) => <ArticleContent article={article} />}</DetailState>;
}

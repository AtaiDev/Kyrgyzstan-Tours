import { Link } from "react-router";

import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { useI18n } from "@/i18n/context";
import type { ArticleCard as ArticleCardData } from "@/types/api";
import { cn } from "@/utils/cn";

export function ArticleCard({ article, variant = "default", className }: { article: ArticleCardData; variant?: "default" | "large"; className?: string }) {
  const { path, formatDate, plural } = useI18n();
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className={cn("relative overflow-hidden rounded-[var(--radius-card)]", variant === "large" ? "aspect-[16/10]" : "aspect-[4/3]")}>
        <ResponsiveImage
          media={article.cover}
          sizes={variant === "large" ? "(min-width: 1024px) 55vw, 92vw" : "(min-width: 1024px) 30vw, 92vw"}
          className="h-full w-full transition duration-[1.4s] group-hover:scale-105"
        />
      </div>
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-wide text-graphite-500">
          {article.category ? <span className="text-glacier-700 uppercase">{article.category.name}</span> : null}
          <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          <span>· {plural("minutes", article.reading_minutes)}</span>
        </div>
        <h3 className={cn("mt-2 font-display leading-tight font-semibold text-night-900", variant === "large" ? "text-4xl" : "text-2xl")}>
          <Link to={path(`/blog/${article.slug}`)} className="after:absolute after:inset-0 focus-visible:outline-none">
            <span className="bg-gradient-to-r from-current to-current bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
              {article.title}
            </span>
          </Link>
        </h3>
        {article.excerpt ? <p className="mt-3 line-clamp-3 text-graphite-600">{article.excerpt}</p> : null}
      </div>
    </article>
  );
}

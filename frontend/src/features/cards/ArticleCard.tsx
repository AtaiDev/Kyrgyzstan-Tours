import { Link } from "react-router";

import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { useI18n } from "@/i18n/context";
import type { ArticleCard as ArticleCardData } from "@/types/api";
import { cn } from "@/utils/cn";
import { HOVER_ZOOM } from "@/utils/motion";

export function ArticleCard({ article, variant = "default", className }: { article: ArticleCardData; variant?: "default" | "large" | "compact"; className?: string }) {
  const { path, formatDate, plural } = useI18n();
  const compact = variant === "compact";
  return (
    <article className={cn("group relative flex", compact ? "flex-row items-start gap-5" : "flex-col", className)}>
      <div className={cn("relative overflow-hidden rounded-[var(--radius-card)]", variant === "large" ? "aspect-[16/10]" : "aspect-[4/3]", compact && "w-2/5 shrink-0")}>
        <ResponsiveImage
          media={article.cover}
          sizes={variant === "large" ? "(min-width: 1024px) 55vw, 92vw" : compact ? "(min-width: 1024px) 15vw, 40vw" : "(min-width: 1024px) 30vw, 92vw"}
          className={cn(HOVER_ZOOM, "h-full w-full group-hover:scale-[1.035]")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950/35 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden />
      </div>
      <div className={compact ? "min-w-0 flex-1" : "mt-5"}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-wide text-graphite-500">
          {article.category ? <span className="text-glacier-700 uppercase">{article.category.name}</span> : null}
          <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          <span>· {plural("minutes", article.reading_minutes)}</span>
        </div>
        <h3 className={cn("mt-2 font-display leading-tight font-semibold text-night-900", variant === "large" ? "text-4xl" : compact ? "text-xl" : "text-2xl")}>
          <Link to={path(`/blog/${article.slug}`)} className="after:absolute after:inset-0 focus-visible:outline-none">
            <span className="bg-gradient-to-r from-current to-current bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 ease-[var(--ease-out-expo)] group-hover:bg-[length:100%_1px]">
              {article.title}
            </span>
          </Link>
        </h3>
        {article.excerpt ? <p className={cn("mt-3 text-graphite-600", compact ? "line-clamp-2 text-sm" : "line-clamp-3")}>{article.excerpt}</p> : null}
      </div>
    </article>
  );
}

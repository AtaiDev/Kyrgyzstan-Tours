import { Quote } from "lucide-react";
import { Link } from "react-router";

import { Rating } from "@/components/ui/Rating";
import { useI18n } from "@/i18n/context";
import type { Review } from "@/types/api";
import { cn } from "@/utils/cn";

export function ReviewCard({ review, tone = "light", className }: { review: Review; tone?: "light" | "dark"; className?: string }) {
  const { t, path, formatDate, languageName } = useI18n();
  const dark = tone === "dark";
  const initials = review.author_name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <figure
      className={cn(
        "flex h-full flex-col rounded-[var(--radius-card)] p-7",
        dark ? "border border-white/10 bg-white/5 text-milk-50" : "bg-white text-graphite-900 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <Rating value={review.rating} />
        <Quote className={cn("h-7 w-7", dark ? "text-sand-300/40" : "text-sand-400/50")} aria-hidden />
      </div>
      {review.title ? <h3 className="mt-5 font-display text-2xl leading-tight font-semibold">{review.title}</h3> : null}
      <blockquote className={cn("mt-3 flex-1 leading-relaxed", dark ? "text-milk-100/85" : "text-graphite-700")}>
        <p>{review.text}</p>
      </blockquote>
      {review.is_translated ? (
        <p className={cn("mt-3 text-xs italic", dark ? "text-milk-200/50" : "text-graphite-400")}>
          {t("reviews.translatedFrom", { language: languageName(review.original_language) })}
        </p>
      ) : null}
      <figcaption className={cn("mt-6 flex items-center gap-3 border-t pt-5", dark ? "border-white/10" : "border-graphite-100")}>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold", dark ? "bg-sand-400 text-night-950" : "bg-night-900 text-milk-50")}>
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{review.author_name}</span>
          <span className={cn("block truncate text-xs", dark ? "text-milk-200/60" : "text-graphite-500")}>
            {[review.author_country, review.travel_date ? t("reviews.travelled", { date: formatDate(review.travel_date, { month: "long", year: "numeric" }) }) : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {review.tour ? (
            <Link to={path(`/tours/${review.tour.slug}`)} className={cn("mt-0.5 block truncate text-xs font-semibold", dark ? "text-sand-300 hover:text-sand-200" : "text-glacier-700 hover:text-glacier-800")}>
              {review.tour.title}
            </Link>
          ) : null}
        </span>
      </figcaption>
    </figure>
  );
}

import { Star } from "lucide-react";

import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

export function Rating({ value, size = "sm", className }: { value: number; size?: "sm" | "md"; className?: string }) {
  const { t } = useI18n();
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={t("a11y.rating", { rating: value.toFixed(1) })}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden
          className={cn(iconSize, index < Math.round(value) ? "fill-sand-400 text-sand-400" : "fill-transparent text-graphite-300")}
        />
      ))}
    </span>
  );
}

export function RatingInput({ value, onChange, error }: { value: number; onChange: (value: number) => void; error?: string }) {
  const { t } = useI18n();
  return (
    <div>
      <div role="radiogroup" aria-label={t("form.rating")} className="flex gap-1">
        {Array.from({ length: 5 }, (_, index) => {
          const rating = index + 1;
          return (
            <button
              key={rating}
              type="button"
              role="radio"
              aria-checked={value === rating}
              aria-label={t("a11y.selectRating", { rating })}
              onClick={() => onChange(rating)}
              className="rounded-md p-1 transition hover:scale-110"
            >
              <Star className={cn("h-7 w-7", rating <= value ? "fill-sand-400 text-sand-400" : "text-graphite-300")} aria-hidden />
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-1 text-sm text-danger-600">{error}</p> : null}
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";

import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

function pageList(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

export function Pagination({ page, totalPages, onChange, tone = "light" }: { page: number; totalPages: number; onChange: (page: number) => void; tone?: "light" | "dark" }) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;
  const base = tone === "dark" ? "text-milk-100 hover:bg-white/10" : "text-night-900 hover:bg-night-900/5";
  return (
    <nav aria-label={t("common.page", { page, total: totalPages })} className="mt-12 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={cn("flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-30", base)}
        aria-label={t("common.previous")}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      {pageList(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-graphite-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition",
              item === page ? (tone === "dark" ? "bg-milk-50 text-night-900" : "bg-night-900 text-milk-50") : base,
            )}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={cn("flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-30", base)}
        aria-label={t("common.next")}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </nav>
  );
}

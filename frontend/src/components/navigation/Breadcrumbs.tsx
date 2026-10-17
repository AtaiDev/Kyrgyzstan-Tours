import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items, tone = "dark", className }: { items: Crumb[]; tone?: "light" | "dark"; className?: string }) {
  const { t, path } = useI18n();
  const all: Crumb[] = [{ label: t("breadcrumbs.home"), to: "/" }, ...items];
  return (
    <nav aria-label={t("breadcrumbs.label")} className={className}>
      <ol className={cn("flex flex-wrap items-center gap-1.5 text-xs font-medium tracking-wide", tone === "dark" ? "text-milk-200/75" : "text-graphite-500")}>
        {all.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="h-3 w-3 opacity-60" aria-hidden /> : null}
            {item.to && index < all.length - 1 ? (
              <Link to={path(item.to)} className={cn("transition", tone === "dark" ? "hover:text-white" : "hover:text-night-900")}>
                {item.label}
              </Link>
            ) : (
              <span aria-current={index === all.length - 1 ? "page" : undefined} className={tone === "dark" ? "text-milk-50" : "text-graphite-800"}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

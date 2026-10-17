import { ImageOff, Star } from "lucide-react";

import type { AdminRecord, MediaBrief } from "../types";
import { DemoBadge, StatusBadge, TranslationBadges } from "../ui/Primitives";
import type { ColumnConfig } from "./types";

export function Thumb({ media }: { media: unknown }) {
  const asset = media as MediaBrief | null | undefined;
  if (!asset?.thumbnail_url) {
    return (
      <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-graphite-100 text-graphite-400">
        <ImageOff className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  return <img src={asset.thumbnail_url} alt="" className="h-11 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />;
}

export function titleColumn(imageKey?: string, subtitleKey = "slug"): ColumnConfig {
  return {
    key: "display_name",
    label: "Название",
    render: (item: AdminRecord) => (
      <div className="flex items-center gap-3">
        {imageKey ? <Thumb media={item[imageKey]} /> : null}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-night-900">{String(item.display_name || "Без названия")}</span>
            {item.is_demo ? <DemoBadge /> : null}
          </div>
          {item[subtitleKey] ? <div className="truncate font-mono text-xs text-graphite-500">{String(item[subtitleKey])}</div> : null}
        </div>
      </div>
    ),
  };
}

export const translationsColumn: ColumnConfig = {
  key: "missing_translations",
  label: "Переводы",
  render: (item) => <TranslationBadges missing={item.missing_translations} />,
};

export function toggleColumn(key: string, label: string): ColumnConfig {
  return { key, label, toggle: key, className: "w-28" };
}

export function textColumn(key: string, label: string, ordering?: string, format?: (value: unknown, item: AdminRecord) => string): ColumnConfig {
  return {
    key,
    label,
    ordering,
    render: (item) => <span className="text-graphite-700">{format ? format(item[key], item) : String(item[key] ?? "—")}</span>,
  };
}

export function dateColumn(key: string, label: string, withTime = false): ColumnConfig {
  return {
    key,
    label,
    ordering: key,
    render: (item) => {
      const value = item[key];
      if (!value) return <span className="text-graphite-400">—</span>;
      const date = new Date(String(value));
      return (
        <span className="whitespace-nowrap text-graphite-700">
          {date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
          {withTime ? ` ${date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : ""}
        </span>
      );
    },
  };
}

export function statusColumn(key = "status"): ColumnConfig {
  return { key, label: "Статус", ordering: key, render: (item) => <StatusBadge status={String(item[key])} /> };
}

export const ratingColumn: ColumnConfig = {
  key: "rating",
  label: "Оценка",
  ordering: "rating",
  render: (item) => (
    <span className="inline-flex items-center gap-1 font-semibold text-night-900">
      <Star className="h-4 w-4 fill-sand-400 text-sand-400" aria-hidden />
      {String(item.rating)}
    </span>
  ),
};

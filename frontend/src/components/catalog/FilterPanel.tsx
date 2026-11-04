import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";
import { updateSearch } from "@/utils/query";

export type FilterDefinition =
  | { key: string; label: string; type: "select"; options: Array<{ value: string; label: string }>; placeholder?: string }
  | { key: string; label: string; type: "number"; min?: number; max?: number; placeholder?: string };

interface FilterPanelProps {
  filters: FilterDefinition[];
  searchPlaceholder: string;
  sortOptions?: Array<{ value: string; label: string }>;
  resultLabel?: string;
}

// Shared surface for every control in the bar, so search, filters and sort read as one system.
const surface =
  "rounded-2xl bg-milk-100/80 ring-1 ring-transparent ring-inset transition duration-300 hover:bg-milk-100 hover:ring-graphite-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glacier-600/40";
const segment = cn(surface, "w-full px-4 py-2.5 text-sm font-semibold text-night-900 data-[open]:bg-white data-[open]:ring-glacier-600/40 data-[filled]:bg-glacier-200/40 data-[filled]:ring-glacier-600/25");
const caption = "block truncate text-[0.68rem] font-semibold tracking-[0.14em] text-graphite-500 uppercase";

function SearchInput({ placeholder }: { placeholder: string }) {
  const [params, setParams] = useSearchParams();
  const [value, setValue] = useState(params.get("search") ?? "");
  const debounced = useDebouncedValue(value, 350);
  const { t } = useI18n();

  useEffect(() => {
    if ((params.get("search") ?? "") !== debounced) {
      setParams(updateSearch(params, { search: debounced.trim() || null }), { replace: true, preventScrollReset: true });
    }
  }, [debounced, params, setParams]);

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="catalog-search">
        {t("filter.search")}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-4 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-graphite-400" aria-hidden />
      <input
        id="catalog-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className={cn(
          surface,
          "h-14 w-full pr-12 pl-11 text-base text-night-900 sm:text-[0.95rem] placeholder:text-graphite-400 focus:bg-white focus:ring-2 focus:ring-glacier-600/40 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      <button
        type="button"
        onClick={() => setValue("")}
        aria-label={t("filter.clearSearch")}
        tabIndex={value ? 0 : -1}
        className={cn(
          "absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-graphite-500 transition duration-300 hover:bg-night-900/5 hover:text-night-900",
          value ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0",
        )}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function FilterControl({ filter }: { filter: FilterDefinition }) {
  const [params, setParams] = useSearchParams();
  const { t } = useI18n();
  const value = params.get(filter.key) ?? "";
  const set = (next: string) => setParams(updateSearch(params, { [filter.key]: next || null }), { preventScrollReset: true });

  if (filter.type === "select") {
    return (
      <Select
        label={filter.label}
        value={value}
        onChange={set}
        placeholder={filter.placeholder ?? t("filter.any")}
        options={filter.options}
        className={cn(segment, "cursor-pointer")}
      />
    );
  }
  return (
    <label data-filled={value ? true : undefined} className={cn(segment, "block cursor-text focus-within:bg-white focus-within:ring-2 focus-within:ring-glacier-600/40")}>
      <span className={caption}>{filter.label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={filter.min}
        max={filter.max}
        placeholder={filter.placeholder ?? t("filter.any")}
        value={value}
        onChange={(event) => set(event.target.value)}
        className="block w-full [appearance:textfield] bg-transparent max-sm:text-base placeholder:font-semibold placeholder:text-night-900/60 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </label>
  );
}

export function FilterPanel({ filters, searchPlaceholder, sortOptions, resultLabel }: FilterPanelProps) {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  // Remounting the search box is what clears its local text; otherwise its debounce would write the old query back.
  const [searchKey, setSearchKey] = useState(0);
  const search = params.get("search");

  const chips = [
    ...(search ? [{ key: "search", text: `«${search}»` }] : []),
    ...filters.flatMap((filter) => {
      const value = params.get(filter.key);
      if (!value) return [];
      const text = filter.type === "select" ? (filter.options.find((option) => option.value === value)?.label ?? value) : `${filter.label}: ${value}`;
      return [{ key: filter.key, text }];
    }),
  ];
  const activeCount = chips.length;

  const remove = (key: string) => {
    if (key === "search") setSearchKey((current) => current + 1);
    setParams(updateSearch(params, { [key]: null }), { preventScrollReset: true });
  };
  const clear = () => {
    setSearchKey((current) => current + 1);
    setParams(new URLSearchParams(), { preventScrollReset: true });
  };

  return (
    <div className="mb-10 space-y-4">
      <div className="rounded-[1.75rem] border border-graphite-100 bg-white p-2.5 shadow-[var(--shadow-soft)] sm:p-3">
        <div className="flex flex-col gap-2.5 md:flex-row">
          <div className="min-w-0 flex-1">
            <SearchInput key={searchKey} placeholder={searchPlaceholder} />
          </div>
          <div className="flex gap-2.5">
            {sortOptions ? (
              <Select
                label={<span className="hidden sm:inline">{t("sort.label")}:</span>}
                inlineLabel
                aria-label={t("sort.label")}
                value={params.get("ordering") ?? sortOptions[0]?.value ?? ""}
                onChange={(next) => setParams(updateSearch(params, { ordering: next || null }), { preventScrollReset: true })}
                options={sortOptions}
                className={cn(surface, "h-14 min-w-0 flex-1 cursor-pointer px-4 text-sm font-semibold text-night-900 data-[open]:bg-white data-[open]:ring-glacier-600/40 md:flex-none")}
              />
            ) : null}
            {filters.length ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(surface, "inline-flex h-14 shrink-0 items-center gap-2 px-4 text-sm font-semibold text-night-900 lg:hidden", !sortOptions && "flex-1 justify-center md:flex-none")}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                {t("common.filters")}
                {activeCount ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-night-900 px-1.5 text-[0.7rem] text-milk-50">{activeCount}</span> : null}
              </button>
            ) : null}
          </div>
        </div>
        {filters.length ? (
          <div className="mt-2.5 hidden gap-2.5 lg:grid" style={{ gridTemplateColumns: `repeat(${Math.min(filters.length, 6)}, minmax(0, 1fr))` }}>
            {filters.map((filter) => (
              <FilterControl key={filter.key} filter={filter} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1 text-sm">
        <span aria-live="polite" className="mr-2 font-semibold text-night-900">
          {resultLabel}
        </span>
        <AnimatePresence initial={false}>
          {chips.map((chip) => (
            <motion.span
              key={chip.key}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-1 rounded-full bg-night-900 py-1 pr-1 pl-3 text-xs font-semibold text-milk-50"
            >
              {chip.text}
              <button
                type="button"
                onClick={() => remove(chip.key)}
                aria-label={`${t("filter.removeFilter")}: ${chip.text}`}
                className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white/15"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {activeCount > 1 ? (
          <button type="button" onClick={clear} className="ml-1 font-semibold text-graphite-600 underline-offset-4 transition hover:text-night-900 hover:underline">
            {t("common.clearFilters")}
          </button>
        ) : null}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title={t("common.filters")} closeLabel={t("common.close")}>
        <div className="mt-2 grid grid-cols-1 gap-2.5">
          {filters.map((filter) => (
            <FilterControl key={filter.key} filter={filter} />
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={clear}>
            {t("common.clearFilters")}
          </Button>
          <Button className="flex-1" onClick={() => setOpen(false)}>
            {t("common.showResults")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

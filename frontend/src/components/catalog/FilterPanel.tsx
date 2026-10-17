import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SelectField, TextField } from "@/components/ui/Fields";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useI18n } from "@/i18n/context";
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
      <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-graphite-400" aria-hidden />
      <input
        id="catalog-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-full border border-graphite-200 bg-white pr-4 pl-11 text-sm focus:border-glacier-600 focus:ring-2 focus:ring-glacier-500/20 focus:outline-none"
      />
    </div>
  );
}

function FilterFields({ filters }: { filters: FilterDefinition[] }) {
  const [params, setParams] = useSearchParams();
  const { t } = useI18n();
  const set = (key: string, value: string) => setParams(updateSearch(params, { [key]: value || null }), { preventScrollReset: true });
  return (
    <div className="grid grid-cols-1 gap-4">
      {filters.map((filter) =>
        filter.type === "select" ? (
          <SelectField
            key={filter.key}
            label={filter.label}
            value={params.get(filter.key) ?? ""}
            onChange={(event) => set(filter.key, event.target.value)}
            placeholder={filter.placeholder ?? t("filter.any")}
            options={filter.options}
          />
        ) : (
          <TextField
            key={filter.key}
            type="number"
            inputMode="numeric"
            label={filter.label}
            min={filter.min}
            max={filter.max}
            placeholder={filter.placeholder}
            value={params.get(filter.key) ?? ""}
            onChange={(event) => set(filter.key, event.target.value)}
          />
        ),
      )}
    </div>
  );
}

export function FilterPanel({ filters, searchPlaceholder, sortOptions, resultLabel }: FilterPanelProps) {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const activeCount = filters.filter((filter) => params.get(filter.key)).length + (params.get("search") ? 1 : 0);
  const clear = () => setParams(new URLSearchParams(), { preventScrollReset: true });

  return (
    <div className="mb-10 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <SearchInput placeholder={searchPlaceholder} />
        </div>
        <div className="flex items-center gap-3">
          {sortOptions ? (
            <label className="flex items-center gap-2 text-sm text-graphite-600">
              <span className="hidden sm:inline">{t("sort.label")}</span>
              <select
                value={params.get("ordering") ?? ""}
                onChange={(event) => setParams(updateSearch(params, { ordering: event.target.value || null }), { preventScrollReset: true })}
                className="h-12 rounded-full border border-graphite-200 bg-white px-4 text-sm font-semibold focus:border-glacier-600 focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Button variant="outline" className="lg:hidden" icon={<SlidersHorizontal className="h-4 w-4" aria-hidden />} onClick={() => setOpen(true)}>
            {t("common.filters")}
            {activeCount ? <span className="rounded-full bg-night-900 px-2 text-xs text-milk-50">{activeCount}</span> : null}
          </Button>
        </div>
      </div>
      <div className="hidden items-end gap-4 lg:grid" style={{ gridTemplateColumns: `repeat(${Math.min(filters.length, 6)}, minmax(0, 1fr))` }}>
        {filters.map((filter) => (
          <FilterFields key={filter.key} filters={[filter]} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-graphite-600">
        <span aria-live="polite">{resultLabel}</span>
        {activeCount ? (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 font-semibold text-night-900 hover:text-glacier-700">
            <X className="h-4 w-4" aria-hidden />
            {t("common.clearFilters")}
          </button>
        ) : null}
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("common.filters")} closeLabel={t("common.close")}>
        <FilterFields filters={filters} />
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

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { publicApi } from "@/api/public";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useI18n } from "@/i18n/context";
import type { MessageKey } from "@/i18n/types";
import type { SearchHit } from "@/types/api";
import { cn } from "@/utils/cn";

const GROUPS: Array<{ key: "destinations" | "tours" | "attractions" | "regions" | "guides"; label: MessageKey; base: string }> = [
  { key: "destinations", label: "search.destinations", base: "/destinations" },
  { key: "tours", label: "search.tours", base: "/tours" },
  { key: "attractions", label: "search.attractions", base: "/attractions" },
  { key: "regions", label: "search.regions", base: "/regions" },
  { key: "guides", label: "search.guides", base: "/guides" },
];

interface Option {
  id: string;
  hit: SearchHit;
  href: string;
  group: MessageKey;
}

export function QuickSearch({ className }: { className?: string }) {
  const { t, language, path, formatPrice, plural } = useI18n();
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(query.trim(), 250);

  const search = useQuery({
    queryKey: ["search", language, debounced],
    queryFn: ({ signal }) => publicApi.search(debounced, language, signal),
    enabled: debounced.length >= 2,
    staleTime: 60 * 1000,
  });

  const options = useMemo<Option[]>(() => {
    const results = search.data?.results ?? {};
    return GROUPS.flatMap((group) =>
      (results[group.key] ?? []).map((hit) => ({ id: `${group.key}-${hit.slug}`, hit, href: path(`${group.base}/${hit.slug}`), group: group.label })),
    );
  }, [search.data, path]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((current) => Math.min(current + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active >= 0 && options[active]) go(options[active].href);
      else if (query.trim()) go(`${path("/tours")}?search=${encodeURIComponent(query.trim())}`);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && query.trim().length > 0;
  let lastGroup: string | null = null;

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-2xl", className)}>
      <label htmlFor={`${listId}-input`} className="sr-only">
        {t("hero.searchLabel")}
      </label>
      <div className="glass-panel flex items-center gap-3 rounded-full py-2 pr-2 pl-5">
        <Search className="h-5 w-5 shrink-0 text-milk-100/80" aria-hidden />
        <input
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && options[active] ? `${listId}-${options[active].id}` : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("hero.searchPlaceholder")}
          autoComplete="off"
          className="h-11 min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-milk-100/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => query.trim() && go(`${path("/tours")}?search=${encodeURIComponent(query.trim())}`)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand-400 text-night-950 transition hover:bg-sand-300"
          aria-label={t("hero.searchLabel")}
        >
          {search.isFetching ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ArrowRight className="h-5 w-5" aria-hidden />}
        </button>
      </div>
      <AnimatePresence>
        {showPanel ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full z-30 mt-3 max-h-[60vh] overflow-y-auto rounded-3xl bg-milk-50 p-2 text-graphite-900 shadow-[var(--shadow-lift)]"
          >
            <ul id={listId} role="listbox" aria-label={t("hero.searchLabel")}>
              {query.trim().length < 2 ? (
                <li className="px-4 py-3 text-sm text-graphite-500">{t("search.minChars")}</li>
              ) : search.isFetching && !search.data ? (
                <li className="px-4 py-3 text-sm text-graphite-500">{t("search.searching")}</li>
              ) : options.length === 0 ? (
                <li className="px-4 py-3 text-sm text-graphite-500">{t("search.empty", { query: debounced })}</li>
              ) : (
                options.map((option, index) => {
                  const header = option.group !== lastGroup ? option.group : null;
                  lastGroup = option.group;
                  return (
                    <li key={option.id} role="presentation">
                      {header ? <p className="px-4 pt-3 pb-1 text-[0.68rem] font-bold tracking-[0.2em] text-glacier-700 uppercase">{t(header)}</p> : null}
                      <div
                        id={`${listId}-${option.id}`}
                        role="option"
                        aria-selected={index === active}
                        onMouseEnter={() => setActive(index)}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          go(option.href);
                        }}
                        className={cn("flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2", index === active ? "bg-night-900/5" : "")}
                      >
                        {option.hit.image ? (
                          <img src={option.hit.image} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" loading="lazy" />
                        ) : (
                          <span className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-night-700 to-glacier-700" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{option.hit.title}</span>
                          {option.hit.price ? (
                            <span className="block text-xs text-graphite-500">
                              {t("common.from")} {formatPrice(option.hit.price, option.hit.currency ?? "USD")} · {plural("days", option.hit.duration_days ?? 1)}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { inputClasses } from "@/components/ui/Fields";
import { cn } from "@/utils/cn";

import { adminApi } from "../api";

export function useChoices(endpoint: string) {
  return useQuery({ queryKey: ["admin", "choices", endpoint], queryFn: () => adminApi.choices(endpoint), enabled: Boolean(endpoint), staleTime: 60 * 1000 });
}

export function RelationSelect({ endpoint, value, onChange, id, invalid, allowEmpty = true }: { endpoint: string; value: number | null; onChange: (value: number | null) => void; id?: string; invalid?: boolean; allowEmpty?: boolean }) {
  const { data = [], isLoading } = useChoices(endpoint);
  return (
    <select
      id={id}
      value={value ?? ""}
      aria-invalid={invalid}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      className={inputClasses("light", invalid)}
    >
      {allowEmpty ? <option value="">{isLoading ? "Загрузка…" : "— не выбрано —"}</option> : null}
      {data.map((choice) => (
        <option key={choice.id} value={choice.id}>
          {choice.label}
        </option>
      ))}
    </select>
  );
}

export function RelationMulti({ endpoint, value, onChange, id }: { endpoint: string; value: number[]; onChange: (value: number[]) => void; id?: string }) {
  const { data = [], isLoading } = useChoices(endpoint);
  const [filter, setFilter] = useState("");
  const visible = useMemo(() => data.filter((choice) => choice.label.toLowerCase().includes(filter.toLowerCase())), [data, filter]);
  const toggle = (choiceId: number) => onChange(value.includes(choiceId) ? value.filter((item) => item !== choiceId) : [...value, choiceId]);
  return (
    <div id={id} className="rounded-xl border border-graphite-200 bg-white">
      {data.length > 8 ? (
        <div className="relative border-b border-graphite-100">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-graphite-400" aria-hidden />
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Фильтр…" className="h-10 w-full rounded-t-xl pr-3 pl-9 text-sm focus:outline-none" />
        </div>
      ) : null}
      <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto p-3">
        {isLoading ? <span className="text-sm text-graphite-500">Загрузка…</span> : null}
        {visible.map((choice) => {
          const active = value.includes(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => toggle(choice.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                active ? "border-glacier-600 bg-glacier-200/50 text-glacier-800" : "border-graphite-200 text-graphite-700 hover:border-graphite-400",
              )}
            >
              {active ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
              {choice.label}
            </button>
          );
        })}
        {!isLoading && visible.length === 0 ? <span className="text-sm text-graphite-500">Нет вариантов</span> : null}
      </div>
    </div>
  );
}

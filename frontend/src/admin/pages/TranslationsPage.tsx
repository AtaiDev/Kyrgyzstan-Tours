import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Fields";
import { Spinner } from "@/components/ui/States";
import { dictionaries, en } from "@/i18n/dictionaries";
import { LANGUAGE_META, LANGUAGES } from "@/i18n/languages";
import type { Language } from "@/i18n/languages";
import type { MessageKey } from "@/i18n/types";
import { cn } from "@/utils/cn";

import { adminApi } from "../api";
import { useAdminAuth } from "../auth";
import { adminPathForResource } from "../resources/registry";
import { useFeedback } from "../ui/feedback";
import { Card, PageHeader } from "../ui/Primitives";

type Overrides = Record<string, Record<Language, string>>;

const KEYS = Object.keys(en.messages) as MessageKey[];
const PAGE_SIZE = 40;
const GROUP_LABELS: Record<string, string> = {
  nav: "Навигация",
  common: "Общие",
  label: "Подписи",
  difficulty: "Сложность",
  kind: "Типы мест",
  hero: "Первый экран",
  search: "Поиск",
  map: "Карта",
  journey: "3D-путешествие",
  seasons: "Сезоны",
  reviews: "Отзывы",
  founder: "Основатель",
  newsletter: "Рассылка",
  form: "Формы",
  filter: "Фильтры",
  sort: "Сортировка",
  page: "Заголовки страниц",
  blog: "Блог",
  faq: "Вопросы",
  contact: "Контакты",
  tour: "Экскурсия",
  guide: "Гид",
  region: "Область",
  attraction: "Достопримечательность",
  route: "Маршрут",
  destination: "Направление",
  footer: "Футер",
  breadcrumbs: "Навигационная цепочка",
  a11y: "Доступность",
};

function InterfaceStrings() {
  const { canModel } = useAdminAuth();
  const { notify, notifyError } = useFeedback();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "interface-strings"], queryFn: () => adminApi.interfaceStrings() });
  const [overrides, setOverrides] = useState<Overrides>({});
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const canChange = canModel("site_content.interfacestring", "change") && canModel("site_content.interfacestring", "add");

  const loaded = useMemo<Overrides>(() => {
    const result: Overrides = {};
    for (const row of query.data ?? []) result[row.key] = { ru: row.value_ru, en: row.value_en, ky: row.value_ky };
    return result;
  }, [query.data]);

  useEffect(() => setOverrides(loaded), [loaded]);

  const changedKeys = KEYS.filter((key) => LANGUAGES.some((code) => (overrides[key]?.[code] ?? "") !== (loaded[key]?.[code] ?? "")));

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return KEYS.filter((key) => {
      if (group && !key.startsWith(`${group}.`)) return false;
      if (onlyChanged && !loaded[key] && !changedKeys.includes(key)) return false;
      if (!needle) return true;
      return key.toLowerCase().includes(needle) || LANGUAGES.some((code) => dictionaries[code].messages[key].toLowerCase().includes(needle) || (overrides[key]?.[code] ?? "").toLowerCase().includes(needle));
    });
  }, [search, group, onlyChanged, loaded, overrides, changedKeys]);

  const pageKeys = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const update = (key: string, code: Language, value: string) =>
    setOverrides((current) => ({ ...current, [key]: { ...(current[key] ?? { ru: "", en: "", ky: "" }), [code]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      const items = changedKeys.map((key) => ({ key, value_ru: overrides[key]?.ru ?? "", value_en: overrides[key]?.en ?? "", value_ky: overrides[key]?.ky ?? "" }));
      const result = await adminApi.saveInterfaceStrings(items);
      notify("success", "Переводы интерфейса сохранены", `Обновлено: ${result.saved}, сброшено к стандартным: ${result.removed}.`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "interface-strings"] });
      await queryClient.invalidateQueries({ queryKey: ["interface-strings"] });
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  if (query.isLoading) return <Spinner label="Загрузка…" />;

  return (
    <div>
      <p className="mb-4 max-w-4xl text-sm text-graphite-600">
        Все надписи интерфейса сайта (кнопки, подписи, сообщения форм). Серым показан стандартный текст — введите свой вариант, чтобы заменить его на сайте. Очистите поле, чтобы вернуть стандартный текст.
      </p>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-graphite-400" aria-hidden />
          <input type="search" aria-label="Поиск" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Поиск по ключу или тексту…" className={cn(inputClasses(), "h-11 py-2 pl-10")} />
        </div>
        <select aria-label="Раздел" value={group} onChange={(event) => { setGroup(event.target.value); setPage(1); }} className={cn(inputClasses(), "h-11 py-2")}>
          <option value="">Все разделы</option>
          {Object.entries(GROUP_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-graphite-700">
          <input type="checkbox" checked={onlyChanged} onChange={(event) => { setOnlyChanged(event.target.checked); setPage(1); }} className="h-4 w-4 accent-glacier-700" />
          Только изменённые
        </label>
      </div>
      <div className="space-y-3">
        {pageKeys.map((key) => (
          <div key={key} className={cn("rounded-2xl border bg-white p-4", changedKeys.includes(key) ? "border-sand-400" : loaded[key] ? "border-glacier-500/40" : "border-graphite-200")}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <code className="rounded bg-graphite-100 px-2 py-0.5 text-xs text-graphite-700">{key}</code>
              {loaded[key] ? <span className="text-xs font-semibold text-glacier-700">изменён администратором</span> : null}
              {changedKeys.includes(key) ? <span className="text-xs font-semibold text-sand-700">не сохранено</span> : null}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {LANGUAGES.map((code) => {
                const fallback = dictionaries[code].messages[key];
                return (
                  <label key={code} className="block">
                    <span className="mb-1 block text-[0.68rem] font-bold text-night-700">{LANGUAGE_META[code].short}</span>
                    <textarea
                      rows={2}
                      disabled={!canChange}
                      value={overrides[key]?.[code] ?? ""}
                      placeholder={fallback}
                      onChange={(event) => update(key, code, event.target.value)}
                      className={cn(inputClasses(), "resize-y py-2 text-sm", !fallback && !overrides[key]?.[code] && "border-danger-600")}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Назад
          </Button>
          <span>
            {page} / {totalPages} · ключей: {filtered.length}
          </span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
            Вперёд
          </Button>
        </div>
        {canChange ? (
          <Button loading={saving} disabled={!changedKeys.length} icon={<Save className="h-4 w-4" aria-hidden />} onClick={() => void save()}>
            Сохранить изменения ({changedKeys.length})
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ContentCoverage() {
  const query = useQuery({ queryKey: ["admin", "coverage"], queryFn: () => adminApi.coverage() });
  if (query.isLoading) return <Spinner label="Подсчитываем переводы…" />;
  if (!query.data) return <p className="text-danger-600">Не удалось загрузить данные.</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {LANGUAGES.map((code) => (
          <Card key={code}>
            <p className="text-sm text-graphite-600">{LANGUAGE_META[code].native}</p>
            <p className="mt-1 font-display text-4xl font-semibold text-night-900">{query.data.summary[code]}%</p>
            <p className="text-xs text-graphite-500">записей с заполненными обязательными полями</p>
          </Card>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-graphite-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-graphite-100/60 text-left text-xs tracking-wide text-graphite-600 uppercase">
            <tr>
              <th className="px-4 py-3">Раздел</th>
              <th className="px-4 py-3">Записей</th>
              {LANGUAGES.map((code) => (
                <th key={code} className="px-4 py-3">
                  Нет {LANGUAGE_META[code].short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-100">
            {query.data.resources.map((row) => (
              <tr key={row.resource}>
                <td className="px-4 py-3 font-semibold text-night-900">
                  <Link to={adminPathForResource(row.resource)} className="hover:text-glacier-700">
                    {row.label}
                  </Link>
                </td>
                <td className="px-4 py-3 text-graphite-600">{row.total}</td>
                {LANGUAGES.map((code) => (
                  <td key={code} className="px-4 py-3">
                    {row.missing[code] ? (
                      <Link to={adminPathForResource(row.resource, code)} className="inline-flex rounded-full bg-danger-100 px-2.5 py-0.5 font-semibold text-danger-600 hover:underline">
                        {row.missing[code]}
                      </Link>
                    ) : (
                      <span className="inline-flex rounded-full bg-success-100 px-2.5 py-0.5 font-semibold text-success-700">✓</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TranslationsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "content" ? "content" : "interface";
  return (
    <div>
      <PageHeader title="Переводы" description="Тексты интерфейса и полнота переводов контента на русском, английском и кыргызском." />
      <div role="tablist" className="mb-6 inline-flex rounded-full border border-graphite-200 bg-white p-1">
        {(
          [
            ["interface", "Интерфейс сайта"],
            ["content", "Контент"],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setParams({ tab: key })} className={cn("rounded-full px-4 py-2 text-sm font-semibold", tab === key ? "bg-night-900 text-milk-50" : "text-graphite-600 hover:text-night-900")}>
            {label}
          </button>
        ))}
      </div>
      {tab === "interface" ? <InterfaceStrings /> : <ContentCoverage />}
    </div>
  );
}

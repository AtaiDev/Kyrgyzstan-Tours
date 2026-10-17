import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownUp, ExternalLink, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";

import type { QueryParams } from "@/api/client";
import { Button, buttonClasses } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Fields";
import { Spinner } from "@/components/ui/States";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/utils/cn";

import { adminApi } from "../api";
import { useAdminAuth } from "../auth";
import { useChoices } from "../fields/RelationInputs";
import { previewUrl } from "../resources/preview";
import { RESOURCE_MAP } from "../resources/registry";
import type { ColumnConfig, ListFilterConfig, ResourceConfig } from "../resources/types";
import type { AdminRecord } from "../types";
import { DataTable } from "../ui/DataTable";
import { useFeedback } from "../ui/feedback";
import { PageHeader, Toggle } from "../ui/Primitives";
import { AdminNotFound } from "./AdminNotFound";

function FilterSelect({ filter, value, onChange }: { filter: ListFilterConfig; value: string; onChange: (value: string) => void }) {
  const { data = [] } = useChoices(filter.endpoint ?? "");
  const options = filter.options ?? (filter.endpoint ? data.map((choice) => ({ value: String(choice.id), label: choice.label })) : []);
  return (
    <label className="block">
      <span className="sr-only">{filter.label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={cn(inputClasses(), "h-11 py-2")}>
        <option value="">{filter.label}: все</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ListView({ config }: { config: ResourceConfig }) {
  const { canModel } = useAdminAuth();
  const { notify, notifyError, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const debounced = useDebouncedValue(search, 350);
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedRows, setOrderedRows] = useState<AdminRecord[] | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const canAdd = canModel(config.model, "add") && config.allowCreate !== false;
  const canChange = canModel(config.model, "change");
  const canDelete = canModel(config.model, "delete") && config.allowDelete !== false;

  useEffect(() => {
    if ((params.get("search") ?? "") === debounced) return;
    const next = new URLSearchParams(params);
    if (debounced) next.set("search", debounced);
    else next.delete("search");
    next.delete("page");
    setParams(next, { replace: true });
  }, [debounced, params, setParams]);

  const queryParams = useMemo<QueryParams>(() => {
    const result: QueryParams = Object.fromEntries(params.entries());
    if (!result.ordering && config.defaultOrdering) result.ordering = config.defaultOrdering;
    if (reorderMode) {
      result.page_size = 200;
      result.ordering = "position";
      delete result.page;
    }
    return result;
  }, [params, config.defaultOrdering, reorderMode]);

  const queryKey = ["admin", "list", config.key, queryParams];
  const query = useQuery({ queryKey, queryFn: () => adminApi.list(config.endpoint, queryParams), placeholderData: keepPreviousData });
  const rows = orderedRows ?? query.data?.results ?? [];

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  };

  const toggle = async (row: AdminRecord, field: string, value: boolean) => {
    queryClient.setQueryData(queryKey, (old: typeof query.data) =>
      old ? { ...old, results: old.results.map((item) => (item.id === row.id ? { ...item, [field]: value } : item)) } : old,
    );
    try {
      await adminApi.update(config.endpoint, Number(row.id), { [field]: value });
      notify("success", "Сохранено");
    } catch (error) {
      notifyError(error);
    } finally {
      void queryClient.invalidateQueries({ queryKey: ["admin", "list", config.key] });
    }
  };

  const remove = async (row: AdminRecord) => {
    const ok = await confirm({ title: `Удалить ${config.singular}?`, message: `«${row.display_name ?? row.id}» будет удалена без возможности восстановления.`, confirmLabel: "Удалить", danger: true });
    if (!ok) return;
    try {
      await adminApi.remove(config.endpoint, Number(row.id));
      notify("success", "Запись удалена");
      void queryClient.invalidateQueries({ queryKey: ["admin", "list", config.key] });
    } catch (error) {
      notifyError(error);
    }
  };

  const saveOrder = async () => {
    if (!orderedRows) return;
    try {
      await adminApi.reorder(config.endpoint, orderedRows.map((row) => Number(row.id)));
      notify("success", "Порядок сохранён", "Новый порядок уже действует на сайте.");
      setOrderedRows(null);
      setReorderMode(false);
      void queryClient.invalidateQueries({ queryKey: ["admin", "list", config.key] });
    } catch (error) {
      notifyError(error);
    }
  };

  const runBulk = async (action: NonNullable<ResourceConfig["bulkActions"]>[number]) => {
    const ok = await confirm({ title: action.label, message: `Применить к выбранным записям (${selected.length})?`, danger: action.danger });
    if (!ok) return;
    try {
      await action.run(selected);
      notify("success", "Готово");
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ["admin", "list", config.key] });
    } catch (error) {
      notifyError(error);
    }
  };

  const renderCell = (column: ColumnConfig, row: AdminRecord) => {
    if (column.toggle) {
      return <Toggle checked={Boolean(row[column.toggle])} disabled={!canChange || reorderMode} label={`${column.label}: ${row.display_name ?? row.id}`} onChange={(value) => void toggle(row, column.toggle!, value)} />;
    }
    return column.render ? column.render(row) : String(row[column.key] ?? "");
  };

  const fixedQuery = (config.fixedParams ?? []).map((key) => (params.get(key) ? `${key}=${params.get(key)}` : "")).filter(Boolean).join("&");
  const editHref = (row: AdminRecord) => `/admin/r/${config.key}/${row.id}${fixedQuery ? `?${fixedQuery}` : ""}`;
  const activeFilters = [...params.keys()].filter((key) => !["page", "ordering", ...(config.fixedParams ?? [])].includes(key)).length;

  return (
    <div>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            {config.orderable && canChange ? (
              reorderMode ? (
                <>
                  <Button variant="outline" onClick={() => { setReorderMode(false); setOrderedRows(null); }}>
                    Отмена
                  </Button>
                  <Button disabled={!orderedRows} onClick={() => void saveOrder()}>
                    Сохранить порядок
                  </Button>
                </>
              ) : (
                <Button variant="outline" icon={<ArrowDownUp className="h-4 w-4" aria-hidden />} onClick={() => setReorderMode(true)}>
                  Изменить порядок
                </Button>
              )
            ) : null}
            {canAdd && !reorderMode ? (
              <Link to={`/admin/r/${config.key}/new${fixedQuery ? `?${fixedQuery}` : ""}`} className={buttonClasses("primary", "md")}>
                <Plus className="h-4 w-4" aria-hidden />
                Добавить
              </Link>
            ) : null}
          </>
        }
      />

      {reorderMode ? (
        <p className="mb-4 rounded-xl bg-glacier-200/50 px-4 py-3 text-sm text-glacier-800">Перетащите строки мышью или используйте стрелки, затем нажмите «Сохранить порядок».</p>
      ) : (
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-graphite-400" aria-hidden />
            <label className="sr-only" htmlFor={`search-${config.key}`}>
              Поиск
            </label>
            <input id={`search-${config.key}`} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={config.searchPlaceholder ?? "Поиск…"} className={cn(inputClasses(), "h-11 py-2 pl-10")} />
          </div>
          {(config.filters ?? []).map((filter) => (
            <FilterSelect key={filter.key} filter={filter} value={params.get(filter.key) ?? ""} onChange={(value) => setParam(filter.key, value)} />
          ))}
          {config.demoFilter ? (
            <select aria-label="Фильтр демонстрационных записей" value={params.get("is_demo") ?? ""} onChange={(event) => setParam("is_demo", event.target.value)} className={cn(inputClasses(), "h-11 py-2")}>
              <option value="">Примеры: все</option>
              <option value="true">Только примеры</option>
              <option value="false">Без примеров</option>
            </select>
          ) : null}
          {config.translated ? (
            <select aria-label="Фильтр переводов" value={params.get("missing_language") ?? ""} onChange={(event) => setParam("missing_language", event.target.value)} className={cn(inputClasses(), "h-11 py-2")}>
              <option value="">Переводы: все</option>
              <option value="ru">Нет перевода RU</option>
              <option value="en">Нет перевода EN</option>
              <option value="ky">Нет перевода KG</option>
            </select>
          ) : null}
        </div>
      )}

      {activeFilters && !reorderMode ? (
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams();
            for (const key of config.fixedParams ?? []) if (params.get(key)) next.set(key, params.get(key)!);
            setSearch("");
            setParams(next);
          }}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-night-900 hover:text-glacier-700"
        >
          <X className="h-4 w-4" aria-hidden />
          Сбросить фильтры
        </button>
      ) : null}

      {selected.length && config.bulkActions ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-night-900 px-4 py-3 text-sm text-milk-50">
          <span>Выбрано: {selected.length}</span>
          {config.bulkActions.map((action) => (
            <Button key={action.label} size="sm" variant={action.danger ? "danger" : "light"} onClick={() => void runBulk(action)}>
              {action.label}
            </Button>
          ))}
          <button type="button" onClick={() => setSelected([])} className="ml-auto underline">
            Снять выделение
          </button>
        </div>
      ) : null}

      {query.isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-graphite-200 bg-white">
          <Spinner label="Загрузка…" />
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-danger-600/30 bg-danger-100 p-6 text-danger-600">
          Не удалось загрузить данные. <button type="button" className="underline" onClick={() => void query.refetch()}>Повторить</button>
        </div>
      ) : (
        <div className={cn(query.isFetching && "opacity-70 transition-opacity")}>
          <DataTable
            columns={config.columns}
            rows={rows}
            ordering={String(queryParams.ordering ?? "")}
            onOrder={reorderMode ? undefined : (ordering) => setParam("ordering", ordering)}
            renderCell={renderCell}
            reorderable={reorderMode}
            onReorder={setOrderedRows}
            selectable={Boolean(config.bulkActions) && !reorderMode}
            selected={selected}
            onSelect={setSelected}
            onRowClick={reorderMode ? undefined : (row) => navigate(editHref(row))}
            empty={activeFilters ? "По заданным условиям ничего не найдено" : "Записей пока нет"}
            actions={
              reorderMode
                ? undefined
                : (row) => {
                    const preview = previewUrl(config, row);
                    return (
                      <div className="inline-flex items-center gap-1">
                        {preview ? (
                          <a href={preview} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-graphite-500 hover:bg-graphite-100 hover:text-night-900" title="Предпросмотр на сайте" aria-label="Предпросмотр на сайте">
                            <ExternalLink className="h-4 w-4" aria-hidden />
                          </a>
                        ) : null}
                        <Link to={editHref(row)} className="rounded-lg p-2 text-graphite-500 hover:bg-graphite-100 hover:text-night-900" title="Редактировать" aria-label="Редактировать">
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Link>
                        {canDelete ? (
                          <button type="button" onClick={() => void remove(row)} className="rounded-lg p-2 text-graphite-500 hover:bg-danger-100 hover:text-danger-600" title="Удалить" aria-label="Удалить">
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    );
                  }
            }
          />
          {!reorderMode && query.data && query.data.total_pages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-graphite-600">
              <span>
                Всего: {query.data.count} · страница {query.data.page} из {query.data.total_pages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={query.data.page <= 1} onClick={() => setParam("page", String(query.data!.page - 1))}>
                  Назад
                </Button>
                <Button size="sm" variant="outline" disabled={query.data.page >= query.data.total_pages} onClick={() => setParam("page", String(query.data!.page + 1))}>
                  Вперёд
                </Button>
              </div>
            </div>
          ) : query.data ? (
            <p className="mt-4 text-sm text-graphite-500">Всего: {query.data.count}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function ResourceListPage() {
  const { resource = "" } = useParams();
  const { canModel } = useAdminAuth();
  const config = RESOURCE_MAP[resource];
  if (!config) return <AdminNotFound />;
  if (!canModel(config.model, "view")) return <AdminNotFound forbidden />;
  return <ListView key={config.key} config={config} />;
}

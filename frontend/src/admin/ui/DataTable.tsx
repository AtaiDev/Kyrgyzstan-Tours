import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/utils/cn";

import type { ColumnConfig } from "../resources/types";
import type { AdminRecord } from "../types";

interface DataTableProps {
  columns: ColumnConfig[];
  rows: AdminRecord[];
  ordering?: string;
  onOrder?: (ordering: string) => void;
  onRowClick?: (row: AdminRecord) => void;
  actions?: (row: AdminRecord) => ReactNode;
  reorderable?: boolean;
  onReorder?: (rows: AdminRecord[]) => void;
  renderCell?: (column: ColumnConfig, row: AdminRecord) => ReactNode;
  selectable?: boolean;
  selected?: number[];
  onSelect?: (ids: number[]) => void;
  empty?: ReactNode;
}

export function DataTable({ columns, rows, ordering, onOrder, onRowClick, actions, reorderable, onReorder, renderCell, selectable, selected = [], onSelect, empty }: DataTableProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const sortIcon = (column: ColumnConfig) => {
    if (!column.ordering) return null;
    if (ordering === column.ordering) return <ArrowUp className="h-3.5 w-3.5" aria-hidden />;
    if (ordering === `-${column.ordering}`) return <ArrowDown className="h-3.5 w-3.5" aria-hidden />;
    return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />;
  };

  const toggleSort = (column: ColumnConfig) => {
    if (!column.ordering || !onOrder) return;
    onOrder(ordering === column.ordering ? `-${column.ordering}` : column.ordering);
  };

  const move = (from: number, to: number) => {
    if (!onReorder || from === to) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onReorder(next);
  };

  const allIds = rows.map((row) => Number(row.id));
  const allSelected = selectable && allIds.length > 0 && allIds.every((id) => selected.includes(id));

  return (
    <div className="overflow-x-auto rounded-2xl border border-graphite-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-graphite-200 bg-graphite-100/60 text-xs font-semibold tracking-wide text-graphite-600 uppercase">
          <tr>
            {reorderable ? <th className="w-10 px-3 py-3" aria-label="Порядок" /> : null}
            {selectable ? (
              <th className="w-10 px-3 py-3">
                <input type="checkbox" aria-label="Выбрать все" checked={Boolean(allSelected)} onChange={() => onSelect?.(allSelected ? [] : allIds)} className="h-4 w-4 accent-glacier-700" />
              </th>
            ) : null}
            {columns.map((column) => (
              <th key={column.key} className={cn("px-4 py-3", column.className)} aria-sort={ordering === column.ordering ? "ascending" : ordering === `-${column.ordering}` ? "descending" : undefined}>
                {column.ordering && onOrder ? (
                  <button type="button" onClick={() => toggleSort(column)} className="inline-flex items-center gap-1.5 uppercase hover:text-night-900">
                    {column.label}
                    {sortIcon(column)}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
            {actions ? <th className="px-4 py-3 text-right">Действия</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-graphite-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 3} className="px-4 py-14 text-center text-graphite-500">
                {empty ?? "Записей пока нет"}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={String(row.id)}
                draggable={reorderable}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => {
                  if (reorderable) event.preventDefault();
                }}
                onDrop={() => {
                  if (dragIndex !== null) move(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={cn("transition hover:bg-milk-100/70", onRowClick && "cursor-pointer", dragIndex === index && "opacity-40")}
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest("button, a, input, select, label")) return;
                  onRowClick?.(row);
                }}
              >
                {reorderable ? (
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-center text-graphite-400">
                      <GripVertical className="h-4 w-4 cursor-grab" aria-hidden />
                      <span className="sr-only">Перетащите строку, чтобы изменить порядок</span>
                      <div className="mt-1 flex">
                        <button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="Выше" className="rounded p-0.5 hover:bg-graphite-100 disabled:opacity-30">
                          <ArrowUp className="h-3 w-3" aria-hidden />
                        </button>
                        <button type="button" disabled={index === rows.length - 1} onClick={() => move(index, index + 1)} aria-label="Ниже" className="rounded p-0.5 hover:bg-graphite-100 disabled:opacity-30">
                          <ArrowDown className="h-3 w-3" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </td>
                ) : null}
                {selectable ? (
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label="Выбрать строку"
                      checked={selected.includes(Number(row.id))}
                      onChange={() => onSelect?.(selected.includes(Number(row.id)) ? selected.filter((id) => id !== Number(row.id)) : [...selected, Number(row.id)])}
                      className="h-4 w-4 accent-glacier-700"
                    />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3 align-middle", column.className)}>
                    {renderCell ? renderCell(column, row) : String(row[column.key] ?? "")}
                  </td>
                ))}
                {actions ? <td className="px-4 py-3 text-right whitespace-nowrap">{actions(row)}</td> : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

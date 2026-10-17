import type { QueryParams } from "@/api/client";

export function paramsFromSearch(search: URLSearchParams, keys: readonly string[]): QueryParams {
  const result: QueryParams = {};
  for (const key of keys) {
    const value = search.get(key);
    if (value) result[key] = value;
  }
  return result;
}

export function updateSearch(search: URLSearchParams, changes: Record<string, string | null | undefined>): URLSearchParams {
  const next = new URLSearchParams(search);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === "") next.delete(key);
    else next.set(key, value);
  }
  if (!("page" in changes)) next.delete("page");
  return next;
}

export function toNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

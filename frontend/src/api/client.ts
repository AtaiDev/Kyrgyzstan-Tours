export type QueryValue = string | number | boolean | null | undefined | Array<string | number>;
export type QueryParams = Record<string, QueryValue>;

export type FieldErrors = Record<string, string[]>;

type JsonValue = unknown;

export class ApiError extends Error {
  readonly status: number;
  readonly data: JsonValue;
  readonly fieldErrors: FieldErrors;
  readonly code: string | null;

  constructor(status: number, data: JsonValue) {
    super(ApiError.extractMessage(status, data));
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.fieldErrors = flattenErrors(data);
    this.code = isRecord(data) && typeof data.code === "string" ? data.code : null;
  }

  static extractMessage(status: number, data: JsonValue): string {
    if (isRecord(data)) {
      if (typeof data.detail === "string") return data.detail;
      const nonField = data.non_field_errors;
      if (Array.isArray(nonField) && typeof nonField[0] === "string") return nonField[0];
    }
    if (status === 0) return "Network error";
    return `Request failed with status ${status}`;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function flattenErrors(data: unknown, prefix = ""): FieldErrors {
  const result: FieldErrors = {};
  if (Array.isArray(data)) {
    if (data.every((item) => typeof item === "string")) {
      if (prefix) result[prefix] = data as string[];
      return result;
    }
    data.forEach((item, index) => Object.assign(result, flattenErrors(item, prefix ? `${prefix}.${index}` : String(index))));
    return result;
  }
  if (isRecord(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (!prefix && (key === "detail" || key === "code")) continue;
      Object.assign(result, flattenErrors(value, prefix ? `${prefix}.${key}` : key));
    }
    return result;
  }
  if (typeof data === "string" && prefix) result[prefix] = [data];
  return result;
}

export function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`/api${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return url.pathname + url.search;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  if (method !== "GET") {
    const token = readCookie("csrftoken");
    if (token) headers["X-CSRFToken"] = token;
  }
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method,
      headers,
      body,
      credentials: "same-origin",
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, null);
  }
  if (response.status === 204) return undefined as T;
  const isJson = response.headers.get("Content-Type")?.includes("application/json");
  const data: unknown = isJson ? await response.json() : null;
  if (!response.ok) throw new ApiError(response.status, data);
  return data as T;
}

export const api = {
  get: <T>(path: string, params?: QueryParams, signal?: AbortSignal) => apiRequest<T>(path, { params, signal }),
  post: <T>(path: string, body?: unknown, params?: QueryParams) => apiRequest<T>(path, { method: "POST", body, params }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  delete: <T = void>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

import type { QueryParams } from "@/api/client";
import { api, apiRequest } from "@/api/client";

import type {
  AdminPage,
  AdminRecord,
  AdminUser,
  Choice,
  CoverageRow,
  DashboardData,
  InterfaceStringRow,
  MediaAsset,
  Role,
  RoleCatalogEntry,
} from "./types";

const base = "/admin";

export const adminApi = {
  csrf: () => api.get<{ status: string }>(`${base}/auth/csrf/`),
  me: () => api.get<{ user: AdminUser | null }>(`${base}/auth/me/`),
  login: (username: string, password: string) => api.post<{ user: AdminUser }>(`${base}/auth/login/`, { username, password }),
  logout: () => api.post<{ status: string }>(`${base}/auth/logout/`),
  changePassword: (current_password: string, new_password: string) =>
    api.post<{ status: string }>(`${base}/auth/password/`, { current_password, new_password }),

  dashboard: () => api.get<DashboardData>(`${base}/dashboard/`),
  coverage: () => api.get<{ resources: CoverageRow[]; summary: Record<string, number> }>(`${base}/translations/coverage/`),

  list: (endpoint: string, params: QueryParams) => api.get<AdminPage<AdminRecord>>(endpoint, params),
  listAll: (endpoint: string, params: QueryParams = {}) => api.get<AdminRecord[]>(endpoint, params),
  get: (endpoint: string, id: number | string) => api.get<AdminRecord>(`${endpoint}${id}/`),
  create: (endpoint: string, payload: unknown) => api.post<AdminRecord>(endpoint, payload),
  update: (endpoint: string, id: number | string, payload: unknown) => api.patch<AdminRecord>(`${endpoint}${id}/`, payload),
  remove: (endpoint: string, id: number | string) => api.delete(`${endpoint}${id}/`),
  reorder: (endpoint: string, ids: number[]) => api.post<{ updated: number }>(`${endpoint}reorder/`, { ids }),
  choices: (endpoint: string, params: QueryParams = {}) => api.get<Choice[]>(`${endpoint}choices/`, params),

  singleton: (endpoint: string) => api.get<AdminRecord>(endpoint),
  saveSingleton: (endpoint: string, payload: unknown) => api.patch<AdminRecord>(endpoint, payload),

  media: (params: QueryParams) => api.get<AdminPage<MediaAsset>>(`${base}/media/`, params),
  mediaFolders: () => api.get<string[]>(`${base}/media/folders/`),
  uploadMedia: (file: File, folder = "") => {
    const form = new FormData();
    form.append("file", file);
    if (folder) form.append("folder", folder);
    return apiRequest<MediaAsset>(`${base}/media/`, { method: "POST", body: form });
  },
  replaceMedia: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiRequest<MediaAsset>(`${base}/media/${id}/`, { method: "PATCH", body: form });
  },
  updateMedia: (id: number, payload: Partial<MediaAsset>) => api.patch<MediaAsset>(`${base}/media/${id}/`, payload),
  deleteMedia: (id: number) => api.delete(`${base}/media/${id}/`),

  interfaceStrings: () => api.get<InterfaceStringRow[]>(`${base}/interface-strings/`),
  saveInterfaceStrings: (items: Array<Record<string, string>>) =>
    api.post<{ saved: number; removed: number }>(`${base}/interface-strings/bulk_upsert/`, { items }),

  setReviewStatus: (ids: number[], status: string) => api.post<{ updated: number }>(`${base}/reviews/set_status/`, { ids, status }),
  roleCatalog: () => api.get<RoleCatalogEntry[]>(`${base}/roles/catalog/`),
  roles: () => api.get<Role[]>(`${base}/roles/`),
};

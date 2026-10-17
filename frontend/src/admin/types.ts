import type { Language } from "@/i18n/languages";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_superuser: boolean;
  groups: string[];
  permissions: string[];
}

export interface MediaBrief {
  id: number;
  kind: "image" | "video";
  url: string;
  medium_url: string;
  thumbnail_url: string;
  width: number | null;
  height: number | null;
  original_name: string;
  alt: string;
}

export interface MediaAsset extends Omit<MediaBrief, "alt"> {
  file_size: number;
  folder: string;
  author: string;
  license: string;
  license_url: string;
  source_url: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  translations: Translations;
  display_name: string;
  missing_translations: Language[];
}

export type TranslationValues = Record<string, string>;
export type Translations = Partial<Record<Language, TranslationValues>>;

export type RecordValue = unknown;
export type AdminRecord = Record<string, RecordValue> & {
  id?: number;
  display_name?: string;
  missing_translations?: Language[];
  translations?: Translations;
};

export interface Choice {
  id: number;
  label: string;
  slug?: string;
}

export interface AdminPage<T> {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: T[];
}

export interface DashboardData {
  counts: Record<string, { total: number; published: number; pending?: number }>;
  inquiries: {
    new: number;
    in_progress: number;
    total: number;
    chart: Array<{ date: string; count: number }>;
    recent: Array<{ id: number; full_name: string; email: string; status: string; tour_title: string | null; travelers: number; travel_date: string | null; created_at: string }>;
  } | null;
  messages: { new: number; total: number; recent: Array<{ id: number; full_name: string; subject: string; status: string; created_at: string }> } | null;
  subscribers: number | null;
  demo_items: number;
  translations: Record<Language, number>;
}

export interface CoverageRow {
  resource: string;
  label: string;
  total: number;
  missing: Record<Language, number>;
}

export interface InterfaceStringRow {
  id: number;
  key: string;
  value_ru: string;
  value_en: string;
  value_ky: string;
  updated_at: string;
}

export interface RoleCatalogEntry {
  label: string;
  model: string;
  permissions: Record<"view" | "add" | "change" | "delete", string>;
}

export interface Role {
  id: number;
  name: string;
  permissions: string[];
  users_count: number;
}

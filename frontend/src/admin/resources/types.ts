import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { AdminRecord } from "../types";

/** Decides from the record being edited whether a form part applies to it. */
export type FormCondition = (values: Record<string, unknown>) => boolean;

interface BaseField {
  name: string;
  label: string;
  help?: string;
  required?: boolean;
  translated?: boolean;
  span?: 1 | 2;
  /** Hide the field when it has no effect for the record being edited (inline sub-fields get that record too). */
  when?: FormCondition;
}

export type TextFieldConfig = BaseField & { type: "text" | "email" | "url" | "slug" | "color" | "date" | "datetime" | "password"; maxLength?: number; placeholder?: string };

export type FieldConfig =
  | TextFieldConfig
  | (BaseField & { type: "textarea" | "markdown" | "lines"; rows?: number; maxLength?: number; placeholder?: string })
  | (BaseField & { type: "number" | "decimal" | "range"; min?: number; max?: number; step?: number })
  | (BaseField & { type: "boolean" })
  | (BaseField & { type: "select"; options: Array<{ value: string; label: string }>; allowEmpty?: boolean })
  | (BaseField & { type: "relation" | "relations"; endpoint: string })
  | (BaseField & {
      type: "image" | "video";
      folder?: string;
      /** Videos: how the site uses the file, so the admin can warn about unsuitable uploads. */
      videoRole?: "main" | "light";
      /** Light video: the main video field it must be a smaller copy of. */
      pairWith?: string;
      /** Main video: image field that serves as its poster (filled from the first frame). */
      posterField?: string;
    })
  | (BaseField & { type: "gallery"; folder?: string })
  | (BaseField & { type: "inline"; itemLabel: string; fields: FieldConfig[]; maxItems?: number; itemDefaults?: Record<string, unknown> });

export interface FormSection {
  title: string;
  description?: string | ((values: Record<string, unknown>) => string | undefined);
  fields: FieldConfig[];
  when?: FormCondition;
}

export interface ColumnConfig {
  key: string;
  label: string;
  ordering?: string;
  render?: (item: AdminRecord) => ReactNode;
  toggle?: string;
  className?: string;
}

export interface ListFilterConfig {
  key: string;
  label: string;
  options?: Array<{ value: string; label: string }>;
  endpoint?: string;
}

export interface ResourceConfig {
  key: string;
  endpoint: string;
  model: string;
  title: string;
  singular: string;
  icon?: LucideIcon;
  description?: string;
  columns: ColumnConfig[];
  filters?: ListFilterConfig[];
  demoFilter?: boolean;
  searchPlaceholder?: string;
  orderable?: boolean;
  defaultOrdering?: string;
  sections: FormSection[];
  translated?: boolean;
  publicPath?: (item: AdminRecord) => string | null;
  createDefaults?: Record<string, unknown>;
  allowCreate?: boolean;
  allowDelete?: boolean;
  bulkActions?: Array<{ label: string; run: (ids: number[]) => Promise<unknown>; danger?: boolean }>;
  fixedParams?: string[];
}

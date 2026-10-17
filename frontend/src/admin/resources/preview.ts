import type { AdminRecord } from "../types";
import type { ResourceConfig } from "./types";

export function previewUrl(config: ResourceConfig, item: AdminRecord): string | null {
  const path = config.publicPath?.(item);
  return path ? `/ru${path === "/" ? "" : path}?preview=1` : null;
}

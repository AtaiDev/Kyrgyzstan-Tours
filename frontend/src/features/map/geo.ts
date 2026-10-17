import mapData from "./kyrgyzstan-map.json";

export interface RegionShape {
  code: string;
  iso: string;
  path: string;
  bbox: [number, number, number, number];
  label: [number, number];
}

export interface MapGeometry {
  width: number;
  height: number;
  projection: { minLon: number; maxLat: number; kx: number; scale: number; padding: number };
  regions: RegionShape[];
  lakes: Array<{ name: string; path: string }>;
}

export const geometry = mapData as MapGeometry;

export const FULL_VIEW = `0 0 ${geometry.width} ${geometry.height}`;

export const CITIES = [
  { key: "bishkek", latitude: 42.8746, longitude: 74.6122 },
  { key: "osh", latitude: 40.5283, longitude: 72.7985 },
] as const;

export function project(latitude: number, longitude: number): [number, number] {
  const { minLon, maxLat, kx, scale, padding } = geometry.projection;
  return [(longitude - minLon) * kx * scale + padding, (maxLat - latitude) * scale + padding];
}

export function isNear(a: [number, number], b: [number, number], distance: number): boolean {
  return Math.hypot(a[0] - b[0], a[1] - b[1]) < distance;
}

export function projectPoint(point: { latitude: string | number | null; longitude: string | number | null }): [number, number] | null {
  if (point.latitude === null || point.longitude === null) return null;
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return project(latitude, longitude);
}

export function viewBoxFor(box: [number, number, number, number], padding = 0.18, minWidth = 0, aspect = geometry.width / geometry.height): string {
  let [x, y, width, height] = box;
  const padX = Math.max(width * padding, 24);
  const padY = Math.max(height * padding, 24);
  x -= padX;
  y -= padY;
  width += padX * 2;
  height += padY * 2;
  if (width < minWidth) {
    x -= (minWidth - width) / 2;
    width = minWidth;
  }
  if (width / height > aspect) {
    const target = width / aspect;
    y -= (target - height) / 2;
    height = target;
  } else {
    const target = height * aspect;
    x -= (target - width) / 2;
    width = target;
  }
  return [x, y, width, height].map((value) => value.toFixed(1)).join(" ");
}

export function boundsOf(points: Array<[number, number]>): [number, number, number, number] {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return [minX, minY, Math.max(Math.max(...xs) - minX, 1), Math.max(Math.max(...ys) - minY, 1)];
}

export function smoothPath(points: Array<[number, number]>): string {
  if (points.length === 0) return "";
  if (points.length < 3) return `M${points.map(([x, y]) => `${x} ${y}`).join(" L")}`;
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const [x0, y0] = points[Math.max(index - 1, 0)];
    const [x1, y1] = points[index];
    const [x2, y2] = points[index + 1];
    const [x3, y3] = points[Math.min(index + 2, points.length - 1)];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d;
}

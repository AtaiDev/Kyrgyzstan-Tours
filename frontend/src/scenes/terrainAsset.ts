import * as THREE from "three";

import type { CameraMotion, JourneyScene } from "@/types/api";

import type { FieldData, LayerData, TerrainData, TerrainRequest, TextureStrips } from "./terrainMath";
import { buildTerrainData, sampleField } from "./terrainMath";

export const WORLD_SIZE = 100;
const FAR_DROP = 0.15;

export type SceneQuality = "low" | "medium" | "high";

export const SEGMENTS: Record<SceneQuality, { near: number; far: number }> = {
  low: { near: 192, far: 128 },
  medium: { near: 320, far: 192 },
  high: { near: 511, far: 255 },
};

export interface TerrainLayer {
  field: FieldData;
  water: THREE.DataTexture;
  texture: THREE.Texture;
  geometry: THREE.BufferGeometry;
  size: number;
}

export interface TerrainAsset {
  slug: string;
  near: TerrainLayer;
  far: TerrainLayer | null;
  verticalScale: number;
  base: number;
  relief: number;
  meanHeight: number;
  heading: number;
  motion: CameraMotion;
}

let worker: Worker | null | undefined;
let requestId = 0;
const requests = new Map<number, { resolve: (data: unknown) => void; reject: (error: Error) => void }>();
let uploads: Promise<unknown> = Promise.resolve();

function terrainWorker() {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL("./terrainWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; data?: unknown; error?: string }>) => {
      const entry = requests.get(event.data.id);
      if (!entry) return;
      requests.delete(event.data.id);
      if (event.data.data) entry.resolve(event.data.data);
      else entry.reject(new Error(event.data.error ?? "Terrain worker failed"));
    };
    worker.onerror = () => {
      requests.forEach((entry) => entry.reject(new Error("Terrain worker crashed")));
      requests.clear();
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

function callWorker<T>(message: Record<string, unknown>) {
  const instance = terrainWorker();
  if (!instance) return Promise.reject(new Error("Workers are not available"));
  return new Promise<T>((resolve, reject) => {
    requestId += 1;
    requests.set(requestId, { resolve: (data) => resolve(data as T), reject });
    instance.postMessage({ ...message, id: requestId });
  });
}

function buildOnMainThread(request: TerrainRequest) {
  return buildTerrainData(request, (width, height) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  });
}

async function buildTerrain(request: TerrainRequest): Promise<TerrainData> {
  try {
    return await callWorker<TerrainData>({ kind: "terrain", request });
  } catch {
    return buildOnMainThread(request);
  }
}

export function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function configureTexture(texture: THREE.Texture, renderer: THREE.WebGLRenderer) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  texture.generateMipmaps = true;
  return texture;
}

async function uploadWhole(url: string, renderer: THREE.WebGLRenderer) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${url}`);
  const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: "none", premultiplyAlpha: "none", imageOrientation: "flipY" });
  const texture = configureTexture(new THREE.Texture(bitmap), renderer);
  texture.needsUpdate = true;
  await nextFrame();
  renderer.initTexture(texture);
  bitmap.close();
  return texture;
}

async function uploadStrips(url: string, renderer: THREE.WebGLRenderer, bands: number) {
  const { width, height, sizes, strips } = await callWorker<TextureStrips>({ kind: "texture", url, bands });
  const texture = configureTexture(new THREE.Texture({ width, height }), renderer);
  texture.mipmaps = sizes.map((size) => ({ ...size, data: new Uint8Array(0) }));
  texture.generateMipmaps = false;
  texture.source.dataReady = false;
  texture.needsUpdate = true;
  await nextFrame();
  renderer.initTexture(texture);
  const gl = renderer.getContext() as WebGL2RenderingContext;
  const handle = (renderer.properties.get(texture) as { __webglTexture?: WebGLTexture }).__webglTexture;
  if (!handle) {
    strips.forEach((strip) => strip.bitmap.close());
    throw new Error("Texture storage was not created");
  }
  let budget = 0;
  for (const { bitmap, top, level } of strips) {
    if (budget <= 0) {
      await nextFrame();
      budget = width * Math.ceil(height / bands);
    }
    renderer.state.bindTexture(gl.TEXTURE_2D, handle);
    gl.texSubImage2D(gl.TEXTURE_2D, level, 0, top, bitmap.width, bitmap.height, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    budget -= bitmap.width * bitmap.height;
    bitmap.close();
  }
  renderer.state.unbindTexture();
  return texture;
}

async function uploadTexture(url: string, renderer: THREE.WebGLRenderer, bands: number) {
  try {
    return await uploadStrips(url, renderer, bands);
  } catch {
    return uploadWhole(url, renderer);
  }
}

function queueUpload(url: string, renderer: THREE.WebGLRenderer, bands: number) {
  const task = uploads.then(() => uploadTexture(url, renderer, bands));
  uploads = task.catch(() => undefined);
  return task;
}

function pickUrl(media: { url: string; large_url: string; medium_url: string }, quality: SceneQuality) {
  if (quality === "high") return media.url;
  if (quality === "medium") return media.large_url || media.url;
  return media.medium_url || media.url;
}

function waterTexture(field: FieldData) {
  const texture = new THREE.DataTexture(field.water, field.size, field.size, THREE.RedFormat, THREE.UnsignedByteType);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

const gridCache = new Map<number, { index: Uint32Array; uv: Float32Array }>();

function gridBuffers(segments: number) {
  const cached = gridCache.get(segments);
  if (cached) return cached;
  const columns = segments + 1;
  const uv = new Float32Array(columns * columns * 2);
  for (let row = 0; row < columns; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const offset = (row * columns + column) * 2;
      uv[offset] = column / segments;
      uv[offset + 1] = 1 - row / segments;
    }
  }
  const index = new Uint32Array(segments * segments * 6);
  let cursor = 0;
  for (let row = 0; row < segments; row += 1) {
    for (let column = 0; column < segments; column += 1) {
      const a = row * columns + column;
      const b = a + columns;
      index[cursor] = a;
      index[cursor + 1] = b;
      index[cursor + 2] = a + 1;
      index[cursor + 3] = b;
      index[cursor + 4] = b + 1;
      index[cursor + 5] = a + 1;
      cursor += 6;
    }
  }
  const buffers = { index, uv };
  gridCache.set(segments, buffers);
  return buffers;
}

function surfaceGeometry(layer: LayerData, size: number, segments: number, relief: number) {
  const buffers = gridBuffers(segments);
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(buffers.index, 1));
  geometry.setAttribute("position", new THREE.BufferAttribute(layer.position, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(layer.normal, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(buffers.uv, 2));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, relief / 2, 0), Math.hypot(size / Math.SQRT2, relief * 2));
  return geometry;
}

export async function loadTerrain(scene: JourneyScene, quality: SceneQuality, renderer: THREE.WebGLRenderer): Promise<TerrainAsset> {
  const terrain = scene.terrain;
  if (!terrain) throw new Error("Scene has no terrain");
  const far = terrain.far;
  const farSize = far ? (WORLD_SIZE * far.size_km) / terrain.size_km : 0;
  const verticalScale = (terrain.exaggeration * WORLD_SIZE) / (terrain.size_km * 1000);
  const segments = SEGMENTS[quality];
  const data = await buildTerrain({
    near: { url: terrain.heightmap, size: WORLD_SIZE, segments: segments.near, drop: 0 },
    far: far ? { url: far.heightmap, size: farSize, segments: segments.far, drop: FAR_DROP } : null,
    verticalScale,
  });
  const relief = (data.near.field.max - data.near.field.min) * verticalScale;
  const nearTexture = await queueUpload(pickUrl(terrain.texture, quality), renderer, quality === "high" ? 32 : 16);
  let farTexture: THREE.Texture | null = null;
  try {
    farTexture = far && data.far ? await queueUpload(pickUrl(far.texture, quality === "high" ? "high" : "low"), renderer, 8) : null;
  } catch (error) {
    nearTexture.dispose();
    throw error;
  }
  const near: TerrainLayer = {
    field: data.near.field,
    water: waterTexture(data.near.field),
    texture: nearTexture,
    geometry: surfaceGeometry(data.near, WORLD_SIZE, segments.near, relief),
    size: WORLD_SIZE,
  };
  const farLayer: TerrainLayer | null =
    data.far && farTexture
      ? { field: data.far.field, water: waterTexture(data.far.field), texture: farTexture, geometry: surfaceGeometry(data.far, farSize, segments.far, relief), size: farSize }
      : null;
  return {
    slug: scene.slug,
    near,
    far: farLayer,
    verticalScale,
    base: data.near.field.min,
    relief,
    meanHeight: (data.near.field.mean - data.near.field.min) * verticalScale,
    heading: terrain.heading,
    motion: terrain.motion,
  };
}

export function disposeTerrain(asset: TerrainAsset) {
  for (const layer of [asset.near, asset.far]) {
    if (!layer) continue;
    layer.texture.dispose();
    layer.water.dispose();
    layer.geometry.dispose();
  }
}

export function groundHeight(asset: TerrainAsset, x: number, z: number) {
  const inside = Math.abs(x) < WORLD_SIZE / 2 && Math.abs(z) < WORLD_SIZE / 2;
  const layer = inside || !asset.far ? asset.near : asset.far;
  const height = sampleField(layer.field, x / layer.size + 0.5, z / layer.size + 0.5);
  return (height - asset.base) * asset.verticalScale;
}

export function srgbVector(color: THREE.Color) {
  const target = new THREE.Color();
  color.getRGB(target, THREE.SRGBColorSpace);
  return new THREE.Vector3(target.r, target.g, target.b);
}

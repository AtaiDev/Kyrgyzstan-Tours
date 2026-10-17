import type { TerrainData, TerrainRequest, TextureStrip } from "./terrainMath";
import { buildTerrainData } from "./terrainMath";

type WorkerMessage = { id: number; kind: "terrain"; request: TerrainRequest } | { id: number; kind: "texture"; url: string; bands: number };

function terrainTransfers(data: TerrainData) {
  const layers = [data.near, data.far].filter((layer) => layer !== null);
  return layers.flatMap((layer) => [layer.field.values.buffer, layer.field.water.buffer, layer.position.buffer, layer.normal.buffer]);
}

async function cropStrips(source: ImageBitmap, level: number, bands: number) {
  const strips: TextureStrip[] = [];
  for (let band = 0; band < bands; band += 1) {
    const top = Math.round((source.height * band) / bands);
    const bottom = Math.round((source.height * (band + 1)) / bands);
    strips.push({ level, top, bitmap: await createImageBitmap(source, 0, top, source.width, bottom - top) });
  }
  return strips;
}

async function halve(source: ImageBitmap) {
  const width = Math.max(1, source.width >> 1);
  const height = Math.max(1, source.height >> 1);
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not available");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);
  return createImageBitmap(canvas);
}

async function textureLevels(url: string, bands: number) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${url}`);
  const base = await createImageBitmap(await response.blob(), { colorSpaceConversion: "none", premultiplyAlpha: "none", imageOrientation: "flipY" });
  const sizes = [{ width: base.width, height: base.height }];
  const strips = await cropStrips(base, 0, bands);
  let current = base;
  let level = 0;
  while (current.width > 1 || current.height > 1) {
    const next = await halve(current);
    current.close();
    current = next;
    level += 1;
    sizes.push({ width: current.width, height: current.height });
    const levelBands = Math.max(1, Math.round((bands * current.width * current.height) / (sizes[0].width * sizes[0].height)));
    if (levelBands > 1) strips.push(...(await cropStrips(current, level, levelBands)));
    else strips.push({ level, top: 0, bitmap: await createImageBitmap(current) });
  }
  current.close();
  return { width: sizes[0].width, height: sizes[0].height, sizes, strips };
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  try {
    if (typeof OffscreenCanvas === "undefined") throw new Error("OffscreenCanvas is not available");
    if (message.kind === "terrain") {
      const data = await buildTerrainData(message.request, (width, height) => new OffscreenCanvas(width, height));
      self.postMessage({ id: message.id, data }, { transfer: terrainTransfers(data) });
      return;
    }
    const texture = await textureLevels(message.url, message.bands);
    self.postMessage({ id: message.id, data: texture }, { transfer: texture.strips.map((strip) => strip.bitmap) });
  } catch (error) {
    self.postMessage({ id: message.id, error: error instanceof Error ? error.message : String(error) });
  }
};

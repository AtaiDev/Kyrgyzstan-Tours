const HEIGHT_OFFSET = 1000;
const HEIGHT_SCALE = 4;

export interface FieldData {
  size: number;
  values: Float32Array;
  water: Uint8Array;
  min: number;
  max: number;
  mean: number;
}

export interface LayerData {
  field: FieldData;
  position: Float32Array;
  normal: Float32Array;
}

export interface LayerRequest {
  url: string;
  size: number;
  segments: number;
  drop: number;
}

export interface TerrainRequest {
  near: LayerRequest;
  far: LayerRequest | null;
  verticalScale: number;
}

export interface TextureStrip {
  level: number;
  top: number;
  bitmap: ImageBitmap;
}

export interface TextureStrips {
  width: number;
  height: number;
  sizes: { width: number; height: number }[];
  strips: TextureStrip[];
}

export interface TerrainData {
  near: LayerData;
  far: LayerData | null;
}

export function decodeHeights(pixels: Uint8ClampedArray, width: number, height: number): FieldData {
  const values = new Float32Array(width * height);
  const water = new Uint8Array(width * height);
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (let index = 0, offset = 0; index < values.length; index += 1, offset += 4) {
    const value = (pixels[offset] * 256 + pixels[offset + 1]) / HEIGHT_SCALE - HEIGHT_OFFSET;
    values[index] = value;
    sum += value;
    if (value < min) min = value;
    if (value > max) max = value;
    const row = Math.floor(index / width);
    water[(height - 1 - row) * width + (index % width)] = pixels[offset + 2];
  }
  return { size: width, values, water, min, max, mean: sum / values.length };
}

export function sampleField(field: { size: number; values: Float32Array }, u: number, v: number) {
  const last = field.size - 1;
  const x = Math.min(Math.max(u, 0), 1) * last;
  const y = Math.min(Math.max(v, 0), 1) * last;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, last);
  const y1 = Math.min(y0 + 1, last);
  const fx = x - x0;
  const fy = y - y0;
  const row0 = y0 * field.size;
  const row1 = y1 * field.size;
  const top = field.values[row0 + x0] * (1 - fx) + field.values[row0 + x1] * fx;
  const bottom = field.values[row1 + x0] * (1 - fx) + field.values[row1 + x1] * fx;
  return top * (1 - fy) + bottom * fy;
}

export function buildSurface(field: FieldData, size: number, segments: number, verticalScale: number, base: number, drop: number) {
  const columns = segments + 1;
  const step = size / segments;
  const heights = new Float32Array(columns * columns);
  for (let row = 0; row < columns; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      heights[row * columns + column] = (sampleField(field, column / segments, row / segments) - base) * verticalScale - drop;
    }
  }
  const position = new Float32Array(columns * columns * 3);
  const normal = new Float32Array(columns * columns * 3);
  for (let row = 0; row < columns; row += 1) {
    const up = Math.max(row - 1, 0);
    const down = Math.min(row + 1, segments);
    for (let column = 0; column < columns; column += 1) {
      const vertex = row * columns + column;
      const left = Math.max(column - 1, 0);
      const right = Math.min(column + 1, segments);
      const dx = (heights[row * columns + right] - heights[row * columns + left]) / ((right - left) * step);
      const dz = (heights[down * columns + column] - heights[up * columns + column]) / ((down - up) * step);
      const length = Math.hypot(dx, 1, dz);
      position[vertex * 3] = column * step - size / 2;
      position[vertex * 3 + 1] = heights[vertex];
      position[vertex * 3 + 2] = row * step - size / 2;
      normal[vertex * 3] = -dx / length;
      normal[vertex * 3 + 1] = 1 / length;
      normal[vertex * 3 + 2] = -dz / length;
    }
  }
  return { position, normal };
}

export async function readPixels(url: string, createCanvas: (width: number, height: number) => OffscreenCanvas | HTMLCanvasElement) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${url}`);
  const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  const canvas = createCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext("2d", { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  if (!context) throw new Error("Canvas 2D is not available");
  context.drawImage(bitmap, 0, 0);
  const { width, height } = bitmap;
  bitmap.close();
  return { pixels: context.getImageData(0, 0, width, height).data, width, height };
}

export async function buildTerrainData(request: TerrainRequest, createCanvas: (width: number, height: number) => OffscreenCanvas | HTMLCanvasElement): Promise<TerrainData> {
  const [nearPixels, farPixels] = await Promise.all([
    readPixels(request.near.url, createCanvas),
    request.far ? readPixels(request.far.url, createCanvas) : Promise.resolve(null),
  ]);
  const nearField = decodeHeights(nearPixels.pixels, nearPixels.width, nearPixels.height);
  const base = nearField.min;
  const near = { field: nearField, ...buildSurface(nearField, request.near.size, request.near.segments, request.verticalScale, base, request.near.drop) };
  if (!request.far || !farPixels) return { near, far: null };
  const farField = decodeHeights(farPixels.pixels, farPixels.width, farPixels.height);
  const far = { field: farField, ...buildSurface(farField, request.far.size, request.far.segments, request.verticalScale, base, request.far.drop) };
  return { near, far };
}

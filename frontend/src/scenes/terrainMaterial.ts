import * as THREE from "three";

import { WORLD_SIZE } from "./terrainAsset";

export interface AtmosphereUniforms {
  hazeColor: { value: THREE.Vector3 };
  zenithColor: { value: THREE.Vector3 };
  sunDirection: { value: THREE.Vector3 };
  hazeDistance: { value: number };
  hazeStrength: { value: number };
  hazeHeight: { value: number };
  veil: { value: number };
}

export function createAtmosphereUniforms(sunDirection: THREE.Vector3): AtmosphereUniforms {
  return {
    hazeColor: { value: new THREE.Vector3(0.8, 0.85, 0.9) },
    zenithColor: { value: new THREE.Vector3(0.36, 0.56, 0.78) },
    sunDirection: { value: sunDirection.clone().normalize() },
    hazeDistance: { value: 300 },
    hazeStrength: { value: 0.55 },
    hazeHeight: { value: 20 },
    veil: { value: 0 },
  };
}

interface LayerOptions {
  map: THREE.Texture;
  water: THREE.Texture;
  farMap?: THREE.Texture;
  farScale?: number;
  holeHalfSize?: number;
  edgeHaze: boolean;
}

const vertexHead = ["#include <common>", "varying vec3 vWorldPos;"].join("\n");
const vertexBody = ["#include <project_vertex>", "vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;"].join("\n");

const fragmentHead = `#include <common>
varying vec3 vWorldPos;
uniform vec3 hazeColor;
uniform vec3 zenithColor;
uniform vec3 sunDirection;
uniform float hazeDistance;
uniform float hazeStrength;
uniform float hazeHeight;
uniform float veil;
uniform sampler2D waterMap;
uniform sampler2D farMap;
uniform float farScale;
uniform float farBlend;
uniform float holeHalfSize;
uniform float edgeHaze;
uniform float sharpness;
float layerEdge(vec2 uv) {
  return min(min(uv.x, uv.y), min(1.0 - uv.x, 1.0 - uv.y));
}
vec3 sampleCatmullRom(sampler2D source, vec2 uv, vec2 size) {
  vec2 position = uv * size;
  vec2 center = floor(position - 0.5) + 0.5;
  vec2 f = position - center;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 p0 = (center - 1.0) / size;
  vec2 p3 = (center + 2.0) / size;
  vec2 p12 = (center + w2 / w12) / size;
  vec3 color = textureLod(source, vec2(p0.x, p0.y), 0.0).rgb * w0.x * w0.y;
  color += textureLod(source, vec2(p12.x, p0.y), 0.0).rgb * w12.x * w0.y;
  color += textureLod(source, vec2(p3.x, p0.y), 0.0).rgb * w3.x * w0.y;
  color += textureLod(source, vec2(p0.x, p12.y), 0.0).rgb * w0.x * w12.y;
  color += textureLod(source, vec2(p12.x, p12.y), 0.0).rgb * w12.x * w12.y;
  color += textureLod(source, vec2(p3.x, p12.y), 0.0).rgb * w3.x * w12.y;
  color += textureLod(source, vec2(p0.x, p3.y), 0.0).rgb * w0.x * w3.y;
  color += textureLod(source, vec2(p12.x, p3.y), 0.0).rgb * w12.x * w3.y;
  color += textureLod(source, vec2(p3.x, p3.y), 0.0).rgb * w3.x * w3.y;
  return max(color, 0.0);
}`;

const mapBlend = `#include <map_fragment>
if (max(abs(vWorldPos.x), abs(vWorldPos.z)) < holeHalfSize) discard;
vec2 mapSize = vec2(textureSize(map, 0));
vec2 footprint = fwidth(vMapUv) * mapSize;
float magnification = 1.0 - smoothstep(0.75, 1.25, max(footprint.x, footprint.y));
if (magnification > 0.001) {
  vec3 crisp = sampleCatmullRom(map, vMapUv, mapSize);
  diffuseColor.rgb = mix(diffuseColor.rgb, crisp + (crisp - diffuseColor.rgb) * sharpness, magnification);
}
if (farBlend > 0.5) {
  vec4 farColor = texture2D(farMap, (vMapUv - 0.5) * farScale + 0.5);
  diffuseColor.rgb = mix(farColor.rgb, diffuseColor.rgb, smoothstep(0.0, 0.08, layerEdge(vMapUv)));
}`;

const waterShading = `float water = smoothstep(0.35, 0.75, texture2D(waterMap, vMapUv).r);
vec3 toCamera = normalize(cameraPosition - vWorldPos);
float facing = max(toCamera.y, 0.0);
float fresnel = 0.03 + 0.97 * pow(1.0 - facing, 5.0);
vec3 reflectedSky = mix(pow(zenithColor, vec3(2.2)), pow(hazeColor, vec3(2.2)), 0.35);
vec3 reflected = reflect(-toCamera, vec3(0.0, 1.0, 0.0));
float sunSheen = pow(max(dot(reflected, sunDirection), 0.0), 60.0) * 0.35;
outgoingLight = mix(outgoingLight, reflectedSky, min(fresnel, 0.32) * water) + vec3(1.0, 0.96, 0.88) * sunSheen * water;
#include <opaque_fragment>`;

const hazeShading = `float viewDistance = length(vWorldPos - cameraPosition);
float haze = (1.0 - exp(-pow(viewDistance / hazeDistance, 1.35))) * hazeStrength;
haze *= mix(1.15, 0.8, clamp(vWorldPos.y / max(hazeHeight, 0.001), 0.0, 1.0));
haze = max(haze, edgeHaze * pow(1.0 - smoothstep(0.0, 0.34, layerEdge(vMapUv)), 1.6));
haze = max(haze, veil);
gl_FragColor.rgb = mix(gl_FragColor.rgb, hazeColor, clamp(haze, 0.0, 1.0));
#include <dithering_fragment>`;

export function createLayerMaterial(options: LayerOptions, atmosphere: AtmosphereUniforms) {
  const material = new THREE.MeshLambertMaterial({ map: options.map });
  const layerUniforms = {
    waterMap: { value: options.water },
    farMap: { value: options.farMap ?? options.map },
    farScale: { value: options.farScale ?? 1 },
    farBlend: { value: options.farMap ? 1 : 0 },
    holeHalfSize: { value: options.holeHalfSize ?? -1 },
    edgeHaze: { value: options.edgeHaze ? 1 : 0 },
    sharpness: { value: 0.38 },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, atmosphere, layerUniforms);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", vertexHead).replace("#include <project_vertex>", vertexBody);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", fragmentHead)
      .replace("#include <map_fragment>", mapBlend)
      .replace("#include <opaque_fragment>", waterShading)
      .replace("#include <dithering_fragment>", hazeShading);
  };
  material.customProgramCacheKey = () => "journey-terrain-layer";
  return material;
}

export const NEAR_HOLE = WORLD_SIZE / 2 - 0.6;

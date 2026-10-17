import { useFrame, useThree } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { JourneyScene } from "@/types/api";

import { CloudVeil } from "./CloudVeil";
import type { JourneyControls } from "./controls";
import { Sky } from "./Sky";
import type { SceneQuality, TerrainAsset } from "./terrainAsset";
import { placeCamera } from "./flightPaths";
import { disposeTerrain, loadTerrain, nextFrame, srgbVector } from "./terrainAsset";
import { createAtmosphereUniforms, createLayerMaterial, NEAR_HOLE } from "./terrainMaterial";

const SUN = new THREE.Vector3(0.4, 0.79, 0.47).normalize();
const EXIT_START = 0.84;
const ENTER_END = 0.16;
const PRELOAD_DELAY = 0.25;
const CACHE_SIZE: Record<SceneQuality, number> = { low: 3, medium: 3, high: 4 };

interface LoadedScene {
  asset: TerrainAsset;
  group: THREE.Group;
  used: number;
}

interface Palette {
  haze: THREE.Vector3;
  sky: THREE.Vector3;
}

export interface JourneyWorldProps {
  scenes: JourneyScene[];
  controls: MutableRefObject<JourneyControls>;
  quality: SceneQuality;
  onReady: () => void;
  onFailed: (index: number) => void;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function dampVector(current: THREE.Vector3, target: THREE.Vector3, lambda: number, dt: number) {
  current.lerp(target, 1 - Math.exp(-lambda * dt));
}

function createSceneGroup(asset: TerrainAsset, atmosphere: ReturnType<typeof createAtmosphereUniforms>) {
  const group = new THREE.Group();
  const near = new THREE.Mesh(
    asset.near.geometry,
    createLayerMaterial(
      {
        map: asset.near.texture,
        water: asset.near.water,
        farMap: asset.far?.texture,
        farScale: asset.far ? asset.near.size / asset.far.size : 1,
        edgeHaze: !asset.far,
      },
      atmosphere,
    ),
  );
  group.add(near);
  if (asset.far) {
    group.add(
      new THREE.Mesh(
        asset.far.geometry,
        createLayerMaterial({ map: asset.far.texture, water: asset.far.water, holeHalfSize: NEAR_HOLE, edgeHaze: true }, atmosphere),
      ),
    );
  }
  group.children.forEach((mesh) => {
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
  });
  group.visible = false;
  return group;
}

function disposeScene(entry: LoadedScene) {
  entry.group.removeFromParent();
  entry.group.children.forEach((child) => {
    (child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>).material.dispose();
  });
  disposeTerrain(entry.asset);
}

const focus = new THREE.Vector3();

export function JourneyWorld({ scenes, controls, quality, onReady, onFailed }: JourneyWorldProps) {
  const gl = useThree((state) => state.gl);
  const sceneRoot = useThree((state) => state.scene);
  const viewer = useThree((state) => state.camera);
  const root = useRef<THREE.Group>(null);
  const atmosphere = useMemo(() => createAtmosphereUniforms(SUN), []);
  const cover = useRef(1);
  const warmTarget = useMemo(() => new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true }), []);
  const palettes = useMemo<Palette[]>(
    () => scenes.map((scene) => ({ haze: srgbVector(new THREE.Color(scene.fog_color)), sky: srgbVector(new THREE.Color(scene.sky_color)) })),
    [scenes],
  );
  const callbacks = useRef({ onReady, onFailed });
  const settings = useRef({ scenes, quality });
  const world = useRef({
    alive: true,
    loaded: new Map<number, LoadedScene>(),
    disposals: [] as LoadedScene[],
    pending: new Set<number>(),
    failed: new Set<number>(),
    position: controls.current.progress,
    yaw: 0,
    pitch: 0,
    displayed: -1,
    loadVeil: 1,
    candidate: -1,
    candidateSince: 0,
    stable: Math.floor(controls.current.progress),
    ready: false,
    paletteReady: false,
  });

  useEffect(() => {
    callbacks.current = { onReady, onFailed };
  }, [onReady, onFailed]);

  useEffect(() => {
    settings.current = { scenes, quality };
  }, [scenes, quality]);

  useEffect(() => {
    gl.compileAsync(sceneRoot, viewer).catch(() => undefined);
  }, [gl, sceneRoot, viewer]);

  useEffect(() => () => warmTarget.dispose(), [warmTarget]);

  useEffect(() => {
    const state = world.current;
    state.alive = true;
    return () => {
      state.alive = false;
      state.loaded.forEach(disposeScene);
      state.loaded.clear();
      state.disposals.forEach(disposeScene);
      state.disposals = [];
      state.pending.clear();
      state.displayed = -1;
    };
  }, []);

  const request = (index: number) => {
    const state = world.current;
    const scene = settings.current.scenes[index];
    if (!scene?.terrain || state.loaded.has(index) || state.pending.has(index) || state.failed.has(index)) return;
    const level = settings.current.quality;
    state.pending.add(index);
    loadTerrain(scene, level, gl)
      .then((asset) => {
        if (!state.alive) {
          disposeTerrain(asset);
          return;
        }
        const group = createSceneGroup(asset, atmosphere);
        return gl
          .compileAsync(group, viewer, sceneRoot)
          .catch(() => undefined)
          .then(async () => {
            if (!state.alive) {
              disposeScene({ asset, group, used: 0 });
              return;
            }
            root.current?.add(group);
            for (const mesh of group.children) {
              await nextFrame();
              if (!state.alive) break;
              const hidden = group.children.filter((child) => child !== mesh);
              hidden.forEach((child) => {
                child.visible = false;
              });
              const wasVisible = group.visible;
              group.visible = true;
              const previous = gl.getRenderTarget();
              gl.setRenderTarget(warmTarget);
              gl.render(sceneRoot, viewer);
              gl.setRenderTarget(previous);
              group.visible = wasVisible;
              hidden.forEach((child) => {
                child.visible = true;
              });
            }
            if (!state.alive) {
              disposeScene({ asset, group, used: 0 });
              return;
            }
            state.loaded.set(index, { asset, group, used: performance.now() / 1000 });
          });
      })
      .catch(() => {
        state.failed.add(index);
        callbacks.current.onFailed(index);
      })
      .finally(() => state.pending.delete(index));
  };

  useFrame(({ camera, clock }, delta) => {
    const state = world.current;
    const total = settings.current.scenes.length;
    if (total === 0) return;
    const dt = Math.min(delta, 0.1);
    const time = clock.elapsedTime;
    const control = controls.current;
    state.position = THREE.MathUtils.damp(state.position, control.progress, 2.8, dt);
    state.yaw = THREE.MathUtils.damp(state.yaw, control.yaw, 3, dt);
    state.pitch = THREE.MathUtils.damp(state.pitch, control.pitch, 3, dt);
    const index = THREE.MathUtils.clamp(Math.floor(state.position), 0, total - 1);
    const local = THREE.MathUtils.clamp(state.position - index, 0, 1);

    const target = THREE.MathUtils.clamp(Math.floor(control.progress), 0, total - 1);
    if (target !== state.candidate) {
      state.candidate = target;
      state.candidateSince = time;
    }
    if (time - state.candidateSince > PRELOAD_DELAY || state.displayed < 0) state.stable = state.candidate;
    const wanted = new Set([index, state.stable, state.stable + 1, state.stable - 1].filter((value) => value >= 0 && value < total));
    wanted.forEach(request);
    state.loaded.forEach((item, key) => {
      if (wanted.has(key) || key === state.displayed) item.used = performance.now() / 1000;
    });
    if (state.loaded.size > CACHE_SIZE[settings.current.quality]) {
      const stale = [...state.loaded.entries()]
        .filter(([key]) => !wanted.has(key) && key !== state.displayed)
        .sort((a, b) => a[1].used - b[1].used)[0];
      if (stale) {
        state.loaded.delete(stale[0]);
        state.disposals.push(stale[1]);
      }
    }
    const disposal = state.disposals.shift();
    if (disposal) disposeScene(disposal);

    const entry = state.loaded.get(index);
    if (entry && state.displayed !== index) {
      state.loaded.forEach((item) => {
        item.group.visible = item === entry;
      });
      state.displayed = index;
    }
    state.loadVeil = entry ? THREE.MathUtils.damp(state.loadVeil, 0, 2, dt) : 1;
    const exitCover = index < total - 1 ? smoothstep(EXIT_START, 1, local) : 0;
    const enterCover = index > 0 ? 1 - smoothstep(0, ENTER_END, local) : 0;
    const shown = state.loaded.get(state.displayed);
    cover.current = shown ? Math.max(exitCover, enterCover, state.loadVeil) : 1;
    if (!shown) return;

    const palette = palettes[state.displayed];
    if (palette) {
      if (!state.paletteReady) {
        atmosphere.hazeColor.value.copy(palette.haze);
        atmosphere.zenithColor.value.copy(palette.sky);
        state.paletteReady = true;
      }
      dampVector(atmosphere.hazeColor.value, palette.haze, 2.5, dt);
      dampVector(atmosphere.zenithColor.value, palette.sky, 2.5, dt);
    }

    const progress = state.displayed === index ? local : state.displayed < index ? 1 : 0;
    const portraitTilt = (camera as THREE.PerspectiveCamera).aspect < 1 ? 0.32 : 0;
    placeCamera(camera, focus, shown.asset, progress, cover.current, state.yaw * 0.6, state.pitch * 0.35 + portraitTilt, time);
    atmosphere.hazeHeight.value = Math.max(shown.asset.relief, 6);
    atmosphere.veil.value = smoothstep(0.15, 1, cover.current) * 0.9;

    if (!state.ready && cover.current < 0.6) {
      state.ready = true;
      callbacks.current.onReady();
    }
  });

  return (
    <>
      <hemisphereLight args={["#e4edf5", "#b9a98f", Math.PI * 0.78]} />
      <directionalLight position={SUN.clone().multiplyScalar(100)} intensity={Math.PI * 0.45} />
      <Sky atmosphere={atmosphere} />
      <group ref={root} />
      <CloudVeil cover={cover} tint={atmosphere.hazeColor.value} />
    </>
  );
}

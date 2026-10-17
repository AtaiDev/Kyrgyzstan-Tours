import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";

import type { JourneyScene } from "@/types/api";

import type { JourneyControls } from "./controls";
import { JourneyWorld } from "./JourneyWorld";
import type { SceneQuality } from "./terrainAsset";

export interface JourneyCanvasProps {
  scenes: JourneyScene[];
  controls: MutableRefObject<JourneyControls>;
  quality: SceneQuality;
  active: boolean;
  onReady: () => void;
  onFailed: (index: number) => void;
}

const MAX_DPR: Record<SceneQuality, number> = { low: 1.25, medium: 1.5, high: 1.75 };
const WINDOW_FRAMES = 90;
const SLOW_FRAME = 1 / 45;
const FAST_FRAME = 1 / 80;

function Lens() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  useEffect(() => {
    camera.fov = width < height ? 50 : 36;
    camera.updateProjectionMatrix();
  }, [camera, width, height]);

  return null;
}

function AdaptiveResolution({ max }: { max: number }) {
  const setDpr = useThree((state) => state.setDpr);
  const stats = useRef({ total: 0, frames: 0, current: max });

  useFrame((_, delta) => {
    const state = stats.current;
    if (delta > 0.2) return;
    state.total += delta;
    state.frames += 1;
    if (state.frames < WINDOW_FRAMES) return;
    const average = state.total / state.frames;
    state.total = 0;
    state.frames = 0;
    const next = average > SLOW_FRAME ? Math.max(1, state.current - 0.25) : average < FAST_FRAME ? Math.min(max, state.current + 0.25) : state.current;
    if (next !== state.current) {
      state.current = next;
      setDpr(next);
    }
  });

  return null;
}

export default function JourneyCanvas({ scenes, controls, quality, active, onReady, onFailed }: JourneyCanvasProps) {
  const dpr = Math.max(1, Math.min(MAX_DPR[quality], window.devicePixelRatio || 1));

  return (
    <Canvas
      dpr={dpr}
      flat
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ fov: 36, near: 0.5, far: 2400, position: [0, 60, 80] }}
      aria-hidden
    >
      <Lens />
      <AdaptiveResolution max={dpr} />
      <JourneyWorld scenes={scenes} controls={controls} quality={quality} onReady={onReady} onFailed={onFailed} />
    </Canvas>
  );
}

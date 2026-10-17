import * as THREE from "three";

import type { CameraMotion } from "@/types/api";

import type { TerrainAsset } from "./terrainAsset";
import { groundHeight } from "./terrainAsset";

interface Shot {
  along: number;
  side: number;
  height: number;
  lookAlong: number;
  lookSide: number;
  lookHeight: number;
  swing: number;
}

const lerp = THREE.MathUtils.lerp;

const SHOTS: Record<CameraMotion, (t: number) => Shot> = {
  orbit: (t) => ({ along: -lerp(86, 70, t), side: 0, height: lerp(1.7, 1.4, t), lookAlong: 0, lookSide: 0, lookHeight: 0.4, swing: lerp(-40, 40, t) }),
  glide: (t) => ({ along: -lerp(104, 64, t), side: lerp(6, -4, t), height: lerp(1.65, 1.3, t), lookAlong: lerp(12, 34, t), lookSide: 0, lookHeight: 0.35, swing: 0 }),
  rise: (t) => ({ along: -lerp(70, 80, t), side: 0, height: lerp(1.2, 2.0, t), lookAlong: 8, lookSide: 0, lookHeight: lerp(0.7, 0.3, t), swing: lerp(8, -8, t) }),
  valley: (t) => ({ along: lerp(-98, -48, t), side: Math.sin(t * Math.PI) * 10, height: lerp(1.5, 1.3, t), lookAlong: lerp(-14, 36, t), lookSide: 0, lookHeight: 0.38, swing: 0 }),
  descend: (t) => ({ along: -lerp(92, 66, t), side: 0, height: lerp(2.3, 1.35, t), lookAlong: 0, lookSide: 0, lookHeight: lerp(0.2, 0.4, t), swing: lerp(18, -6, t) }),
  sweep: (t) => ({ along: -76, side: lerp(-48, 48, t), height: 1.5, lookAlong: 4, lookSide: lerp(-14, 14, t), lookHeight: 0.4, swing: 0 }),
};

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const offset = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

export function placeCamera(
  camera: THREE.Camera,
  focus: THREE.Vector3,
  asset: TerrainAsset,
  t: number,
  cover: number,
  yaw: number,
  pitch: number,
  time: number,
) {
  const relief = Math.max(asset.relief, 6);
  const shot = (SHOTS[asset.motion] ?? SHOTS.orbit)(t);
  const heading = THREE.MathUtils.degToRad(asset.heading);
  forward.set(Math.sin(heading), 0, -Math.cos(heading));
  right.set(Math.cos(heading), 0, Math.sin(heading));

  focus
    .set(0, 0, 0)
    .addScaledVector(forward, shot.lookAlong)
    .addScaledVector(right, shot.lookSide);
  focus.y = relief * (shot.lookHeight + cover * 0.8 - pitch);

  offset
    .set(0, 0, 0)
    .addScaledVector(forward, shot.along - cover * 12)
    .addScaledVector(right, shot.side + Math.sin(time * 0.05) * 1.5);
  offset.applyAxisAngle(up, THREE.MathUtils.degToRad(shot.swing) + yaw);

  const x = offset.x;
  const z = offset.z;
  const lift = relief * (shot.height + cover * 0.9) + 3 + Math.sin(time * 0.06) * 0.35;
  const clearance = Math.max(relief * 0.45, 8);
  const ground = Math.max(
    groundHeight(asset, x, z),
    groundHeight(asset, x + forward.x * 10, z + forward.z * 10),
    groundHeight(asset, x - forward.x * 6, z - forward.z * 6),
  );
  camera.position.set(x, Math.max(lift, ground + clearance), z);
  camera.lookAt(focus);
}

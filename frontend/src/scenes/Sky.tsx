import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { AtmosphereUniforms } from "./terrainMaterial";

const vertexShader = `
varying vec3 vDirection;
void main() {
  vDirection = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position.z = gl_Position.w;
}
`;

const fragmentShader = `
uniform vec3 hazeColor;
uniform vec3 zenithColor;
uniform vec3 sunDirection;
uniform float veil;
varying vec3 vDirection;
void main() {
  vec3 direction = normalize(vDirection);
  float altitude = direction.y;
  vec3 horizon = mix(hazeColor, zenithColor, 0.28);
  vec3 color = mix(horizon, zenithColor, pow(smoothstep(0.0, 0.5, altitude), 0.55));
  color = mix(hazeColor, color, smoothstep(-0.03, 0.09, altitude));
  float sun = max(dot(direction, sunDirection), 0.0);
  color += vec3(1.0, 0.93, 0.8) * (pow(sun, 10.0) * 0.12 + pow(sun, 900.0) * 0.6);
  gl_FragColor = vec4(mix(color, hazeColor, veil), 1.0);
}
`;

export function Sky({ atmosphere }: { atmosphere: AtmosphereUniforms }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: atmosphere as unknown as Record<string, THREE.IUniform>,
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [atmosphere],
  );

  useFrame(({ camera }) => {
    mesh.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[800, 48, 24]} />
    </mesh>
  );
}

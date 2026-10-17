import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
uniform float cover;
uniform float time;
uniform float aspect;
uniform vec3 tint;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 4; octave++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  float zoom = 1.0 + cover * 0.5;
  vec2 drift = vec2(time * 0.018, time * 0.006);
  float base = fbm(p * 2.4 / zoom + drift);
  float detail = fbm(p * 5.3 / zoom - drift * 1.7 + 3.1);
  float density = base * 0.72 + detail * 0.28;
  float edge = length(p * vec2(0.8, 1.0));
  float threshold = mix(0.95, -0.35, cover) + (0.35 - edge) * 0.25 * (1.0 - cover);
  float alpha = smoothstep(threshold, threshold + 0.22, density);
  alpha = max(alpha, smoothstep(0.75, 1.0, cover));
  vec3 shade = mix(tint * 0.82, vec3(1.0), smoothstep(0.25, 0.85, density));
  gl_FragColor = vec4(shade, alpha * smoothstep(0.0, 0.08, cover));
}
`;

export function CloudVeil({ cover, tint }: { cover: { current: number }; tint: THREE.Vector3 }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { cover: { value: 0 }, time: { value: 0 }, aspect: { value: 1 }, tint: { value: tint } },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [tint],
  );

  useFrame(({ clock, size }) => {
    material.uniforms.cover.value = cover.current;
    material.uniforms.time.value = clock.elapsedTime;
    material.uniforms.aspect.value = size.width / Math.max(size.height, 1);
    if (mesh.current) mesh.current.visible = cover.current > 0.001;
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={10} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

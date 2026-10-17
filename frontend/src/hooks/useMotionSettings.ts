import { useSite } from "@/api/queries";

import { usePrefersReducedMotion } from "./useMediaQuery";

export function useMotionSettings() {
  const prefersReduced = usePrefersReducedMotion();
  const { data } = useSite();
  const visual = data?.visual;
  const animations = !prefersReduced && (visual?.enable_scroll_animations ?? true);
  return {
    reduceMotion: !animations,
    parallax: animations && (visual?.enable_parallax ?? true),
    parallaxIntensity: (visual?.parallax_intensity ?? 50) / 100,
    mapAnimations: !prefersReduced && (visual?.enable_map_animations ?? true),
    heroVideo: !prefersReduced && (visual?.enable_hero_video ?? true),
    enable3d: visual?.enable_3d ?? true,
    sceneQuality: visual?.scene_quality ?? "high",
    overlayOpacity: (visual?.hero_overlay_opacity ?? 45) / 100,
  };
}

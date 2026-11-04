// Hover zoom for card media. Hover-in uses a slow-start curve over 2s, so the image eases into a gentle push-in
// instead of jumping (an expo-out curve covers most of the distance in the first frames). Hover-out eases in and
// out over 1.2s, so the image glides back rather than snapping. Pair with a per-card `group-hover:scale-*`;
// `.hover-zoom` keeps the image on its own GPU layer.
export const HOVER_ZOOM =
  "hover-zoom transition duration-[1200ms] ease-[cubic-bezier(0.45,0,0.25,1)] group-hover:duration-[2000ms] group-hover:ease-[cubic-bezier(0.33,0,0.15,1)]";

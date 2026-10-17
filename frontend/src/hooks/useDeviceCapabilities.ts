import { useMemo } from "react";

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return Boolean(context);
  } catch {
    return false;
  }
}

export function useDeviceCapabilities() {
  return useMemo(() => {
    const nav = navigator as NavigatorWithHints;
    const saveData = Boolean(nav.connection?.saveData);
    const slowNetwork = ["slow-2g", "2g"].includes(nav.connection?.effectiveType ?? "");
    const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2;
    const fewCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2;
    return {
      webgl: detectWebGL(),
      saveData,
      lowPower: saveData || slowNetwork || lowMemory || fewCores,
    };
  }, []);
}

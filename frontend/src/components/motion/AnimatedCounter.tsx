import { animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useMotionSettings } from "@/hooks/useMotionSettings";
import { useI18n } from "@/i18n/context";

export function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const { formatNumber } = useI18n();
  const { reduceMotion } = useMotionSettings();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {formatNumber(display)}
    </span>
  );
}

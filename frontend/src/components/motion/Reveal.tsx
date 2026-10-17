import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { useMotionSettings } from "@/hooks/useMotionSettings";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}

export function Reveal({ children, delay = 0, y = 28, className, as = "div" }: RevealProps) {
  const { reduceMotion } = useMotionSettings();
  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}

export function RevealWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const { reduceMotion } = useMotionSettings();
  if (reduceMotion) return <span className={className}>{text}</span>;
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1.1, delay: delay + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

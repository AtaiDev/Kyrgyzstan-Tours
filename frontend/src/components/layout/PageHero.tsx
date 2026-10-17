import { motion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";

import { PhotoCredit, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { RevealWords } from "@/components/motion/Reveal";
import type { Crumb } from "@/components/navigation/Breadcrumbs";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { useMotionSettings } from "@/hooks/useMotionSettings";
import type { Media } from "@/types/api";
import { cn } from "@/utils/cn";

interface PageHeroProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  image?: Media | null;
  crumbs: Crumb[];
  children?: ReactNode;
  size?: "md" | "lg";
}

export function PageHero({ title, eyebrow, subtitle, image, crumbs, children, size = "md" }: PageHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { parallax } = useMotionSettings();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", parallax ? "22%" : "0%"]);

  return (
    <section
      ref={ref}
      className={cn(
        "dark-surface relative isolate flex items-end overflow-hidden bg-night-900 text-milk-50",
        size === "lg" ? "min-h-[78svh]" : "min-h-[58svh]",
      )}
    >
      <motion.div style={{ y }} className="absolute inset-0 -z-10">
        <ResponsiveImage media={image} priority className="h-full w-full scale-105" sizes="100vw" />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950 via-night-950/55 to-night-950/20" />
      <div className="container-page w-full pt-36 pb-14 sm:pb-20">
        <Breadcrumbs items={crumbs} className="mb-8" />
        {eyebrow ? <p className="eyebrow mb-5 text-sand-300">{eyebrow}</p> : null}
        <h1 className="display-xl max-w-5xl text-shadow-soft">
          <RevealWords text={title} />
        </h1>
        {subtitle ? <p className="mt-6 max-w-2xl text-lg leading-relaxed text-milk-100/85 sm:text-xl">{subtitle}</p> : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
      <PhotoCredit media={image} className="absolute right-4 bottom-3 sm:right-6" />
    </section>
  );
}

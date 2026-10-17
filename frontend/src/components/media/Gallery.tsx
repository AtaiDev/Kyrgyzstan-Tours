import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useI18n } from "@/i18n/context";
import type { Media } from "@/types/api";
import { cn } from "@/utils/cn";

import { PhotoCredit, ResponsiveImage } from "./ResponsiveImage";

export function Lightbox({ images, index, onClose, onIndex }: { images: Media[]; index: number | null; onClose: () => void; onIndex: (index: number) => void }) {
  const { t } = useI18n();
  const open = index !== null;
  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndex((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndex],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, go]);

  const current = index !== null ? images[index] : null;

  return createPortal(
    <AnimatePresence>
      {current ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-[110] flex flex-col bg-night-950/95 text-milk-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <span className="text-sm text-milk-200/70">
              {(index ?? 0) + 1} / {images.length}
            </span>
            <button type="button" onClick={onClose} aria-label={t("a11y.closeGallery")} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-2 pb-4 sm:px-16">
            <AnimatePresence mode="wait">
              <motion.img
                key={current.id}
                src={current.url}
                alt={current.alt}
                className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
              />
            </AnimatePresence>
            {images.length > 1 ? (
              <>
                <button type="button" onClick={() => go(-1)} aria-label={t("a11y.previous")} className="absolute left-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:left-4">
                  <ChevronLeft className="h-6 w-6" aria-hidden />
                </button>
                <button type="button" onClick={() => go(1)} aria-label={t("a11y.next")} className="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:right-4">
                  <ChevronRight className="h-6 w-6" aria-hidden />
                </button>
              </>
            ) : null}
          </div>
          <div className="px-4 pb-6 text-center sm:px-6">
            <p className="text-sm text-milk-100">{current.caption || current.alt}</p>
            <PhotoCredit media={current} className="mt-1 inline-block" />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function tileClass(position: number, count: number) {
  if (count === 1) return "col-span-2 row-span-2 md:col-span-4";
  if (count === 2) return "col-span-2 row-span-2";
  if (position === 0) return "col-span-2 row-span-2";
  const isLast = position === count - 1;
  const mobileSpan = isLast && (count - 1) % 2 === 1 ? "col-span-2" : "";
  if (count === 3) return cn(mobileSpan, "md:col-span-2");
  if (count === 4 && isLast) return cn(mobileSpan, "md:col-span-2");
  const remainder = (count - 5) % 4;
  if (count > 5 && isLast && remainder !== 0) return cn(mobileSpan, ["", "md:col-span-4", "md:col-span-3", "md:col-span-2"][remainder]);
  return mobileSpan;
}

export function GalleryGrid({ images, className }: { images: Media[]; className?: string }) {
  const { t } = useI18n();
  const [index, setIndex] = useState<number | null>(null);
  if (images.length === 0) return null;
  return (
    <>
      <div className={cn("grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:grid-cols-4", className)}>
        {images.map((image, position) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setIndex(position)}
            aria-label={t("a11y.openImage", { index: position + 1 })}
            className={cn("group relative overflow-hidden rounded-2xl", tileClass(position, images.length))}
          >
            <ResponsiveImage media={image} sizes="(min-width: 768px) 25vw, 50vw" className="h-full w-full transition duration-700 group-hover:scale-105" />
            <span className="absolute inset-0 bg-night-950/0 transition group-hover:bg-night-950/20" />
          </button>
        ))}
      </div>
      <Lightbox images={images} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </>
  );
}

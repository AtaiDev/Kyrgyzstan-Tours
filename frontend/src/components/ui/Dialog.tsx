import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/utils/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl" | "full";
  closeLabel: string;
  tone?: "light" | "dark";
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, title, description, children, size = "md", closeLabel, tone = "light" }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus(), 60);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      previousFocus.current?.focus?.();
    };
  }, [open, onClose]);

  const widths = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-5xl", full: "max-w-[96vw]" };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" aria-label={closeLabel} className="absolute inset-0 bg-night-950/70 backdrop-blur-sm" onClick={onClose} tabIndex={-1} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className={cn(
              "relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl p-6 shadow-[var(--shadow-lift)] sm:rounded-3xl sm:p-8",
              tone === "dark" ? "bg-night-900 text-milk-50" : "bg-milk-50 text-graphite-900",
              widths[size],
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className={cn(
                "absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full transition",
                tone === "dark" ? "hover:bg-white/10" : "hover:bg-night-900/5",
              )}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            {title ? (
              <h2 id={titleId} className="pr-10 font-display text-3xl font-semibold">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-2 text-sm opacity-75">{description}</p> : null}
            <div className={title || description ? "mt-6" : undefined}>{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Adds an empty-value first option with this label. */
  placeholder?: string;
  /** Caption shown inside the trigger: stacked above the value, or inline before it. */
  label?: ReactNode;
  inlineLabel?: boolean;
  tone?: "light" | "dark";
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  /** Trigger surface classes; style open/filled states with `data-[open]:` and `data-[filled]:`. */
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

const GAP = 8;
const MAX_LIST_HEIGHT = 380;
const MAX_LIST_WIDTH = 360;
const TYPEAHEAD_MS = 600;
const EASE = [0.16, 1, 0.3, 1] as const;

interface Placement {
  up: boolean;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
}

// The list is portalled with fixed positioning so dialogs and overflow containers can't clip it; it opens upward
// when there is clearly more room above, and anchors to the trigger's right edge near the viewport's right side.
function measure(trigger: HTMLElement): Placement {
  const rect = trigger.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - GAP * 2;
  const above = rect.top - GAP * 2;
  const up = below < Math.min(MAX_LIST_HEIGHT, 240) && above > below;
  const maxWidth = Math.min(Math.max(rect.width, MAX_LIST_WIDTH), window.innerWidth - GAP * 2);
  const alignRight = rect.left + maxWidth > window.innerWidth - GAP;
  return {
    up,
    top: up ? undefined : rect.bottom + GAP,
    bottom: up ? window.innerHeight - rect.top + GAP : undefined,
    left: alignRight ? undefined : rect.left,
    right: alignRight ? Math.max(window.innerWidth - rect.right, GAP) : undefined,
    minWidth: rect.width,
    maxWidth,
    maxHeight: Math.min(MAX_LIST_HEIGHT, up ? above : below),
  };
}

/**
 * Custom select (WAI-ARIA select-only combobox). Focus stays on the trigger and the highlighted option is exposed via
 * aria-activedescendant, so enclosing focus traps keep working and Escape closes only the list.
 */
export function Select({ value, onChange, options, placeholder, label, inlineLabel, tone = "light", invalid, disabled, id, className, ...aria }: SelectProps) {
  const generated = useId();
  const triggerId = id ?? generated;
  const listId = `${triggerId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const skipClick = useRef(false);
  const typeahead = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const items = placeholder !== undefined ? [{ value: "", label: placeholder }, ...options] : options;
  const selectedIndex = items.findIndex((item) => item.value === value);
  const selected = selectedIndex >= 0 ? items[selectedIndex] : undefined;
  const filled = Boolean(selected && selected.value !== "");
  const dark = tone === "dark";

  const openList = (index = Math.max(selectedIndex, 0)) => {
    if (disabled || !items.length || !triggerRef.current) return;
    setPlacement(measure(triggerRef.current));
    setActive(index);
    setOpen(true);
  };

  const choose = (index: number) => {
    const item = items[index];
    if (item && item.value !== value) onChange(item.value);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;
    let frame = 0;
    const reposition = (event: Event) => {
      if (event.target === listRef.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPlacement(measure(trigger)));
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!trigger.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    window.addEventListener("scroll", reposition, { capture: true, passive: true });
    window.addEventListener("resize", reposition);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", reposition, { capture: true });
      window.removeEventListener("resize", reposition);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = items.length - 1;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        if (!open) return openList();
        setActive((index) => (event.key === "ArrowDown" ? Math.min(index + 1, last) : Math.max(index - 1, 0)));
        return;
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActive(event.key === "Home" ? 0 : last);
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        // The browser may still synthesise a click from this key; swallow it so the list doesn't reopen.
        skipClick.current = true;
        if (open) choose(active);
        else openList();
        return;
      case "Escape":
        if (!open) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        return;
      case "Tab":
        if (open) setOpen(false);
        return;
    }
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    const now = Date.now();
    const state = typeahead.current;
    state.text = now - state.time > TYPEAHEAD_MS ? event.key : state.text + event.key;
    state.time = now;
    const query = state.text.toLocaleLowerCase();
    const from = (open ? active : Math.max(selectedIndex, 0)) + (state.text.length === 1 ? 1 : 0);
    const match = items.map((_, offset) => (from + offset) % items.length).find((index) => items[index].label.toLocaleLowerCase().startsWith(query));
    if (match === undefined) return;
    if (open) setActive(match);
    else openList(match);
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        data-open={open || undefined}
        data-filled={filled || undefined}
        onClick={() => {
          if (skipClick.current) return;
          if (open) setOpen(false);
          else openList();
        }}
        onKeyDown={onKeyDown}
        onKeyUp={() => requestAnimationFrame(() => (skipClick.current = false))}
        className={cn("flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60", className)}
        {...aria}
      >
        <span className={cn("min-w-0", inlineLabel && "flex items-baseline gap-1.5")}>
          {label ? (
            <span
              className={cn(
                "block truncate",
                inlineLabel ? "text-sm font-medium" : "text-[0.68rem] font-semibold tracking-[0.14em] uppercase",
                dark ? "text-milk-200/60" : "text-graphite-500",
              )}
            >
              {label}
            </span>
          ) : null}
          <span className={cn("block truncate", !filled && "opacity-60")}>{selected?.label ?? placeholder ?? ""}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-60 transition-transform duration-300 ease-[var(--ease-out-expo)]", open && "rotate-180")} aria-hidden />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && placement ? (
            <motion.ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-labelledby={triggerId}
              initial={{ opacity: 0, y: placement.up ? 8 : -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: EASE } }}
              exit={{ opacity: 0, y: placement.up ? 4 : -4, scale: 0.98, transition: { duration: 0.14, ease: "easeIn" } }}
              style={{
                top: placement.top,
                bottom: placement.bottom,
                left: placement.left,
                right: placement.right,
                minWidth: placement.minWidth,
                maxWidth: placement.maxWidth,
                maxHeight: placement.maxHeight,
                transformOrigin: placement.up ? "bottom" : "top",
              }}
              // Keep focus on the trigger while clicking options or the scrollbar.
              onMouseDown={(event) => event.preventDefault()}
              className={cn(
                "fixed z-[120] overflow-y-auto overscroll-contain rounded-2xl border p-1.5 [scrollbar-width:thin] shadow-[0_24px_60px_-20px_rgb(11_21_36/0.45)]",
                dark
                  ? "border-white/10 bg-night-800 text-milk-50 [scrollbar-color:rgb(255_255_255/0.2)_transparent]"
                  : "border-graphite-100 bg-white text-graphite-900 [scrollbar-color:var(--color-graphite-200)_transparent]",
              )}
            >
              {items.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isActive = index === active;
                return (
                  <li
                    key={item.value || "__empty"}
                    id={`${listId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onPointerMove={() => {
                      if (!isActive) setActive(index);
                    }}
                    onClick={() => choose(index)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3.5 py-2.5 text-sm leading-snug transition-colors duration-150",
                      isActive && (dark ? "bg-white/10" : "bg-milk-100"),
                      isSelected && "font-semibold",
                      item.value === "" && !isSelected && (dark ? "text-milk-200/60" : "text-graphite-500"),
                    )}
                  >
                    <span className="min-w-0">{item.label}</span>
                    <Check
                      className={cn("h-4 w-4 shrink-0 transition duration-200", dark ? "text-sand-300" : "text-glacier-700", isSelected ? "scale-100 opacity-100" : "scale-50 opacity-0")}
                      aria-hidden
                    />
                  </li>
                );
              })}
            </motion.ul>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

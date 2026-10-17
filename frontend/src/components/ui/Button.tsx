import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import type { LinkProps } from "react-router";

import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "light" | "glass" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-night-900 text-milk-50 hover:bg-night-700 shadow-[var(--shadow-soft)]",
  accent: "bg-sand-400 text-night-950 hover:bg-sand-300 shadow-[var(--shadow-soft)]",
  outline: "border border-night-900/20 text-night-900 hover:border-night-900 hover:bg-night-900/5",
  ghost: "text-night-900 hover:bg-night-900/5",
  light: "bg-milk-50 text-night-900 hover:bg-white shadow-[var(--shadow-soft)]",
  glass: "border border-white/35 bg-night-950/45 text-white hover:bg-night-950/65",
  danger: "bg-danger-600 text-white hover:bg-danger-600/90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm gap-2",
  md: "h-11 px-6 text-[0.95rem] gap-2.5",
  lg: "h-14 px-8 text-base gap-3",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide whitespace-nowrap",
    "transition-all duration-300 ease-[var(--ease-out-expo)] active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant, size, loading, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconAfter?: ReactNode;
}

export function LinkButton({ variant, size, icon, iconAfter, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={cn(buttonClasses(variant, size), "group", typeof className === "string" ? className : undefined)} {...rest}>
      {icon}
      {children}
      {iconAfter}
    </Link>
  );
}

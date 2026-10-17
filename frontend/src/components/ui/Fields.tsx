import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";

import { cn } from "@/utils/cn";

type Tone = "light" | "dark";

export const inputClasses = (tone: Tone = "light", invalid = false) =>
  cn(
    "w-full rounded-xl border px-4 py-3 text-[0.95rem] transition outline-none",
    "focus:ring-2 focus:ring-offset-0",
    tone === "dark"
      ? "border-white/15 bg-white/5 text-milk-50 placeholder:text-milk-200/50 focus:border-sand-400 focus:ring-sand-400/30"
      : "border-graphite-200 bg-white text-graphite-900 placeholder:text-graphite-400 focus:border-glacier-600 focus:ring-glacier-500/20",
    invalid && "border-danger-600 focus:border-danger-600 focus:ring-danger-600/20",
  );

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ id, label, error, hint, optional, tone = "light", children, className }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={cn("mb-1.5 flex items-baseline justify-between text-sm font-semibold", tone === "dark" ? "text-milk-100" : "text-graphite-800")}>
        <span>{label}</span>
        {optional ? <span className="text-xs font-normal opacity-60">{optional}</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className={cn("mt-1.5 text-xs", tone === "dark" ? "text-milk-200/60" : "text-graphite-500")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: string;
  tone?: Tone;
  wrapperClassName?: string;
}

export function TextField({ label, error, hint, optional, tone, wrapperClassName, className, id, ...rest }: TextFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional} tone={tone} className={wrapperClassName}>
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(inputClasses(tone, Boolean(error)), className)}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: string;
  tone?: Tone;
  wrapperClassName?: string;
}

export function TextAreaField({ label, error, hint, optional, tone, wrapperClassName, className, id, ...rest }: TextAreaProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional} tone={tone} className={wrapperClassName}>
      <textarea
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(inputClasses(tone, Boolean(error)), "min-h-28 resize-y", className)}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: string;
  tone?: Tone;
  wrapperClassName?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectField({ label, error, hint, optional, tone, wrapperClassName, className, id, options, placeholder, ...rest }: SelectFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional} tone={tone} className={wrapperClassName}>
      <select
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={cn(inputClasses(tone, Boolean(error)), "appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7380' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  error?: string;
  tone?: Tone;
}

export function CheckboxField({ label, error, tone = "light", id, className, ...rest }: CheckboxProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className={className}>
      <label htmlFor={fieldId} className={cn("flex cursor-pointer items-start gap-3 text-sm", tone === "dark" ? "text-milk-100" : "text-graphite-700")}>
        <input
          id={fieldId}
          type="checkbox"
          aria-invalid={Boolean(error)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-graphite-300 accent-glacier-700"
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p className="mt-1 text-sm text-danger-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

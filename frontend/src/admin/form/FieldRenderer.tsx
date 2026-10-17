import { ArrowDown, ArrowUp, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Fields";
import type { Language } from "@/i18n/languages";
import { LANGUAGE_META } from "@/i18n/languages";
import { cn } from "@/utils/cn";

import { GalleryInput, MediaInput } from "../fields/MediaInputs";
import { RelationMulti, RelationSelect } from "../fields/RelationInputs";
import type { FieldConfig } from "../resources/types";
import type { MediaBrief } from "../types";
import { Toggle } from "../ui/Primitives";
import type { FormErrors, FormValues } from "./values";
import { ADMIN_LANGUAGE, errorFor, initialValues, readField, toDateTimeInput, translationOf, writeField } from "./values";

interface FieldRendererProps {
  field: FieldConfig;
  values: FormValues;
  onChange: (values: FormValues) => void;
  language: Language;
  errors: FormErrors;
  prefix?: string;
}

function MarkdownInput({ value, onChange, id, rows, invalid }: { value: string; onChange: (value: string) => void; id: string; rows?: number; invalid: boolean }) {
  const [preview, setPreview] = useState(false);
  return (
    <div>
      <div className="mb-2 flex gap-1">
        <button type="button" onClick={() => setPreview(false)} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", !preview ? "bg-night-900 text-white" : "text-graphite-600 hover:bg-graphite-100")}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Редактор
        </button>
        <button type="button" onClick={() => setPreview(true)} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", preview ? "bg-night-900 text-white" : "text-graphite-600 hover:bg-graphite-100")}>
          <Eye className="h-3.5 w-3.5" aria-hidden />
          Предпросмотр
        </button>
      </div>
      {preview ? (
        <div className="prose-travel min-h-40 rounded-xl border border-graphite-200 bg-white px-5 py-3">
          <ReactMarkdown skipHtml>{value || "_Пусто_"}</ReactMarkdown>
        </div>
      ) : (
        <textarea id={id} value={value} rows={rows ?? 12} onChange={(event) => onChange(event.target.value)} aria-invalid={invalid} className={cn(inputClasses("light", invalid), "font-mono text-sm leading-relaxed")} />
      )}
      <p className="mt-1.5 text-xs text-graphite-500">Поддерживается Markdown: ## Заголовок, **жирный**, *курсив*, списки через «- », ссылки [текст](/ru/tours).</p>
    </div>
  );
}

function InlineInput({ field, items, onChange, language, errors, prefix }: { field: Extract<FieldConfig, { type: "inline" }>; items: FormValues[]; onChange: (items: FormValues[]) => void; language: Language; errors: FormErrors; prefix: string }) {
  const add = () => onChange([...items, initialValues([{ title: "", fields: field.fields }], field.itemDefaults)]);
  const move = (index: number, delta: number) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const itemPrefix = `${prefix}${field.name}.${index}.`;
        const hasError = Object.keys(errors).some((key) => key.startsWith(itemPrefix));
        return (
          <div key={index} className={cn("rounded-2xl border bg-milk-50/60 p-4", hasError ? "border-danger-600/40" : "border-graphite-200")}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-night-900">
                {field.itemLabel} {index + 1}
              </span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Выше" className="rounded-lg p-1.5 text-graphite-500 hover:bg-graphite-100 disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Ниже" className="rounded-lg p-1.5 text-graphite-500 hover:bg-graphite-100 disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => onChange(items.filter((_, position) => position !== index))} aria-label="Удалить" className="rounded-lg p-1.5 text-danger-600 hover:bg-danger-100">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {field.fields.map((subField) => (
                <FieldRenderer
                  key={subField.name}
                  field={subField}
                  values={item}
                  onChange={(next) => onChange(items.map((current, position) => (position === index ? next : current)))}
                  language={language}
                  errors={errors}
                  prefix={itemPrefix}
                />
              ))}
            </div>
          </div>
        );
      })}
      {field.maxItems && items.length >= field.maxItems ? null : (
        <Button size="sm" variant="outline" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={add}>
          Добавить: {field.itemLabel.toLowerCase()}
        </Button>
      )}
    </div>
  );
}

export function FieldRenderer({ field, values, onChange, language, errors, prefix = "" }: FieldRendererProps) {
  const id = useId();
  const error = errorFor(errors, field, language, prefix);
  const invalid = Boolean(error);
  const raw = readField(values, field, language);
  const text = raw === null || raw === undefined ? "" : String(raw);
  const set = (value: unknown) => onChange(writeField(values, field, language, value));
  const reference = field.translated && language !== ADMIN_LANGUAGE ? translationOf(values, ADMIN_LANGUAGE, field.name) : "";
  const span = field.span === 2 || ["textarea", "markdown", "lines", "gallery", "inline", "relations", "image", "video"].includes(field.type) ? "md:col-span-2" : undefined;

  let control: React.ReactNode;
  switch (field.type) {
    case "textarea":
    case "lines":
      control = <textarea id={id} rows={field.rows ?? (field.type === "lines" ? 5 : 4)} value={text} maxLength={field.maxLength} placeholder={field.placeholder} onChange={(event) => set(event.target.value)} aria-invalid={invalid} className={inputClasses("light", invalid)} />;
      break;
    case "markdown":
      control = <MarkdownInput id={id} value={text} onChange={set} rows={field.rows} invalid={invalid} />;
      break;
    case "number":
    case "decimal":
      control = <input id={id} type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step ?? (field.type === "decimal" ? "0.01" : 1)} value={text} onChange={(event) => set(event.target.value)} aria-invalid={invalid} className={inputClasses("light", invalid)} />;
      break;
    case "range":
      control = (
        <div className="flex items-center gap-4">
          <input id={id} type="range" min={field.min ?? 0} max={field.max ?? 100} step={field.step ?? 1} value={text || 0} onChange={(event) => set(Number(event.target.value))} className="flex-1 accent-glacier-700" />
          <span className="w-12 text-right text-sm font-semibold text-night-900">{text || 0}</span>
        </div>
      );
      break;
    case "boolean":
      control = (
        <div className="flex items-center gap-3">
          <Toggle checked={Boolean(raw)} onChange={set} label={field.label} />
          <span className="text-sm text-graphite-700">{raw ? "Да" : "Нет"}</span>
        </div>
      );
      break;
    case "select":
      control = (
        <select id={id} value={text} onChange={(event) => set(event.target.value)} aria-invalid={invalid} className={inputClasses("light", invalid)}>
          {field.allowEmpty ? <option value="">— не выбрано —</option> : null}
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    case "relation":
      control = <RelationSelect id={id} endpoint={field.endpoint} value={raw === null || raw === undefined || raw === "" ? null : Number(raw)} onChange={set} invalid={invalid} allowEmpty={!field.required} />;
      break;
    case "relations":
      control = <RelationMulti id={id} endpoint={field.endpoint} value={Array.isArray(raw) ? (raw as number[]) : []} onChange={set} />;
      break;
    case "image":
    case "video":
      control = <MediaInput id={id} kind={field.type} folder={field.folder} value={(raw as MediaBrief | null) ?? null} onChange={set} />;
      break;
    case "gallery":
      control = <GalleryInput folder={field.folder} value={Array.isArray(raw) ? (raw as MediaBrief[]) : []} onChange={set} />;
      break;
    case "inline":
      control = <InlineInput field={field} items={Array.isArray(raw) ? (raw as FormValues[]) : []} onChange={set} language={language} errors={errors} prefix={prefix} />;
      break;
    case "color":
      control = (
        <div className="flex items-center gap-3">
          <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(text) ? text : "#000000"} onChange={(event) => set(event.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-graphite-200 bg-white p-1" aria-label={field.label} />
          <input id={id} value={text} onChange={(event) => set(event.target.value)} aria-invalid={invalid} className={cn(inputClasses("light", invalid), "font-mono")} />
        </div>
      );
      break;
    case "datetime":
      control = <input id={id} type="datetime-local" value={toDateTimeInput(raw)} onChange={(event) => set(event.target.value)} aria-invalid={invalid} className={inputClasses("light", invalid)} />;
      break;
    default:
      control = (
        <input
          id={id}
          type={field.type === "email" ? "email" : field.type === "password" ? "password" : field.type === "date" ? "date" : field.type === "url" ? "text" : "text"}
          value={text}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          autoComplete={field.type === "password" ? "new-password" : undefined}
          onChange={(event) => set(event.target.value)}
          aria-invalid={invalid}
          className={cn(inputClasses("light", invalid), field.type === "slug" && "font-mono")}
        />
      );
  }

  return (
    <div className={span}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-graphite-800">
        {field.label}
        {field.required ? <span className="text-danger-600" aria-hidden>*</span> : null}
        {field.translated ? <span className="rounded bg-night-900/5 px-1.5 py-0.5 text-[0.62rem] font-bold text-night-700">{LANGUAGE_META[language].short}</span> : null}
        {"maxLength" in field && field.maxLength && (field.type === "text" || field.type === "textarea") ? (
          <span className="ml-auto text-[0.68rem] font-normal text-graphite-400">
            {text.length}/{field.maxLength}
          </span>
        ) : null}
      </label>
      {control}
      {error ? (
        <p className="mt-1.5 text-sm text-danger-600" role="alert">
          {error}
        </p>
      ) : field.help ? (
        <p className="mt-1.5 text-xs text-graphite-500">{field.help}</p>
      ) : null}
      {reference && field.type !== "inline" ? <p className="mt-1 line-clamp-2 text-xs text-graphite-400">RU: {reference}</p> : null}
    </div>
  );
}

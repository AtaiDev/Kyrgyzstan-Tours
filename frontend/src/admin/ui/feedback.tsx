import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/utils/cn";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface FeedbackContextValue {
  notify: (kind: ToastKind, title: string, message?: string) => void;
  notifyError: (error: unknown, fallback?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function describeError(error: unknown, fallback = "Не удалось выполнить действие"): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return "Нет связи с сервером. Проверьте, что backend запущен.";
    if (error.status === 403) return "Недостаточно прав для этого действия.";
    if (error.status === 404) return "Запись не найдена — возможно, она уже удалена.";
    if (error.status === 409 && error.code === "protected") {
      const related = (error.data as { related?: string[] } | null)?.related ?? [];
      return `Запись используется в другом контенте${related.length ? `: ${related.join(", ")}` : ""}. Сначала уберите связь.`;
    }
    if (error.status === 413) return "Файл слишком большой.";
    const first = Object.entries(error.fieldErrors)[0];
    if (first) return `${first[0]}: ${first[1][0]}`;
    return error.message || fallback;
  }
  return fallback;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((items) => items.filter((item) => item.id !== id)), []);

  const notify = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((items) => [...items.slice(-3), { id, kind, title, message }]);
      window.setTimeout(() => dismiss(id), kind === "error" ? 8000 : 4000);
    },
    [dismiss],
  );

  const value = useMemo<FeedbackContextValue>(
    () => ({
      notify,
      notifyError: (error, fallback) => notify("error", "Ошибка", describeError(error, fallback)),
      confirm: (options) => new Promise<boolean>((resolve) => setDialog({ ...options, resolve })),
    }),
    [notify],
  );

  const close = (result: boolean) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  const icons = { success: CheckCircle2, error: XCircle, info: Info };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[200] flex w-[min(92vw,380px)] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const ToastIcon = icons[toast.kind];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                role={toast.kind === "error" ? "alert" : "status"}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-[var(--shadow-lift)]",
                  toast.kind === "error" ? "border-danger-600/30" : toast.kind === "success" ? "border-success-700/20" : "border-graphite-200",
                )}
              >
                <ToastIcon className={cn("mt-0.5 h-5 w-5 shrink-0", toast.kind === "error" ? "text-danger-600" : toast.kind === "success" ? "text-success-700" : "text-night-600")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-graphite-900">{toast.title}</p>
                  {toast.message ? <p className="mt-0.5 text-sm break-words text-graphite-600">{toast.message}</p> : null}
                </div>
                <button type="button" onClick={() => dismiss(toast.id)} aria-label="Закрыть уведомление" className="rounded-full p-1 text-graphite-400 hover:bg-graphite-100">
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <Dialog open={Boolean(dialog)} onClose={() => close(false)} title={dialog?.title} closeLabel="Отмена">
        <div className="flex gap-4">
          {dialog?.danger ? <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-danger-600" aria-hidden /> : null}
          {dialog?.message ? <p className="text-graphite-700">{dialog.message}</p> : null}
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline" onClick={() => close(false)}>
            Отмена
          </Button>
          <Button variant={dialog?.danger ? "danger" : "primary"} onClick={() => close(true)}>
            {dialog?.confirmLabel ?? "Подтвердить"}
          </Button>
        </div>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("useFeedback must be used inside FeedbackProvider");
  return value;
}

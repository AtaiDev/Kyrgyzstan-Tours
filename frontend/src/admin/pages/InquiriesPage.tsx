import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Mail, MessageCircle, Phone, Search, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { inputClasses } from "@/components/ui/Fields";
import { Spinner } from "@/components/ui/States";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/utils/cn";

import { adminApi } from "../api";
import { useAdminAuth } from "../auth";
import type { AdminRecord } from "../types";
import { useFeedback } from "../ui/feedback";
import { PageHeader, STATUS_LABELS, StatusBadge, Toggle } from "../ui/Primitives";

type Tab = "bookings" | "messages" | "subscribers";

const TABS: Array<{ key: Tab; label: string; model: string; endpoint: string; statuses: string[] }> = [
  { key: "bookings", label: "Заявки на экскурсии", model: "inquiries.bookingrequest", endpoint: "/admin/bookings/", statuses: ["new", "in_progress", "confirmed", "completed", "cancelled"] },
  { key: "messages", label: "Сообщения", model: "inquiries.contactmessage", endpoint: "/admin/messages/", statuses: ["new", "read", "answered", "archived"] },
  { key: "subscribers", label: "Подписчики", model: "inquiries.newslettersubscriber", endpoint: "/admin/subscribers/", statuses: [] },
];

const CONTACT_LABELS: Record<string, string> = { email: "Email", phone: "Звонок", whatsapp: "WhatsApp", telegram: "Telegram" };
const LANGUAGE_LABELS: Record<string, string> = { ru: "RU", en: "EN", ky: "KG" };

function formatDate(value: unknown, withTime = true) {
  if (!value) return "—";
  const date = new Date(String(value));
  return withTime ? date.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString("ru-RU");
}

function ContactLinks({ record }: { record: AdminRecord }) {
  const phone = String(record.phone ?? "").replace(/[^\d+]/g, "");
  const links = [
    record.email ? { href: `mailto:${record.email}`, icon: Mail, label: String(record.email) } : null,
    phone ? { href: `tel:${phone}`, icon: Phone, label: String(record.phone) } : null,
    phone ? { href: `https://wa.me/${phone.replace("+", "")}`, icon: MessageCircle, label: "WhatsApp" } : null,
    phone ? { href: `https://t.me/${phone}`, icon: Send, label: "Telegram" } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ href, icon: LinkIcon, label }) => (
        <a key={href} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-graphite-200 px-3 py-1.5 text-sm text-night-900 hover:border-night-900">
          <LinkIcon className="h-4 w-4" aria-hidden />
          {label}
        </a>
      ))}
    </div>
  );
}

function InquiryDetail({ tab, record, onClose }: { tab: (typeof TABS)[number]; record: AdminRecord; onClose: () => void }) {
  const { canModel } = useAdminAuth();
  const { notify, notifyError, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(String(record.status));
  const [notes, setNotes] = useState(String(record.admin_notes ?? ""));
  const [busy, setBusy] = useState(false);
  const canChange = canModel(tab.model, "change");
  const canDelete = canModel(tab.model, "delete");

  const save = async () => {
    setBusy(true);
    try {
      await adminApi.update(tab.endpoint, Number(record.id), { status, admin_notes: notes });
      notify("success", "Заявка обновлена");
      void queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      onClose();
    } catch (error) {
      notifyError(error);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({ title: "Удалить запись?", message: "Контактные данные клиента будут удалены безвозвратно.", confirmLabel: "Удалить", danger: true });
    if (!ok) return;
    try {
      await adminApi.remove(tab.endpoint, Number(record.id));
      notify("success", "Запись удалена");
      void queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      onClose();
    } catch (error) {
      notifyError(error);
    }
  };

  const rows: Array<[string, unknown]> =
    tab.key === "bookings"
      ? [
          ["Экскурсия", record.tour_title ?? "Не выбрана"],
          ["Гид", record.guide_name ?? "—"],
          ["Дата поездки", record.travel_date ? formatDate(record.travel_date, false) : "Не указана"],
          ["Путешественников", record.travelers],
          ["Предпочтительная связь", CONTACT_LABELS[String(record.preferred_contact)] ?? record.preferred_contact],
          ["Язык сайта", LANGUAGE_LABELS[String(record.language)] ?? record.language],
          ["Страница", record.source_page || "—"],
          ["Получена", formatDate(record.created_at)],
          ["Обработал", record.handled_by_name ?? "—"],
        ]
      : [
          ["Тема", record.subject || "—"],
          ["Язык сайта", LANGUAGE_LABELS[String(record.language)] ?? record.language],
          ["Получено", formatDate(record.created_at)],
        ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-2xl font-semibold text-night-900">{String(record.full_name)}</p>
        <div className="mt-3">
          <ContactLinks record={record} />
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-2xl bg-milk-100 p-4 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-graphite-200/60 py-1.5">
            <dt className="text-graphite-500">{label}</dt>
            <dd className="text-right font-medium text-night-900">{String(value)}</dd>
          </div>
        ))}
      </dl>
      {record.message ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-graphite-700">Сообщение клиента</p>
          <p className="rounded-2xl border border-graphite-200 p-4 whitespace-pre-line text-graphite-800">{String(record.message)}</p>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr]">
        <label className="block text-sm font-semibold text-graphite-700">
          Статус
          <select disabled={!canChange} value={status} onChange={(event) => setStatus(event.target.value)} className={cn(inputClasses(), "mt-1.5")}>
            {tab.statuses.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value] ?? value}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-graphite-700">
          Заметки менеджера
          <textarea disabled={!canChange} rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} className={cn(inputClasses(), "mt-1.5")} placeholder="Например: созвонились, ждём подтверждения дат" />
        </label>
      </div>
      <div className="flex flex-wrap justify-between gap-3">
        {canDelete ? (
          <Button variant="ghost" className="text-danger-600 hover:bg-danger-100" icon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={() => void remove()}>
            Удалить
          </Button>
        ) : (
          <span />
        )}
        {canChange ? (
          <Button loading={busy} onClick={() => void save()}>
            Сохранить
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Subscribers() {
  const { canModel } = useAdminAuth();
  const { notifyError, notify, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "inquiries", "subscribers"], queryFn: () => adminApi.list("/admin/subscribers/", { page_size: 200 }) });
  const rows = query.data?.results ?? [];

  const exportCsv = () => {
    const lines = ["email,language,is_active,created_at", ...rows.map((row) => [row.email, row.language, row.is_active, row.created_at].join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "subscribers.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const toggle = async (row: AdminRecord, value: boolean) => {
    try {
      await adminApi.update("/admin/subscribers/", Number(row.id), { is_active: value });
      void queryClient.invalidateQueries({ queryKey: ["admin", "inquiries", "subscribers"] });
    } catch (error) {
      notifyError(error);
    }
  };

  const remove = async (row: AdminRecord) => {
    if (!(await confirm({ title: "Удалить подписчика?", message: String(row.email), danger: true, confirmLabel: "Удалить" }))) return;
    try {
      await adminApi.remove("/admin/subscribers/", Number(row.id));
      notify("success", "Подписчик удалён");
      void queryClient.invalidateQueries({ queryKey: ["admin", "inquiries", "subscribers"] });
    } catch (error) {
      notifyError(error);
    }
  };

  if (query.isLoading) return <Spinner label="Загрузка…" />;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-graphite-600">Всего: {query.data?.count ?? 0}. Рассылка не отправляется автоматически — экспортируйте список для своего почтового сервиса.</p>
        <Button variant="outline" icon={<Download className="h-4 w-4" aria-hidden />} onClick={exportCsv} disabled={!rows.length}>
          Экспорт CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-graphite-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-graphite-100/60 text-left text-xs tracking-wide text-graphite-600 uppercase">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Язык</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Активен</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-graphite-500">
                  Подписчиков пока нет
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={String(row.id)}>
                  <td className="px-4 py-3 font-medium text-night-900">{String(row.email)}</td>
                  <td className="px-4 py-3">{LANGUAGE_LABELS[String(row.language)] ?? String(row.language)}</td>
                  <td className="px-4 py-3">{formatDate(row.created_at, false)}</td>
                  <td className="px-4 py-3">
                    <Toggle checked={Boolean(row.is_active)} label="Активен" disabled={!canModel("inquiries.newslettersubscriber", "change")} onChange={(value) => void toggle(row, value)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canModel("inquiries.newslettersubscriber", "delete") ? (
                      <button type="button" onClick={() => void remove(row)} className="rounded-lg p-2 text-graphite-500 hover:bg-danger-100 hover:text-danger-600" aria-label="Удалить">
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InquiryList({ tab }: { tab: (typeof TABS)[number] }) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search, 300);
  const openId = params.get("booking");
  const [selected, setSelected] = useState<AdminRecord | null>(null);
  const query = useQuery({
    queryKey: ["admin", "inquiries", tab.key, debounced, status, page],
    queryFn: () => adminApi.list(tab.endpoint, { search: debounced, status, page, page_size: 25 }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!openId || tab.key !== "bookings") return;
    void adminApi.get(tab.endpoint, openId).then(setSelected).catch(() => undefined);
  }, [openId, tab]);

  const close = () => {
    setSelected(null);
    if (openId) {
      const next = new URLSearchParams(params);
      next.delete("booking");
      setParams(next, { replace: true });
    }
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-graphite-400" aria-hidden />
          <input type="search" aria-label="Поиск" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Имя, email, телефон, текст сообщения…" className={cn(inputClasses(), "h-11 py-2 pl-10")} />
        </div>
        <select aria-label="Статус" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={cn(inputClasses(), "h-11 py-2")}>
          <option value="">Все статусы</option>
          {tab.statuses.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      {query.isLoading ? (
        <Spinner label="Загрузка…" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-graphite-200 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-graphite-100/60 text-left text-xs tracking-wide text-graphite-600 uppercase">
              <tr>
                <th className="px-4 py-3">Получено</th>
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">{tab.key === "bookings" ? "Экскурсия" : "Тема"}</th>
                {tab.key === "bookings" ? <th className="px-4 py-3">Поездка</th> : null}
                <th className="px-4 py-3">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100">
              {(query.data?.results ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-graphite-500">
                    {tab.key === "bookings" ? "Заявок пока нет — они появятся здесь сразу после отправки формы на сайте." : "Сообщений пока нет."}
                  </td>
                </tr>
              ) : (
                (query.data?.results ?? []).map((row) => (
                  <tr key={String(row.id)} onClick={() => setSelected(row)} className={cn("cursor-pointer hover:bg-milk-100/70", row.status === "new" && "font-semibold")}>
                    <td className="px-4 py-3 whitespace-nowrap text-graphite-600">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="text-night-900">{String(row.full_name)}</div>
                      <div className="text-xs font-normal text-graphite-500">{String(row.email)}</div>
                    </td>
                    <td className="px-4 py-3 text-graphite-700">{String((tab.key === "bookings" ? row.tour_title : row.subject) || "—")}</td>
                    {tab.key === "bookings" ? (
                      <td className="px-4 py-3 font-normal whitespace-nowrap text-graphite-600">
                        {row.travel_date ? formatDate(row.travel_date, false) : "Дата не указана"} · {String(row.travelers)} чел.
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <StatusBadge status={String(row.status)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {query.data && query.data.total_pages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Назад
          </Button>
          <span>
            {query.data.page} / {query.data.total_pages}
          </span>
          <Button size="sm" variant="outline" disabled={page >= query.data.total_pages} onClick={() => setPage((value) => value + 1)}>
            Вперёд
          </Button>
        </div>
      ) : null}
      <Dialog open={Boolean(selected)} onClose={close} title={tab.key === "bookings" ? "Заявка на экскурсию" : "Сообщение"} size="lg" closeLabel="Закрыть">
        {selected ? <InquiryDetail key={String(selected.id)} tab={tab} record={selected} onClose={close} /> : null}
      </Dialog>
    </div>
  );
}

export default function InquiriesPage() {
  const { canModel } = useAdminAuth();
  const [params, setParams] = useSearchParams();
  const available = TABS.filter((tab) => canModel(tab.model, "view"));
  const active = available.find((tab) => tab.key === params.get("tab")) ?? available[0];
  if (!active) return <p className="text-graphite-600">Недостаточно прав для просмотра заявок.</p>;
  return (
    <div>
      <PageHeader title="Заявки клиентов" description="Все обращения с сайта сохраняются в базе данных. Если на сервере настроена почта, команда дополнительно получает уведомление на email." />
      <div role="tablist" className="mb-6 inline-flex flex-wrap rounded-full border border-graphite-200 bg-white p-1">
        {available.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active.key === tab.key}
            onClick={() => setParams({ tab: tab.key })}
            className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", active.key === tab.key ? "bg-night-900 text-milk-50" : "text-graphite-600 hover:text-night-900")}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active.key === "subscribers" ? <Subscribers /> : <InquiryList key={active.key} tab={active} />}
    </div>
  );
}

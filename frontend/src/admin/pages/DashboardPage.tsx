import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Inbox, Mail, Users } from "lucide-react";
import { Link } from "react-router";

import { Spinner } from "@/components/ui/States";
import { LANGUAGE_META, LANGUAGES } from "@/i18n/languages";
import { cn } from "@/utils/cn";

import { adminApi } from "../api";
import { useAdminAuth } from "../auth";
import { Card, PageHeader, StatusBadge } from "../ui/Primitives";

const COUNT_LABELS: Record<string, { label: string; href: string }> = {
  regions: { label: "Области", href: "/admin/r/regions" },
  destinations: { label: "Направления", href: "/admin/r/destinations" },
  attractions: { label: "Достопримечательности", href: "/admin/r/attractions" },
  tours: { label: "Экскурсии", href: "/admin/r/tours" },
  routes: { label: "Маршруты", href: "/admin/r/routes" },
  guides: { label: "Гиды", href: "/admin/r/guides" },
  team: { label: "Команда", href: "/admin/r/team" },
  articles: { label: "Статьи", href: "/admin/r/articles" },
  reviews: { label: "Отзывы", href: "/admin/r/reviews" },
  media: { label: "Файлы в медиатеке", href: "/admin/media" },
};

function BarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <div>
      <div className="flex h-40 items-end gap-1" role="img" aria-label="Количество заявок по дням за последние 30 дней">
        {data.map((item) => (
          <div key={item.date} className="group relative flex-1">
            <div className="rounded-t bg-glacier-500 transition group-hover:bg-glacier-700" style={{ height: `${Math.max((item.count / max) * 150, item.count ? 6 : 2)}px`, opacity: item.count ? 1 : 0.25 }} />
            <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-night-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
              {new Date(item.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}: {item.count}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-graphite-500">
        <span>{data[0] ? new Date(data[0].date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : ""}</span>
        <span>Сегодня</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAdminAuth();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => adminApi.dashboard(), refetchInterval: 60_000 });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Загрузка статистики…" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="rounded-xl bg-danger-100 p-4 text-danger-600">
        Не удалось загрузить статистику. <button type="button" className="underline" onClick={() => void refetch()}>Повторить</button>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Здравствуйте, ${user?.first_name || user?.username}!`} description="Сводка по контенту, заявкам и переводам." />

      {data.demo_items > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-warning-700/20 bg-warning-100 p-4 text-sm text-warning-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            На сайте {data.demo_items} демонстрационных записей (гиды, отзывы, статьи, фото и т. д.). Они отмечены меткой «Пример» — замените их реальными данными перед запуском.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.inquiries ? (
          <Link to="/admin/inquiries" className="rounded-2xl bg-night-900 p-5 text-milk-50 shadow-sm transition hover:bg-night-800">
            <Inbox className="h-6 w-6 text-sand-300" aria-hidden />
            <p className="mt-4 font-display text-4xl font-semibold">{data.inquiries.new}</p>
            <p className="text-sm text-milk-200/80">Новые заявки · всего {data.inquiries.total}</p>
          </Link>
        ) : null}
        {data.messages ? (
          <Link to="/admin/inquiries?tab=messages" className="rounded-2xl border border-graphite-200 bg-white p-5 shadow-sm transition hover:border-night-900/30">
            <Mail className="h-6 w-6 text-glacier-700" aria-hidden />
            <p className="mt-4 font-display text-4xl font-semibold text-night-900">{data.messages.new}</p>
            <p className="text-sm text-graphite-600">Новые сообщения · всего {data.messages.total}</p>
          </Link>
        ) : null}
        {data.counts.reviews ? (
          <Link to="/admin/r/reviews?status=pending" className="rounded-2xl border border-graphite-200 bg-white p-5 shadow-sm transition hover:border-night-900/30">
            <AlertTriangle className="h-6 w-6 text-sand-600" aria-hidden />
            <p className="mt-4 font-display text-4xl font-semibold text-night-900">{data.counts.reviews.pending ?? 0}</p>
            <p className="text-sm text-graphite-600">Отзывы на модерации</p>
          </Link>
        ) : null}
        {data.subscribers !== null ? (
          <Link to="/admin/inquiries?tab=subscribers" className="rounded-2xl border border-graphite-200 bg-white p-5 shadow-sm transition hover:border-night-900/30">
            <Users className="h-6 w-6 text-glacier-700" aria-hidden />
            <p className="mt-4 font-display text-4xl font-semibold text-night-900">{data.subscribers}</p>
            <p className="text-sm text-graphite-600">Активные подписчики</p>
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        {data.inquiries ? (
          <Card title="Заявки за 30 дней" actions={<span className="text-sm text-graphite-500">В работе: {data.inquiries.in_progress}</span>}>
            <BarChart data={data.inquiries.chart} />
          </Card>
        ) : null}
        <Card title="Заполненность переводов">
          <div className="space-y-4">
            {LANGUAGES.map((code) => {
              const value = data.translations[code] ?? 0;
              return (
                <div key={code}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-night-900">{LANGUAGE_META[code].native}</span>
                    <span className="text-graphite-600">{value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-graphite-100">
                    <div className={cn("h-full rounded-full", value >= 95 ? "bg-success-700" : value >= 70 ? "bg-sand-500" : "bg-danger-600")} style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/admin/translations?tab=content" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-glacier-700 hover:text-glacier-800">
            Подробнее по разделам <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        {data.inquiries ? (
          <Card title="Последние заявки" actions={<Link to="/admin/inquiries" className="text-sm font-semibold text-glacier-700">Все заявки</Link>}>
            {data.inquiries.recent.length ? (
              <ul className="divide-y divide-graphite-100">
                {data.inquiries.recent.map((item) => (
                  <li key={item.id}>
                    <Link to={`/admin/inquiries?booking=${item.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-milk-100/60">
                      <span>
                        <span className="block font-semibold text-night-900">{item.full_name}</span>
                        <span className="text-xs text-graphite-500">
                          {item.tour_title ?? "Без выбранного тура"} · {item.travelers} чел. · {new Date(item.created_at).toLocaleDateString("ru-RU")}
                        </span>
                      </span>
                      <StatusBadge status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-graphite-500">Заявок пока нет. Они появятся здесь сразу после отправки формы на сайте.</p>
            )}
          </Card>
        ) : null}
        <Card title="Контент">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(data.counts).map(([key, value]) => (
              <li key={key}>
                <Link to={COUNT_LABELS[key]?.href ?? "/admin"} className="flex items-center justify-between rounded-xl border border-graphite-100 px-3 py-2.5 text-sm hover:border-night-900/20">
                  <span className="text-graphite-700">{COUNT_LABELS[key]?.label ?? key}</span>
                  <span className="font-semibold text-night-900">
                    {value.published}
                    {value.total !== value.published ? <span className="text-graphite-400"> / {value.total}</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

import { isRouteErrorResponse, useRouteError } from "react-router";

import { LogoMark } from "@/components/brand/Logo";

export function RouteError() {
  const error = useRouteError();
  const chunkFailed = error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message);
  const status = isRouteErrorResponse(error) ? error.status : null;
  return (
    <div className="dark-surface flex min-h-svh flex-col items-center justify-center gap-6 bg-night-950 px-6 text-center text-milk-50">
      <LogoMark className="h-16 w-16" />
      <h1 className="font-display text-4xl font-semibold">{status === 404 ? "404" : "Kyrgyzstan-Tours"}</h1>
      <p className="max-w-md text-milk-200/80">
        {chunkFailed
          ? "A new version of the site is available. Please reload the page. / Доступна новая версия сайта — обновите страницу. / Сайттын жаңы версиясы бар — баракты жаңылаңыз."
          : "Something went wrong while loading the page. / Не удалось загрузить страницу. / Баракты жүктөө мүмкүн болгон жок."}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full bg-sand-400 px-6 py-3 text-sm font-semibold text-night-950 transition hover:bg-sand-300"
      >
        Reload · Обновить · Жаңылоо
      </button>
    </div>
  );
}

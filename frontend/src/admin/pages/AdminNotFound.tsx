import { Link } from "react-router";

import { buttonClasses } from "@/components/ui/Button";

export function AdminNotFound({ forbidden = false }: { forbidden?: boolean }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl font-semibold text-night-900">{forbidden ? "403" : "404"}</p>
      <h1 className="mt-3 text-xl font-semibold text-night-900">{forbidden ? "Недостаточно прав" : "Раздел не найден"}</h1>
      <p className="mt-2 max-w-md text-graphite-600">
        {forbidden ? "У вашей роли нет доступа к этому разделу. Обратитесь к администратору." : "Проверьте адрес или вернитесь на главную страницу панели."}
      </p>
      <Link to="/admin" className={buttonClasses("primary", "md", "mt-6")}>
        На дашборд
      </Link>
    </div>
  );
}

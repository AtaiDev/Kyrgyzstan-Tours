import { Lock } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";

import { ApiError } from "@/api/client";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Fields";

import { useAdminAuth } from "../auth";

export default function LoginPage() {
  const { user, login, loading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  if (!loading && user) return <Navigate to={from} replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Введите логин и пароль.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (failure) {
      if (failure instanceof ApiError) {
        if (failure.code === "invalid_credentials") setError("Неверный логин или пароль.");
        else if (failure.code === "not_staff") setError("У этой учётной записи нет доступа к админ-панели.");
        else if (failure.status === 429) setError("Слишком много попыток входа. Подождите минуту.");
        else if (failure.status === 403) setError("Сессия устарела. Обновите страницу и попробуйте снова.");
        else if (failure.isNetworkError) setError("Нет связи с сервером. Убедитесь, что backend запущен.");
        else setError(failure.message);
      } else {
        setError("Не удалось войти.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dark-surface flex min-h-svh items-center justify-center bg-night-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <form onSubmit={submit} noValidate className="rounded-3xl bg-milk-50 p-8 shadow-[var(--shadow-lift)]">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-night-900 text-sand-300">
              <Lock className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold text-night-900">Вход в админ-панель</h1>
              <p className="text-sm text-graphite-500">Только для сотрудников</p>
            </div>
          </div>
          <div className="space-y-4">
            <TextField label="Логин" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} autoFocus />
            <TextField label="Пароль" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-danger-100 px-4 py-3 text-sm text-danger-600">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" loading={submitting} className="mt-6 w-full">
            Войти
          </Button>
          <a href="/" className="mt-5 block text-center text-sm text-graphite-500 hover:text-night-900">
            ← Вернуться на сайт
          </a>
        </form>
      </div>
    </div>
  );
}

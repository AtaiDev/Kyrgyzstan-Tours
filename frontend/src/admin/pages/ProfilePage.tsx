import { useState } from "react";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Fields";

import { adminApi } from "../api";
import { useAdminAuth } from "../auth";
import { useFeedback } from "../ui/feedback";
import { Card, PageHeader } from "../ui/Primitives";

export default function ProfilePage() {
  const { user } = useAdminAuth();
  const { notify } = useFeedback();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!current) found.current_password = "Введите текущий пароль";
    if (next.length < 10) found.new_password = "Минимум 10 символов";
    if (next !== repeat) found.repeat = "Пароли не совпадают";
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await adminApi.changePassword(current, next);
      notify("success", "Пароль изменён");
      setCurrent("");
      setNext("");
      setRepeat("");
    } catch (error) {
      if (error instanceof ApiError) setErrors(Object.fromEntries(Object.entries(error.fieldErrors).map(([key, messages]) => [key, messages[0]])));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Профиль" description={`${user?.full_name} · ${user?.groups.join(", ") || (user?.is_superuser ? "Суперпользователь" : "Без ролей")}`} />
      <Card title="Смена пароля" className="max-w-xl">
        <form onSubmit={submit} noValidate className="space-y-4">
          <TextField label="Текущий пароль" type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} error={errors.current_password} />
          <TextField label="Новый пароль" type="password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} error={errors.new_password} hint="Не менее 10 символов, не только цифры, не похож на логин." />
          <TextField label="Повторите новый пароль" type="password" autoComplete="new-password" value={repeat} onChange={(event) => setRepeat(event.target.value)} error={errors.repeat} />
          <Button type="submit" loading={saving}>
            Изменить пароль
          </Button>
        </form>
      </Card>
    </div>
  );
}

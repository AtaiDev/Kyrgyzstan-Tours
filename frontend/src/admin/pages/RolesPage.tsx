import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Fields";
import { Spinner } from "@/components/ui/States";
import { cn } from "@/utils/cn";

import { adminApi } from "../api";
import { useAdminAuth } from "../auth";
import type { Role } from "../types";
import { useFeedback } from "../ui/feedback";
import { PageHeader } from "../ui/Primitives";
import { AdminNotFound } from "./AdminNotFound";

const ACTIONS = [
  ["view", "Просмотр"],
  ["add", "Создание"],
  ["change", "Изменение"],
  ["delete", "Удаление"],
] as const;

function RoleEditor({ role, onDeleted }: { role: Role; onDeleted: () => void }) {
  const { canModel } = useAdminAuth();
  const { notify, notifyError, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const catalog = useQuery({ queryKey: ["admin", "role-catalog"], queryFn: () => adminApi.roleCatalog() });
  const [name, setName] = useState(role.name);
  const [permissions, setPermissions] = useState<string[]>(role.permissions);
  const [saving, setSaving] = useState(false);
  const canChange = canModel("auth.group", "change");

  useEffect(() => {
    setName(role.name);
    setPermissions(role.permissions);
  }, [role]);

  const toggle = (permission: string) => setPermissions((current) => (current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]));

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/roles/${role.id}/`, { name, permissions });
      notify("success", "Роль сохранена", "Права пользователей обновятся при следующем запросе.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: "Удалить роль?", message: `Пользователи с ролью «${role.name}» потеряют её права.`, danger: true, confirmLabel: "Удалить" }))) return;
    try {
      await api.delete(`/admin/roles/${role.id}/`);
      notify("success", "Роль удалена");
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      onDeleted();
    } catch (error) {
      notifyError(error);
    }
  };

  if (catalog.isLoading) return <Spinner label="Загрузка…" />;

  return (
    <div className="rounded-2xl border border-graphite-200 bg-white p-5">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="block flex-1 text-sm font-semibold text-graphite-700">
          Название роли
          <input disabled={!canChange} value={name} onChange={(event) => setName(event.target.value)} className={cn(inputClasses(), "mt-1.5")} />
        </label>
        {canChange ? (
          <Button loading={saving} icon={<Save className="h-4 w-4" aria-hidden />} onClick={() => void save()}>
            Сохранить
          </Button>
        ) : null}
        {canModel("auth.group", "delete") ? (
          <Button variant="ghost" className="text-danger-600 hover:bg-danger-100" icon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={() => void remove()}>
            Удалить
          </Button>
        ) : null}
      </div>
      <p className="mb-3 text-sm text-graphite-600">Пользователей с ролью: {role.users_count}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs tracking-wide text-graphite-500 uppercase">
            <tr>
              <th className="py-2 pr-4">Раздел</th>
              {ACTIONS.map(([key, label]) => (
                <th key={key} className="px-2 py-2 text-center">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-100">
            {(catalog.data ?? []).map((entry) => (
              <tr key={entry.model}>
                <td className="py-2 pr-4 text-graphite-800">{entry.label}</td>
                {ACTIONS.map(([key]) => (
                  <td key={key} className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={`${entry.label}: ${key}`}
                      disabled={!canChange}
                      checked={permissions.includes(entry.permissions[key])}
                      onChange={() => toggle(entry.permissions[key])}
                      className="h-4 w-4 accent-glacier-700"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const { canModel } = useAdminAuth();
  const { notifyError } = useFeedback();
  const queryClient = useQueryClient();
  const roles = useQuery({ queryKey: ["admin", "roles"], queryFn: () => adminApi.roles(), enabled: canModel("auth.group", "view") });
  const [active, setActive] = useState<number | null>(null);
  if (!canModel("auth.group", "view")) return <AdminNotFound forbidden />;
  const selected = roles.data?.find((role) => role.id === active) ?? roles.data?.[0];

  const create = async () => {
    try {
      const role = await api.post<Role>("/admin/roles/", { name: `Новая роль ${(roles.data?.length ?? 0) + 1}`, permissions: [] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      setActive(role.id);
    } catch (error) {
      notifyError(error);
    }
  };

  return (
    <div>
      <PageHeader
        title="Роли и права доступа"
        description="Роль — набор прав на разделы. Назначьте роли пользователям в разделе «Пользователи». Суперпользователь всегда имеет все права."
        actions={
          canModel("auth.group", "add") ? (
            <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => void create()}>
              Новая роль
            </Button>
          ) : null
        }
      />
      {roles.isLoading ? (
        <Spinner label="Загрузка…" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <ul className="space-y-1">
            {(roles.data ?? []).map((role) => (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => setActive(role.id)}
                  className={cn("w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition", selected?.id === role.id ? "bg-night-900 text-milk-50" : "bg-white text-graphite-700 hover:bg-graphite-100")}
                >
                  {role.name}
                  <span className="block text-xs font-normal opacity-70">{role.permissions.length} прав · {role.users_count} польз.</span>
                </button>
              </li>
            ))}
          </ul>
          {selected ? <RoleEditor role={selected} onDeleted={() => setActive(null)} /> : <p className="text-graphite-500">Ролей пока нет.</p>}
        </div>
      )}
    </div>
  );
}

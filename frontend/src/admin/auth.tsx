import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router";

import { Spinner } from "@/components/ui/States";

import { adminApi } from "./api";
import type { AdminUser } from "./types";

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  can: (permission: string) => boolean;
  canModel: (model: string, action: "view" | "add" | "change" | "delete") => boolean;
  login: (username: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    void adminApi.csrf();
  }, []);
  const me = useQuery({ queryKey: ["admin", "me"], queryFn: () => adminApi.me(), staleTime: 60 * 1000, retry: false });
  const user = me.data?.user ?? null;

  const login = useCallback(
    async (username: string, password: string) => {
      await adminApi.csrf();
      const result = await adminApi.login(username, password);
      queryClient.setQueryData(["admin", "me"], { user: result.user });
      await adminApi.csrf();
      return result.user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await adminApi.logout();
    queryClient.removeQueries({ queryKey: ["admin"] });
    queryClient.setQueryData(["admin", "me"], { user: null });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const permissions = new Set(user?.permissions ?? []);
    const can = (permission: string) => Boolean(user && (user.is_superuser || permissions.has(permission)));
    return {
      user,
      loading: me.isLoading,
      can,
      canModel: (model, action) => {
        const [app, name] = model.split(".");
        return can(`${app}.${action}_${name}`);
      },
      login,
      logout,
    };
  }, [user, me.isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return value;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAdminAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-milk-100 text-graphite-600">
        <Spinner label="Проверяем доступ…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

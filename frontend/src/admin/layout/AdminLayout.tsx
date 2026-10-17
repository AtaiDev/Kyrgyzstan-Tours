import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, LogOut, Menu, UserCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

import { Logo } from "@/components/brand/Logo";
import { cn } from "@/utils/cn";

import { useAdminAuth } from "../auth";
import { useFeedback } from "../ui/feedback";
import { ADMIN_NAVIGATION } from "./navigation";
import type { NavItem } from "./navigation";

function isActive(item: NavItem, pathname: string, search: string) {
  const [path] = item.to.split("?");
  if (item.match) return pathname === path && search.includes(item.match);
  if (path === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAdminAuth();
  const location = useLocation();
  return (
    <nav aria-label="Разделы админ-панели" className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link to="/admin" onClick={onNavigate} className="rounded-lg">
          <Logo />
        </Link>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 pt-2 pb-8">
        {ADMIN_NAVIGATION.map((group) => {
          const items = group.items.filter((item) => !item.permission || can(item.permission));
          if (!items.length) return null;
          return (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[0.65rem] font-bold tracking-[0.2em] text-milk-200/40 uppercase">{group.title}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(item, location.pathname, location.search);
                  const ItemIcon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                          active ? "bg-white/10 font-semibold text-white" : "text-milk-200/75 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <ItemIcon className={cn("h-4 w-4 shrink-0", active ? "text-sand-300" : "text-milk-200/50")} aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const { notifyError } = useFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.title = "Админ-панель — Kyrgyzstan-Tours";
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = "noindex, nofollow";
  }, []);

  useEffect(() => setOpen(false), [location.pathname, location.search]);

  const signOut = async () => {
    try {
      await logout();
      navigate("/admin/login", { replace: true });
    } catch (error) {
      notifyError(error);
    }
  };

  return (
    <div className="min-h-svh bg-milk-100">
      <aside className="dark-surface fixed inset-y-0 left-0 z-40 hidden w-72 bg-night-950 text-milk-50 lg:block">
        <Sidebar />
      </aside>
      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Закрыть меню" className="absolute inset-0 bg-night-950/60" onClick={() => setOpen(false)} />
            <motion.aside
              className="dark-surface absolute inset-y-0 left-0 w-[85%] max-w-xs bg-night-950 text-milk-50 shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <button type="button" aria-label="Закрыть меню" onClick={() => setOpen(false)} className="absolute top-4 right-3 rounded-full p-2 text-milk-100 hover:bg-white/10">
                <X className="h-5 w-5" aria-hidden />
              </button>
              <Sidebar onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-graphite-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button type="button" onClick={() => setOpen(true)} aria-label="Открыть меню" aria-expanded={open} className="rounded-full p-2 text-night-900 hover:bg-graphite-100 lg:hidden">
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <span className="hidden text-sm text-graphite-500 lg:block">Панель управления Kyrgyzstan-Tours</span>
          <div className="flex items-center gap-1 sm:gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-night-900 hover:bg-graphite-100">
              <ExternalLink className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Открыть сайт</span>
            </a>
            <Link to="/admin/profile" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-night-900 hover:bg-graphite-100">
              <UserCircle className="h-4 w-4" aria-hidden />
              <span className="hidden max-w-[10rem] truncate sm:inline">{user?.full_name}</span>
            </Link>
            <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-graphite-600 hover:bg-graphite-100 hover:text-night-900">
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </header>
        <main id="admin-main" className="px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

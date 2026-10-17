import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Box,
  CalendarRange,
  Compass,
  FileText,
  FolderTree,
  HelpCircle,
  Home,
  Image,
  Inbox,
  Info,
  Landmark,
  Languages,
  LayoutDashboard,
  Map,
  MessageSquareQuote,
  Phone,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserCog,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  match?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const ADMIN_NAVIGATION: NavGroup[] = [
  { title: "Обзор", items: [{ to: "/admin", label: "Дашборд", icon: LayoutDashboard }] },
  {
    title: "Контент сайта",
    items: [
      { to: "/admin/r/sections?page=home", label: "Главная страница", icon: Home, permission: "site_content.view_pagesection", match: "page=home" },
      { to: "/admin/r/sections?page=about", label: "Страница «О нас»", icon: Info, permission: "site_content.view_pagesection", match: "page=about" },
      { to: "/admin/r/regions", label: "Области Кыргызстана", icon: Map, permission: "geography.view_region" },
      { to: "/admin/r/attractions", label: "Достопримечательности", icon: Landmark, permission: "geography.view_attraction" },
      { to: "/admin/r/destinations", label: "Направления", icon: Compass, permission: "geography.view_destination" },
      { to: "/admin/r/tours", label: "Экскурсии", icon: Ticket, permission: "tours.view_tour" },
      { to: "/admin/r/routes", label: "Маршруты", icon: Route, permission: "tours.view_route" },
      { to: "/admin/settings/visual", label: "3D-сцены и эффекты", icon: Box, permission: "site_content.view_visualsettings" },
    ],
  },
  {
    title: "Люди",
    items: [
      { to: "/admin/r/guides", label: "Гиды", icon: Users, permission: "people.view_guide" },
      { to: "/admin/r/team", label: "Сотрудники и команда", icon: UsersRound, permission: "people.view_teammember" },
      { to: "/admin/founder", label: "Основной гид", icon: UserRound, permission: "people.view_founderprofile" },
    ],
  },
  {
    title: "Публикации",
    items: [
      { to: "/admin/r/reviews", label: "Отзывы", icon: MessageSquareQuote, permission: "reviews.view_review" },
      { to: "/admin/r/articles", label: "Блог и статьи", icon: BookOpen, permission: "blog.view_article" },
      { to: "/admin/r/article-categories", label: "Рубрики блога", icon: FolderTree, permission: "blog.view_articlecategory" },
      { to: "/admin/r/faq", label: "Вопросы и ответы", icon: HelpCircle, permission: "site_content.view_faqitem" },
      { to: "/admin/r/static-pages", label: "Правовые страницы", icon: FileText, permission: "site_content.view_staticpage" },
    ],
  },
  {
    title: "Медиа и заявки",
    items: [
      { to: "/admin/media", label: "Галерея и медиатека", icon: Image, permission: "media_library.view_mediaasset" },
      { to: "/admin/inquiries", label: "Заявки клиентов", icon: Inbox, permission: "inquiries.view_bookingrequest" },
    ],
  },
  {
    title: "Настройки",
    items: [
      { to: "/admin/settings/contacts", label: "Контакты", icon: Phone, permission: "site_content.view_sitesettings" },
      { to: "/admin/r/seo-pages", label: "SEO-настройки", icon: Search, permission: "site_content.view_seopage" },
      { to: "/admin/translations", label: "Переводы", icon: Languages, permission: "site_content.view_interfacestring" },
      { to: "/admin/settings/site", label: "Настройки сайта", icon: Settings, permission: "site_content.view_sitesettings" },
      { to: "/admin/r/seasons", label: "Сезоны", icon: CalendarRange, permission: "geography.view_season" },
      { to: "/admin/r/travel-styles", label: "Типы отдыха", icon: Sparkles, permission: "geography.view_travelstyle" },
      { to: "/admin/r/spoken-languages", label: "Языки гидов", icon: Languages, permission: "people.view_spokenlanguage" },
      { to: "/admin/r/users", label: "Пользователи", icon: UserCog, permission: "auth.view_user" },
      { to: "/admin/roles", label: "Роли и права", icon: ShieldCheck, permission: "auth.view_group" },
    ],
  },
];

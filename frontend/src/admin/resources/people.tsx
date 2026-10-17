import { BookOpen, CalendarRange, FileText, FolderTree, HelpCircle, Languages, MessageSquareQuote, Search, Sparkles, UserCog, Users, UsersRound } from "lucide-react";

import { ICON_NAMES } from "@/components/ui/Icon";

import { adminApi } from "../api";
import { DemoBadge } from "../ui/Primitives";
import { dateColumn, ratingColumn, statusColumn, textColumn, titleColumn, toggleColumn, translationsColumn } from "./columns";
import { LANGUAGE_OPTIONS, mediaSection, publishingFields, seoSection, slugField } from "./shared";
import type { ResourceConfig } from "./types";

export const guidesResource: ResourceConfig = {
  key: "guides",
  endpoint: "/admin/guides/",
  demoFilter: true,
  model: "people.guide",
  title: "Гиды",
  singular: "гид",
  icon: Users,
  orderable: true,
  translated: true,
  publicPath: (item) => `/guides/${item.slug}`,
  filters: [
    { key: "languages", label: "Язык", endpoint: "/admin/spoken-languages/" },
    { key: "regions", label: "Область", endpoint: "/admin/regions/" },
  ],
  columns: [titleColumn("photo"), textColumn("experience_years", "Опыт, лет", "experience_years"), translationsColumn, toggleColumn("is_featured", "На главной"), toggleColumn("is_published", "Опубликовано")],
  createDefaults: { is_published: true, experience_years: 1 },
  sections: [
    {
      title: "Профиль",
      fields: [
        { type: "text", name: "name", label: "Имя и фамилия", translated: true, required: true, maxLength: 120 },
        { type: "text", name: "headline", label: "Должность / специализация", translated: true, required: true, maxLength: 200 },
        { type: "text", name: "quote", label: "Цитата", translated: true, maxLength: 255, span: 2 },
        { type: "textarea", name: "bio", label: "Биография", translated: true, rows: 6 },
        { type: "lines", name: "specialization", label: "Направления работы", translated: true, help: "Каждый пункт с новой строки." },
        slugField,
        { type: "number", name: "experience_years", label: "Опыт, лет", min: 0, max: 60 },
      ],
    },
    {
      title: "Языки и регионы",
      fields: [
        { type: "relations", name: "languages", label: "Языки общения", endpoint: "/admin/spoken-languages/" },
        { type: "relations", name: "regions", label: "Регионы работы", endpoint: "/admin/regions/" },
        { type: "relations", name: "travel_styles", label: "Типы туров", endpoint: "/admin/travel-styles/" },
      ],
    },
    {
      title: "Контакты (не публикуются)",
      description: "Используются командой для связи; на сайте посетители пишут гиду через форму заявки.",
      fields: [
        { type: "email", name: "email", label: "Email", maxLength: 254 },
        { type: "text", name: "phone", label: "Телефон", maxLength: 40 },
        ...publishingFields({ featured: true }),
      ],
    },
    mediaSection("guides", "photo", false),
    seoSection(),
  ],
};

export const teamResource: ResourceConfig = {
  key: "team",
  endpoint: "/admin/team/",
  demoFilter: true,
  model: "people.teammember",
  title: "Сотрудники и команда",
  singular: "сотрудник",
  icon: UsersRound,
  orderable: true,
  translated: true,
  columns: [titleColumn("photo", "email"), translationsColumn, toggleColumn("is_published", "Опубликовано")],
  createDefaults: { is_published: true },
  sections: [
    {
      title: "Сотрудник",
      fields: [
        { type: "text", name: "name", label: "Имя и фамилия", translated: true, required: true, maxLength: 120 },
        { type: "text", name: "role", label: "Должность", translated: true, required: true, maxLength: 120 },
        { type: "textarea", name: "bio", label: "О сотруднике", translated: true, rows: 4 },
        { type: "email", name: "email", label: "Email", maxLength: 254 },
        ...publishingFields(),
      ],
    },
    mediaSection("team", "photo", false),
  ],
};

export const reviewsResource: ResourceConfig = {
  key: "reviews",
  endpoint: "/admin/reviews/",
  demoFilter: true,
  model: "reviews.review",
  title: "Отзывы",
  singular: "отзыв",
  icon: MessageSquareQuote,
  description: "Новые отзывы с сайта попадают сюда со статусом «На модерации» и публикуются только после одобрения.",
  translated: true,
  defaultOrdering: "-created_at",
  filters: [
    {
      key: "status",
      label: "Статус",
      options: [
        { value: "pending", label: "На модерации" },
        { value: "approved", label: "Опубликован" },
        { value: "rejected", label: "Отклонён" },
      ],
    },
    { key: "tour", label: "Экскурсия", endpoint: "/admin/tours/" },
  ],
  columns: [
    {
      key: "author_name",
      label: "Автор",
      ordering: "created_at",
      render: (item) => (
        <div>
          <div className="flex items-center gap-2 font-semibold text-night-900">
            {String(item.author_name)}
            {item.is_demo ? <DemoBadge /> : null}
          </div>
          <div className="text-xs text-graphite-500">{String(item.author_country || item.author_email || "")}</div>
        </div>
      ),
    },
    ratingColumn,
    statusColumn(),
    translationsColumn,
    toggleColumn("is_featured", "На главной"),
    dateColumn("created_at", "Получен"),
  ],
  bulkActions: [
    { label: "Опубликовать", run: (ids) => adminApi.setReviewStatus(ids, "approved") },
    { label: "Отклонить", run: (ids) => adminApi.setReviewStatus(ids, "rejected"), danger: true },
  ],
  createDefaults: { status: "approved", rating: 5, original_language: "ru" },
  sections: [
    {
      title: "Отзыв",
      fields: [
        {
          type: "select",
          name: "status",
          label: "Статус",
          options: [
            { value: "pending", label: "На модерации" },
            { value: "approved", label: "Опубликован" },
            { value: "rejected", label: "Отклонён" },
          ],
        },
        { type: "number", name: "rating", label: "Оценка (1–5)", required: true, min: 1, max: 5 },
        { type: "text", name: "title", label: "Заголовок", translated: true, maxLength: 200, span: 2 },
        { type: "textarea", name: "text", label: "Текст отзыва", translated: true, required: true, rows: 5 },
        { type: "select", name: "original_language", label: "Язык оригинала", options: LANGUAGE_OPTIONS },
        { type: "boolean", name: "is_featured", label: "Показывать на главной" },
        { type: "boolean", name: "is_demo", label: "Демонстрационный отзыв" },
      ],
    },
    {
      title: "Автор и поездка",
      fields: [
        { type: "text", name: "author_name", label: "Имя автора", required: true, maxLength: 120 },
        { type: "text", name: "author_country", label: "Страна", maxLength: 80 },
        { type: "email", name: "author_email", label: "Email (не публикуется)", maxLength: 254 },
        { type: "date", name: "travel_date", label: "Дата поездки" },
        { type: "relation", name: "tour", label: "Экскурсия", endpoint: "/admin/tours/" },
        { type: "relation", name: "guide", label: "Гид", endpoint: "/admin/guides/" },
        { type: "image", name: "avatar", label: "Фото автора (с его согласия)", folder: "reviews" },
      ],
    },
  ],
};

export const articlesResource: ResourceConfig = {
  key: "articles",
  endpoint: "/admin/articles/",
  demoFilter: true,
  model: "blog.article",
  title: "Блог и статьи",
  singular: "статья",
  icon: BookOpen,
  translated: true,
  defaultOrdering: "-published_at",
  publicPath: (item) => `/blog/${item.slug}`,
  filters: [
    {
      key: "status",
      label: "Статус",
      options: [
        { value: "draft", label: "Черновик" },
        { value: "published", label: "Опубликована" },
      ],
    },
    { key: "category", label: "Рубрика", endpoint: "/admin/article-categories/" },
  ],
  columns: [titleColumn("cover"), statusColumn(), dateColumn("published_at", "Дата публикации"), translationsColumn, toggleColumn("is_featured", "На главной")],
  createDefaults: { status: "draft" },
  sections: [
    {
      title: "Статья",
      fields: [
        { type: "text", name: "title", label: "Заголовок", translated: true, required: true, maxLength: 200, span: 2 },
        { type: "textarea", name: "excerpt", label: "Анонс", translated: true, rows: 3 },
        { type: "markdown", name: "body", label: "Текст статьи", translated: true, required: true, rows: 16 },
      ],
    },
    {
      title: "Публикация",
      fields: [
        {
          type: "select",
          name: "status",
          label: "Статус",
          options: [
            { value: "draft", label: "Черновик" },
            { value: "published", label: "Опубликована" },
          ],
        },
        { type: "datetime", name: "published_at", label: "Дата публикации", help: "Статья с датой в будущем появится на сайте автоматически в указанное время." },
        slugField,
        { type: "relation", name: "category", label: "Рубрика", endpoint: "/admin/article-categories/" },
        { type: "relation", name: "author", label: "Автор", endpoint: "/admin/team/" },
        { type: "relations", name: "related_tours", label: "Связанные экскурсии", endpoint: "/admin/tours/" },
        { type: "boolean", name: "is_featured", label: "Показывать на главной" },
        { type: "boolean", name: "is_demo", label: "Демонстрационная статья" },
      ],
    },
    mediaSection("blog", "cover", false),
    seoSection(),
  ],
};

export const articleCategoriesResource: ResourceConfig = {
  key: "article-categories",
  endpoint: "/admin/article-categories/",
  model: "blog.articlecategory",
  title: "Рубрики блога",
  singular: "рубрика",
  icon: FolderTree,
  orderable: true,
  translated: true,
  columns: [titleColumn(), translationsColumn],
  sections: [
    {
      title: "Рубрика",
      fields: [
        { type: "text", name: "name", label: "Название", translated: true, required: true, maxLength: 80 },
        { type: "textarea", name: "description", label: "Описание", translated: true, rows: 3 },
        { ...slugField, maxLength: 80 },
      ],
    },
  ],
};

export const faqResource: ResourceConfig = {
  key: "faq",
  endpoint: "/admin/faq/",
  model: "site_content.faqitem",
  title: "Вопросы и ответы",
  singular: "вопрос",
  icon: HelpCircle,
  orderable: true,
  translated: true,
  filters: [
    {
      key: "category",
      label: "Раздел",
      options: [
        { value: "general", label: "Общие" },
        { value: "booking", label: "Бронирование" },
        { value: "travel", label: "Поездка" },
        { value: "safety", label: "Безопасность" },
      ],
    },
  ],
  columns: [titleColumn(undefined, "category"), translationsColumn, toggleColumn("is_published", "Опубликовано")],
  createDefaults: { is_published: true, category: "general" },
  sections: [
    {
      title: "Вопрос",
      fields: [
        { type: "text", name: "question", label: "Вопрос", translated: true, required: true, maxLength: 255, span: 2 },
        { type: "textarea", name: "answer", label: "Ответ", translated: true, required: true, rows: 5 },
        {
          type: "select",
          name: "category",
          label: "Раздел",
          options: [
            { value: "general", label: "Общие" },
            { value: "booking", label: "Бронирование" },
            { value: "travel", label: "Поездка" },
            { value: "safety", label: "Безопасность" },
          ],
        },
        ...publishingFields(),
      ],
    },
  ],
};

export const staticPagesResource: ResourceConfig = {
  key: "static-pages",
  endpoint: "/admin/static-pages/",
  model: "site_content.staticpage",
  title: "Правовые страницы",
  singular: "страница",
  icon: FileText,
  translated: true,
  defaultOrdering: "slug",
  publicPath: (item) => `/${item.slug}`,
  columns: [titleColumn(), translationsColumn, toggleColumn("is_published", "Опубликовано"), dateColumn("updated_at", "Изменено")],
  createDefaults: { is_published: true },
  sections: [
    {
      title: "Страница",
      fields: [
        { type: "text", name: "title", label: "Заголовок", translated: true, required: true, maxLength: 200, span: 2 },
        { type: "markdown", name: "body", label: "Текст", translated: true, required: true, rows: 18 },
        { ...slugField, required: true, help: "privacy — политика конфиденциальности, terms — пользовательское соглашение." },
        { type: "boolean", name: "is_published", label: "Опубликовано" },
      ],
    },
    seoSection(),
  ],
};

const SEO_KEYS = [
  { value: "home", label: "Главная" },
  { value: "destinations", label: "Направления" },
  { value: "regions", label: "Области" },
  { value: "tours", label: "Экскурсии" },
  { value: "routes", label: "Маршруты" },
  { value: "guides", label: "Гиды" },
  { value: "about", label: "О нас" },
  { value: "reviews", label: "Отзывы" },
  { value: "blog", label: "Блог" },
  { value: "contact", label: "Контакты" },
  { value: "faq", label: "Вопросы" },
  { value: "credits", label: "Авторы фото" },
];

export const seoResource: ResourceConfig = {
  key: "seo-pages",
  endpoint: "/admin/seo-pages/",
  model: "site_content.seopage",
  title: "SEO-настройки",
  singular: "SEO-запись",
  icon: Search,
  description: "Заголовки и описания для поисковых систем и соцсетей на каждом языке. Страницы экскурсий, гидов и статей имеют собственные SEO-поля.",
  translated: true,
  defaultOrdering: "key",
  publicPath: (item) => (item.key === "home" ? "/" : `/${item.key}`),
  columns: [
    { key: "key", label: "Страница", ordering: "key", render: (item) => <span className="font-semibold text-night-900">{SEO_KEYS.find((entry) => entry.value === item.key)?.label ?? String(item.key)}</span> },
    { key: "display_name", label: "Заголовок", render: (item) => <span className="text-graphite-700">{String(item.display_name)}</span> },
    translationsColumn,
    toggleColumn("no_index", "Скрыть от поиска"),
  ],
  sections: [
    {
      title: "Метаданные",
      fields: [
        { type: "select", name: "key", label: "Страница", options: SEO_KEYS, required: true },
        { type: "boolean", name: "no_index", label: "Запретить индексацию" },
        { type: "text", name: "title", label: "Title", translated: true, required: true, maxLength: 120, span: 2, help: "Оптимально до 60 символов." },
        { type: "textarea", name: "description", label: "Meta description", translated: true, required: true, maxLength: 320, rows: 3, help: "Оптимально 120–160 символов." },
        { type: "text", name: "keywords", label: "Ключевые слова", translated: true, maxLength: 255, span: 2 },
        { type: "image", name: "og_image", label: "Изображение для соцсетей (Open Graph)", folder: "seo" },
      ],
    },
  ],
};

export const seasonsResource: ResourceConfig = {
  key: "seasons",
  endpoint: "/admin/seasons/",
  model: "geography.season",
  title: "Сезоны",
  singular: "сезон",
  icon: CalendarRange,
  orderable: true,
  translated: true,
  columns: [titleColumn("image", "code"), textColumn("months", "Месяцы"), translationsColumn],
  sections: [
    {
      title: "Сезон",
      fields: [
        { type: "text", name: "name", label: "Название", translated: true, required: true, maxLength: 60 },
        { type: "slug", name: "code", label: "Код", required: true, maxLength: 20 },
        { type: "text", name: "months", label: "Месяцы", help: "Номера месяцев через запятую, например 6,7,8.", maxLength: 40 },
        { type: "textarea", name: "description", label: "Описание", translated: true, rows: 3 },
        { type: "lines", name: "highlights", label: "Главное в сезоне", translated: true, help: "Каждый пункт с новой строки." },
        { type: "image", name: "image", label: "Изображение", folder: "seasons" },
      ],
    },
  ],
};

export const travelStylesResource: ResourceConfig = {
  key: "travel-styles",
  endpoint: "/admin/travel-styles/",
  model: "geography.travelstyle",
  title: "Типы отдыха",
  singular: "тип отдыха",
  icon: Sparkles,
  orderable: true,
  translated: true,
  columns: [titleColumn(), textColumn("icon", "Иконка"), translationsColumn],
  sections: [
    {
      title: "Тип отдыха",
      fields: [
        { type: "text", name: "name", label: "Название", translated: true, required: true, maxLength: 80 },
        { type: "textarea", name: "description", label: "Описание", translated: true, rows: 2 },
        { ...slugField, maxLength: 60 },
        { type: "select", name: "icon", label: "Иконка", allowEmpty: true, options: ICON_NAMES.map((name) => ({ value: name, label: name })) },
      ],
    },
  ],
};

export const spokenLanguagesResource: ResourceConfig = {
  key: "spoken-languages",
  endpoint: "/admin/spoken-languages/",
  model: "people.spokenlanguage",
  title: "Языки гидов",
  singular: "язык",
  icon: Languages,
  orderable: true,
  translated: true,
  columns: [titleColumn(undefined, "code"), translationsColumn],
  sections: [
    {
      title: "Язык",
      fields: [
        { type: "text", name: "name", label: "Название языка", translated: true, required: true, maxLength: 60 },
        { type: "slug", name: "code", label: "Код ISO (например, de)", required: true, maxLength: 10 },
      ],
    },
  ],
};

export const usersResource: ResourceConfig = {
  key: "users",
  endpoint: "/admin/users/",
  model: "auth.user",
  title: "Пользователи",
  singular: "пользователь",
  icon: UserCog,
  description: "Доступ в админ-панель имеют только активные пользователи с отметкой «Сотрудник». Права определяются ролями.",
  defaultOrdering: "username",
  columns: [
    {
      key: "username",
      label: "Логин",
      ordering: "username",
      render: (item) => (
        <div>
          <div className="font-semibold text-night-900">{String(item.username)}</div>
          <div className="text-xs text-graphite-500">{String(item.email || "")}</div>
        </div>
      ),
    },
    textColumn("display_name", "Имя"),
    { key: "is_superuser", label: "Суперпользователь", render: (item) => (item.is_superuser ? "Да" : "—") },
    toggleColumn("is_active", "Активен"),
    dateColumn("last_login", "Последний вход", true),
  ],
  createDefaults: { is_active: true, is_staff: true },
  sections: [
    {
      title: "Учётная запись",
      fields: [
        { type: "text", name: "username", label: "Логин", required: true, maxLength: 150 },
        { type: "email", name: "email", label: "Email", maxLength: 254 },
        { type: "text", name: "first_name", label: "Имя", maxLength: 150 },
        { type: "text", name: "last_name", label: "Фамилия", maxLength: 150 },
        { type: "password", name: "password", label: "Пароль", required: true, help: "Минимум 10 символов. При редактировании оставьте пустым, чтобы не менять пароль. Пароль хранится только в зашифрованном виде." },
      ],
    },
    {
      title: "Доступ",
      fields: [
        { type: "boolean", name: "is_active", label: "Активен" },
        { type: "boolean", name: "is_staff", label: "Доступ в админ-панель" },
        { type: "boolean", name: "is_superuser", label: "Суперпользователь (все права)", help: "Назначать может только суперпользователь." },
        { type: "relations", name: "groups", label: "Роли", endpoint: "/admin/roles/" },
      ],
    },
  ],
};

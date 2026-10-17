import { LANGUAGE_OPTIONS } from "./shared";
import type { FormSection } from "./types";

export interface SingletonConfig {
  key: string;
  endpoint: string;
  model: string;
  title: string;
  description?: string;
  sections: FormSection[];
}

export const siteSettingsSingleton: SingletonConfig = {
  key: "site",
  endpoint: "/admin/site-settings/",
  model: "site_content.sitesettings",
  title: "Настройки сайта",
  description: "Название, логотип, язык по умолчанию и тексты футера.",
  sections: [
    {
      title: "Бренд",
      fields: [
        { type: "text", name: "site_name", label: "Название сайта", required: true, maxLength: 80, help: "Если логотип не загружен, название выводится рядом со знаком." },
        { type: "select", name: "default_language", label: "Язык по умолчанию", options: LANGUAGE_OPTIONS },
        { type: "text", name: "tagline", label: "Слоган", translated: true, maxLength: 200, span: 2 },
        { type: "image", name: "logo", label: "Логотип (PNG/SVG-подобный WebP, прозрачный фон)", folder: "brand" },
        { type: "image", name: "default_og_image", label: "Изображение по умолчанию для соцсетей", folder: "brand" },
      ],
    },
    {
      title: "Футер",
      fields: [
        { type: "textarea", name: "footer_text", label: "Текст в футере", translated: true, rows: 3 },
        { type: "text", name: "copyright", label: "Копирайт", translated: true, maxLength: 200, span: 2 },
      ],
    },
  ],
};

export const contactsSingleton: SingletonConfig = {
  key: "contacts",
  endpoint: "/admin/site-settings/",
  model: "site_content.sitesettings",
  title: "Контакты",
  description: "Контактные данные выводятся в шапке, футере, на странице контактов и странице «О нас».",
  sections: [
    {
      title: "Связь",
      fields: [
        { type: "email", name: "email", label: "Email", maxLength: 254 },
        { type: "text", name: "phone", label: "Телефон", maxLength: 40 },
        { type: "text", name: "whatsapp", label: "WhatsApp (номер)", maxLength: 40 },
        { type: "text", name: "telegram", label: "Telegram (@имя)", maxLength: 80 },
      ],
    },
    {
      title: "Социальные сети",
      fields: [
        { type: "url", name: "instagram_url", label: "Instagram", maxLength: 200 },
        { type: "url", name: "facebook_url", label: "Facebook", maxLength: 200 },
        { type: "url", name: "youtube_url", label: "YouTube", maxLength: 200 },
      ],
    },
    {
      title: "Офис",
      fields: [
        { type: "text", name: "address", label: "Адрес", translated: true, maxLength: 255, span: 2 },
        { type: "text", name: "working_hours", label: "Часы работы", translated: true, maxLength: 160, span: 2 },
        { type: "decimal", name: "office_latitude", label: "Широта офиса", min: -90, max: 90, step: 0.000001 },
        { type: "decimal", name: "office_longitude", label: "Долгота офиса", min: -180, max: 180, step: 0.000001 },
      ],
    },
  ],
};

export const founderSingleton: SingletonConfig = {
  key: "founder",
  endpoint: "/admin/founder/",
  model: "people.founderprofile",
  title: "Основной гид и основатель",
  description: "Блок на главной странице и на странице «О нас».",
  sections: [
    {
      title: "Профиль",
      fields: [
        { type: "text", name: "name", label: "Имя и фамилия", translated: true, required: true, maxLength: 120 },
        { type: "text", name: "role", label: "Роль", translated: true, required: true, maxLength: 120 },
        { type: "text", name: "headline", label: "Главная фраза", translated: true, maxLength: 200, span: 2 },
        { type: "textarea", name: "bio", label: "Биография", translated: true, rows: 6 },
        { type: "textarea", name: "quote", label: "Цитата", translated: true, rows: 3 },
        { type: "textarea", name: "mission", label: "Миссия", translated: true, rows: 3 },
      ],
    },
    {
      title: "Дополнительно",
      fields: [
        { type: "image", name: "photo", label: "Фотография", folder: "team" },
        { type: "number", name: "experience_years", label: "Опыт, лет", min: 0, max: 70 },
        { type: "relation", name: "guide", label: "Профиль гида на сайте", endpoint: "/admin/guides/" },
        { type: "boolean", name: "is_visible", label: "Показывать на сайте" },
        { type: "boolean", name: "is_demo", label: "Демонстрационный профиль" },
      ],
    },
  ],
};

export const visualSingleton: SingletonConfig = {
  key: "visual",
  endpoint: "/admin/visual-settings/",
  model: "site_content.visualsettings",
  title: "3D-сцены и визуальные эффекты",
  description: "Эффекты автоматически отключаются у посетителей с включённым «уменьшением движения» и на слабых устройствах.",
  sections: [
    {
      title: "Эффекты",
      fields: [
        { type: "boolean", name: "enable_3d", label: "3D-путешествие (WebGL)" },
        { type: "boolean", name: "enable_parallax", label: "Параллакс" },
        { type: "boolean", name: "enable_scroll_animations", label: "Анимации появления при прокрутке" },
        { type: "boolean", name: "enable_hero_video", label: "Фоновое видео на первом экране" },
        { type: "boolean", name: "enable_map_animations", label: "Анимация карты" },
        {
          type: "select",
          name: "scene_quality",
          label: "Качество 3D-сцены",
          options: [
            { value: "low", label: "Низкое — для слабых устройств" },
            { value: "medium", label: "Среднее — облегчённые текстуры" },
            { value: "high", label: "Высокое — максимальная детализация" },
          ],
        },
        { type: "range", name: "parallax_intensity", label: "Сила параллакса", min: 0, max: 100 },
        { type: "range", name: "hero_overlay_opacity", label: "Затемнение первого экрана, %", min: 0, max: 90 },
      ],
    },
  ],
};

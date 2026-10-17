import type { FieldConfig, FormSection, TextFieldConfig } from "./types";

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Лёгкий" },
  { value: "moderate", label: "Средний" },
  { value: "challenging", label: "Сложный" },
  { value: "expert", label: "Экспертный" },
];

export const LANGUAGE_OPTIONS = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "ky", label: "Кыргызча" },
];

export const REGION_CODE_OPTIONS = [
  { value: "chuy", label: "Чуйская область" },
  { value: "talas", label: "Таласская область" },
  { value: "issyk-kul", label: "Иссык-Кульская область" },
  { value: "naryn", label: "Нарынская область" },
  { value: "jalal-abad", label: "Джалал-Абадская область" },
  { value: "osh", label: "Ошская область" },
  { value: "batken", label: "Баткенская область" },
];

export const ATTRACTION_KIND_OPTIONS = [
  { value: "lake", label: "Озеро" },
  { value: "mountain", label: "Гора" },
  { value: "canyon", label: "Каньон" },
  { value: "gorge", label: "Ущелье" },
  { value: "national_park", label: "Национальный парк" },
  { value: "historical", label: "Исторический памятник" },
  { value: "cultural", label: "Культурное место" },
  { value: "natural_monument", label: "Памятник природы" },
  { value: "forest", label: "Лес" },
];

export const SECTION_LABELS: Record<string, string> = {
  hero: "Первый экран",
  regions: "Карта областей",
  journey: "3D-путешествие",
  destinations: "Популярные направления",
  tours: "Лучшие экскурсии",
  guides: "Гиды",
  routes: "Маршруты",
  seasons: "Календарь сезонов",
  culture: "Культурное наследие",
  nature: "Природа и приключения",
  stories: "Истории и блог",
  testimonials: "Отзывы",
  founder: "Основатель",
  advantages: "Преимущества",
  cta: "Призыв к действию",
  newsletter: "Рассылка",
  about_hero: "Обложка страницы",
  about_story: "История",
  about_mission: "Миссия",
  about_principles: "Принципы",
  about_founder: "Основатель",
  about_team: "Команда",
  about_contacts: "Контакты",
};

export const slugField: TextFieldConfig = {
  type: "slug",
  name: "slug",
  label: "Адрес страницы (slug)",
  maxLength: 120,
  help: "Латиница, цифры и дефисы. Оставьте пустым — адрес будет создан автоматически из названия.",
};

export function seoSection(): FormSection {
  return {
    title: "SEO",
    description: "Если оставить пустым, используются название и краткое описание.",
    fields: [
      { type: "text", name: "seo_title", label: "SEO-заголовок", translated: true, maxLength: 120, span: 2 },
      { type: "textarea", name: "seo_description", label: "SEO-описание", translated: true, maxLength: 320, rows: 3 },
    ],
  };
}

export function publishingFields(options: { featured?: boolean; demo?: boolean } = {}): FieldConfig[] {
  const fields: FieldConfig[] = [{ type: "boolean", name: "is_published", label: "Опубликовано", help: "Скрытые записи не видны на сайте, но доступны в предпросмотре." }];
  if (options.featured) fields.push({ type: "boolean", name: "is_featured", label: "Показывать на главной" });
  if (options.demo !== false) fields.push({ type: "boolean", name: "is_demo", label: "Демонстрационная запись", help: "Пометка для команды: такие записи нужно заменить реальными данными." });
  return fields;
}

export function mediaSection(folder: string, cover = "cover", gallery = true): FormSection {
  const fields: FieldConfig[] = [{ type: "image", name: cover, label: cover === "photo" ? "Фотография" : "Обложка", folder }];
  if (gallery) fields.push({ type: "gallery", name: "gallery", label: "Галерея", folder, help: "Порядок фотографий можно менять стрелками." });
  return { title: "Фотографии", fields };
}

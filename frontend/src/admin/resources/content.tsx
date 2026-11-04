import { Box, Compass, Landmark, Map, MapPinned, Route as RouteIcon, Ticket } from "lucide-react";

import { ICON_NAMES } from "@/components/ui/Icon";

import { dateColumn, textColumn, titleColumn, toggleColumn, translationsColumn } from "./columns";
import { ATTRACTION_KIND_OPTIONS, DIFFICULTY_OPTIONS, mediaSection, publishingFields, REGION_CODE_OPTIONS, SECTION_LABELS, seoSection, slugField } from "./shared";
import type { FieldConfig, ResourceConfig } from "./types";

export const regionsResource: ResourceConfig = {
  key: "regions",
  endpoint: "/admin/regions/",
  demoFilter: true,
  model: "geography.region",
  title: "Области Кыргызстана",
  singular: "область",
  icon: Map,
  description: "Семь областей страны: тексты, карта, сезоны и галереи. Код карты связывает запись с контуром на интерактивной карте.",
  orderable: true,
  translated: true,
  allowCreate: false,
  allowDelete: false,
  publicPath: (item) => `/regions/${item.slug}`,
  columns: [titleColumn("cover"), textColumn("map_code", "Код карты"), translationsColumn, toggleColumn("is_published", "Опубликовано"), dateColumn("updated_at", "Изменено")],
  sections: [
    {
      title: "Основное",
      fields: [
        { type: "text", name: "name", label: "Название", translated: true, required: true, maxLength: 120 },
        { type: "text", name: "tagline", label: "Короткий слоган", translated: true, maxLength: 200 },
        slugField,
        { type: "select", name: "map_code", label: "Контур на карте", options: REGION_CODE_OPTIONS, required: true },
        { type: "color", name: "accent_color", label: "Цвет на карте" },
        { type: "number", name: "area_km2", label: "Площадь, км²", min: 0 },
        { type: "number", name: "recommended_days_min", label: "Рекомендуемо дней: от", min: 1, max: 60, required: true },
        { type: "number", name: "recommended_days_max", label: "Рекомендуемо дней: до", min: 1, max: 60, required: true },
        { type: "relations", name: "seasons", label: "Лучшие сезоны", endpoint: "/admin/seasons/" },
        ...publishingFields({ demo: false }),
      ],
    },
    {
      title: "Описание",
      fields: [
        { type: "textarea", name: "description", label: "Описание", translated: true, required: true, rows: 5 },
        { type: "textarea", name: "nature", label: "Природные особенности", translated: true, rows: 3 },
        { type: "lines", name: "highlights", label: "Главные достопримечательности", translated: true, help: "Каждый пункт с новой строки." },
        { type: "text", name: "key_places", label: "Основные города и места", translated: true, maxLength: 255, span: 2 },
      ],
    },
    mediaSection("regions"),
    seoSection(),
  ],
};

export const attractionsResource: ResourceConfig = {
  key: "attractions",
  endpoint: "/admin/attractions/",
  demoFilter: true,
  model: "geography.attraction",
  title: "Достопримечательности",
  singular: "достопримечательность",
  icon: Landmark,
  orderable: true,
  translated: true,
  searchPlaceholder: "Название или slug…",
  publicPath: (item) => `/attractions/${item.slug}`,
  filters: [
    { key: "region", label: "Область", endpoint: "/admin/regions/" },
    { key: "kind", label: "Тип", options: ATTRACTION_KIND_OPTIONS },
  ],
  columns: [titleColumn("cover"), textColumn("kind", "Тип", "kind", (value) => ATTRACTION_KIND_OPTIONS.find((option) => option.value === value)?.label ?? String(value)), translationsColumn, toggleColumn("is_featured", "На главной"), toggleColumn("is_published", "Опубликовано")],
  createDefaults: { is_published: true, kind: "natural_monument" },
  sections: [
    {
      title: "Основное",
      fields: [
        { type: "text", name: "name", label: "Название", translated: true, required: true, maxLength: 160 },
        { type: "text", name: "tagline", label: "Короткое описание", translated: true, maxLength: 200 },
        slugField,
        { type: "relation", name: "region", label: "Область", endpoint: "/admin/regions/", required: true },
        { type: "relation", name: "destination", label: "Направление", endpoint: "/admin/destinations/", help: "Направление должно относиться к той же области." },
        { type: "select", name: "kind", label: "Тип", options: ATTRACTION_KIND_OPTIONS, required: true },
        { type: "relations", name: "seasons", label: "Сезоны", endpoint: "/admin/seasons/" },
        ...publishingFields({ featured: true }),
      ],
    },
    {
      title: "Описание",
      fields: [
        { type: "textarea", name: "description", label: "Описание", translated: true, required: true, rows: 5 },
        { type: "lines", name: "visitor_info", label: "Полезная информация для посетителей", translated: true, help: "Каждый пункт с новой строки." },
      ],
    },
    {
      title: "Расположение",
      description: "Координаты используются для отметки на карте и ссылки на OpenStreetMap.",
      fields: [
        { type: "decimal", name: "latitude", label: "Широта", min: -90, max: 90, step: 0.000001 },
        { type: "decimal", name: "longitude", label: "Долгота", min: -180, max: 180, step: 0.000001 },
        { type: "number", name: "altitude_m", label: "Высота, м", min: 0, max: 8000 },
      ],
    },
    mediaSection("attractions"),
    seoSection(),
  ],
};

export const destinationsResource: ResourceConfig = {
  key: "destinations",
  endpoint: "/admin/destinations/",
  demoFilter: true,
  model: "geography.destination",
  title: "Направления",
  singular: "направление",
  icon: Compass,
  orderable: true,
  translated: true,
  publicPath: (item) => `/destinations/${item.slug}`,
  filters: [{ key: "region", label: "Область", endpoint: "/admin/regions/" }],
  columns: [titleColumn("cover"), translationsColumn, toggleColumn("is_featured", "На главной"), toggleColumn("is_published", "Опубликовано"), dateColumn("updated_at", "Изменено")],
  createDefaults: { is_published: true },
  sections: [
    {
      title: "Основное",
      fields: [
        { type: "text", name: "name", label: "Название", translated: true, required: true, maxLength: 160 },
        { type: "text", name: "tagline", label: "Слоган", translated: true, maxLength: 200 },
        slugField,
        { type: "relation", name: "region", label: "Область", endpoint: "/admin/regions/", required: true },
        { type: "relations", name: "travel_styles", label: "Типы отдыха", endpoint: "/admin/travel-styles/" },
        { type: "relations", name: "seasons", label: "Сезоны", endpoint: "/admin/seasons/" },
        ...publishingFields({ featured: true }),
      ],
    },
    {
      title: "Описание",
      fields: [
        { type: "textarea", name: "summary", label: "Краткое описание", translated: true, required: true, rows: 3 },
        { type: "textarea", name: "description", label: "Подробное описание", translated: true, rows: 6 },
        { type: "decimal", name: "latitude", label: "Широта", min: -90, max: 90, step: 0.000001 },
        { type: "decimal", name: "longitude", label: "Долгота", min: -180, max: 180, step: 0.000001 },
      ],
    },
    mediaSection("destinations"),
    seoSection(),
  ],
};

export const toursResource: ResourceConfig = {
  key: "tours",
  endpoint: "/admin/tours/",
  demoFilter: true,
  model: "tours.tour",
  title: "Экскурсии",
  singular: "экскурсия",
  icon: Ticket,
  orderable: true,
  translated: true,
  publicPath: (item) => `/tours/${item.slug}`,
  filters: [
    { key: "region", label: "Область", endpoint: "/admin/regions/" },
    { key: "guide", label: "Гид", endpoint: "/admin/guides/" },
    { key: "difficulty", label: "Сложность", options: DIFFICULTY_OPTIONS },
  ],
  columns: [
    titleColumn("cover"),
    textColumn("price", "Цена", "price", (value, item) => `${Number(value).toLocaleString("ru-RU")} ${String(item.currency)}`),
    textColumn("duration_days", "Дней", "duration_days"),
    translationsColumn,
    toggleColumn("is_featured", "На главной"),
    toggleColumn("is_published", "Опубликовано"),
  ],
  createDefaults: { is_published: true, currency: "USD", difficulty: "moderate", duration_days: 1, group_size_min: 1, group_size_max: 8 },
  sections: [
    {
      title: "Основное",
      fields: [
        { type: "text", name: "title", label: "Название", translated: true, required: true, maxLength: 160 },
        { type: "text", name: "tagline", label: "Слоган", translated: true, maxLength: 200 },
        { type: "textarea", name: "summary", label: "Краткое описание для карточки", translated: true, required: true, rows: 3 },
        slugField,
        { type: "relation", name: "region", label: "Основная область", endpoint: "/admin/regions/", required: true },
        { type: "relation", name: "guide", label: "Гид", endpoint: "/admin/guides/" },
        { type: "relation", name: "route", label: "Маршрут", endpoint: "/admin/routes/" },
        { type: "relations", name: "destinations", label: "Направления", endpoint: "/admin/destinations/" },
        { type: "relations", name: "attractions", label: "Достопримечательности", endpoint: "/admin/attractions/" },
        { type: "relations", name: "travel_styles", label: "Типы отдыха", endpoint: "/admin/travel-styles/" },
        { type: "relations", name: "seasons", label: "Сезоны", endpoint: "/admin/seasons/" },
        ...publishingFields({ featured: true }),
      ],
    },
    {
      title: "Стоимость и параметры",
      fields: [
        { type: "decimal", name: "price", label: "Цена от, за человека", required: true, min: 0 },
        {
          type: "select",
          name: "currency",
          label: "Валюта",
          options: [
            { value: "USD", label: "USD" },
            { value: "EUR", label: "EUR" },
            { value: "KGS", label: "KGS (сом)" },
          ],
        },
        { type: "number", name: "duration_days", label: "Продолжительность, дней", required: true, min: 1, max: 60 },
        { type: "select", name: "difficulty", label: "Сложность", options: DIFFICULTY_OPTIONS },
        { type: "number", name: "group_size_min", label: "Группа: минимум", required: true, min: 1, max: 100 },
        { type: "number", name: "group_size_max", label: "Группа: максимум", required: true, min: 1, max: 100 },
      ],
    },
    {
      title: "Описание программы",
      fields: [
        { type: "textarea", name: "description", label: "Описание", translated: true, rows: 6 },
        { type: "lines", name: "included", label: "Что включено", translated: true, help: "Каждый пункт с новой строки." },
        { type: "lines", name: "excluded", label: "Что не включено", translated: true, help: "Каждый пункт с новой строки." },
        { type: "text", name: "meeting_point", label: "Место встречи", translated: true, maxLength: 255, span: 2 },
      ],
    },
    {
      title: "Маршрут по дням",
      description: "Количество дней не может превышать продолжительность тура.",
      fields: [
        {
          type: "inline",
          name: "days",
          label: "Дни программы",
          itemLabel: "День",
          maxItems: 60,
          fields: [
            { type: "text", name: "title", label: "Заголовок дня", translated: true, required: true, maxLength: 200, span: 2 },
            { type: "textarea", name: "description", label: "Описание", translated: true, rows: 3 },
            { type: "text", name: "accommodation", label: "Проживание", translated: true, maxLength: 200 },
            { type: "text", name: "meals", label: "Питание", translated: true, maxLength: 120 },
          ],
        },
      ],
    },
    mediaSection("tours"),
    seoSection(),
  ],
};

export const routesResource: ResourceConfig = {
  key: "routes",
  endpoint: "/admin/routes/",
  demoFilter: true,
  model: "tours.route",
  title: "Маршруты",
  singular: "маршрут",
  icon: RouteIcon,
  orderable: true,
  translated: true,
  publicPath: (item) => `/routes/${item.slug}`,
  columns: [titleColumn("cover"), textColumn("distance_km", "Км", "distance_km"), textColumn("duration_days", "Дней", "duration_days"), translationsColumn, toggleColumn("is_featured", "На главной"), toggleColumn("is_published", "Опубликовано")],
  createDefaults: { is_published: true, difficulty: "moderate", duration_days: 1, distance_km: 0 },
  sections: [
    {
      title: "Основное",
      fields: [
        { type: "text", name: "title", label: "Название", translated: true, required: true, maxLength: 160 },
        { type: "textarea", name: "summary", label: "Краткое описание", translated: true, required: true, rows: 3 },
        { type: "textarea", name: "description", label: "Подробное описание", translated: true, rows: 5 },
        slugField,
        { type: "relations", name: "regions", label: "Области", endpoint: "/admin/regions/" },
        { type: "number", name: "distance_km", label: "Протяжённость, км", min: 0, max: 10000 },
        { type: "number", name: "duration_days", label: "Продолжительность, дней", min: 1, max: 60, required: true },
        { type: "select", name: "difficulty", label: "Сложность", options: DIFFICULTY_OPTIONS },
        ...publishingFields({ featured: true }),
      ],
    },
    {
      title: "Остановки",
      description: "Остановки отображаются на карте в указанном порядке.",
      fields: [
        {
          type: "inline",
          name: "stops",
          label: "Остановки маршрута",
          itemLabel: "Остановка",
          fields: [
            { type: "text", name: "title", label: "Название", translated: true, required: true, maxLength: 160 },
            { type: "relation", name: "attraction", label: "Достопримечательность", endpoint: "/admin/attractions/" },
            { type: "decimal", name: "latitude", label: "Широта", required: true, min: -90, max: 90, step: 0.000001 },
            { type: "decimal", name: "longitude", label: "Долгота", required: true, min: -180, max: 180, step: 0.000001 },
            { type: "number", name: "nights", label: "Ночёвок", min: 0, max: 30 },
            { type: "textarea", name: "description", label: "Описание", translated: true, rows: 2 },
          ],
        },
      ],
    },
    mediaSection("routes", "cover", false),
    seoSection(),
  ],
};

export const scenesResource: ResourceConfig = {
  key: "scenes",
  endpoint: "/admin/scenes/",
  demoFilter: true,
  model: "geography.journeyscene",
  title: "3D-сцены",
  singular: "3D-сцена",
  icon: Box,
  description:
    "Места для блока «Полёт над горами». Рельеф строится по цифровой модели высот Copernicus DEM, поверхность — по летнему снимку спутника Sentinel-2. Файлы рельефа готовит команда python manage.py build_scene_terrain <slug>.",
  orderable: true,
  translated: true,
  columns: [titleColumn("photo"), textColumn("terrain_size_km", "Площадь, км"), translationsColumn, toggleColumn("is_published", "Опубликовано")],
  createDefaults: { is_published: true, sky_color: "#5f90c2", fog_color: "#cdd8df", terrain_size_km: 30, terrain_exaggeration: 1.3, camera_heading: 0, camera_motion: "orbit" },
  sections: [
    {
      title: "Тексты",
      fields: [
        { type: "text", name: "title", label: "Название", translated: true, required: true, maxLength: 160 },
        { type: "text", name: "subtitle", label: "Подзаголовок", translated: true, maxLength: 200 },
        { type: "textarea", name: "description", label: "Описание", translated: true, rows: 3 },
        { type: "text", name: "cta_label", label: "Текст кнопки", translated: true, maxLength: 60 },
        slugField,
        { type: "relation", name: "attraction", label: "Достопримечательность", endpoint: "/admin/attractions/", help: "Фото, маршруты и ссылка берутся из достопримечательности." },
        ...publishingFields(),
      ],
    },
    {
      title: "Реальный рельеф",
      description:
        "Чтобы построить рельеф, задайте центр и размер участка, сохраните сцену и выполните на сервере python manage.py build_scene_terrain <slug> (нужны пакеты из requirements-terrain.txt и доступ в интернет). Команда скачает данные Copernicus, выберет безоблачный снимок и сама заполнит поля ниже.",
      fields: [
        { type: "decimal", name: "terrain_latitude", label: "Широта центра", min: -85, max: 85, step: 0.0001, help: "Если пусто — берутся координаты достопримечательности." },
        { type: "decimal", name: "terrain_longitude", label: "Долгота центра", min: -180, max: 180, step: 0.0001 },
        { type: "number", name: "terrain_size_km", label: "Сторона участка, км", min: 2, max: 120, step: 1, help: "24–44 км дают максимальную чёткость снимка." },
        { type: "range", name: "terrain_exaggeration", label: "Усиление высоты гор", min: 0.5, max: 4, step: 0.05, help: "1 — реальные пропорции." },
        { type: "range", name: "camera_heading", label: "Направление взгляда камеры, °", min: 0, max: 359, step: 1, help: "0 — на север, 90 — на восток, 180 — на юг." },
        {
          type: "select",
          name: "camera_motion",
          label: "Движение камеры при прокрутке",
          options: [
            { value: "orbit", label: "Облёт вокруг места" },
            { value: "glide", label: "Плавный подлёт к месту" },
            { value: "rise", label: "Подъём над хребтами" },
            { value: "valley", label: "Пролёт вдоль долины" },
            { value: "descend", label: "Снижение с высоты" },
            { value: "sweep", label: "Боковой пролёт" },
          ],
        },
        { type: "image", name: "terrain_texture", label: "Спутниковый снимок (текстура)", folder: "terrain" },
        { type: "image", name: "terrain_heightmap", label: "Карта высот (PNG)", folder: "terrain" },
        { type: "image", name: "terrain_far_texture", label: "Дальний пояс: спутниковый снимок", folder: "terrain", help: "Большая территория вокруг места — даёт настоящие хребты на горизонте." },
        { type: "image", name: "terrain_far_heightmap", label: "Дальний пояс: карта высот (PNG)", folder: "terrain" },
        { type: "number", name: "terrain_far_size_km", label: "Дальний пояс: сторона, км", min: 4, max: 400, step: 1 },
        { type: "date", name: "terrain_captured_on", label: "Дата снимка" },
        { type: "number", name: "terrain_min_height", label: "Минимальная высота участка, м" },
        { type: "number", name: "terrain_max_height", label: "Максимальная высота участка, м" },
      ],
    },
    {
      title: "Атмосфера и резервное фото",
      fields: [
        { type: "color", name: "sky_color", label: "Цвет неба" },
        { type: "color", name: "fog_color", label: "Цвет дымки у горизонта" },
        { type: "image", name: "photo", label: "Фото, если 3D недоступно", folder: "scenes" },
      ],
    },
  ],
};

// What each block actually renders, so its form offers only fields that change the live page. Blocks built from
// catalogue data name the admin section their cards and photos come from instead.
interface SectionCapabilities {
  subtitle?: boolean;
  body?: boolean;
  primary?: boolean;
  secondary?: boolean;
  limit?: boolean;
  background?: boolean;
  video?: boolean;
  items?: boolean;
  itemImages?: boolean;
  source?: string;
}

const ALL_CAPABILITIES: SectionCapabilities = { subtitle: true, body: true, primary: true, secondary: true, limit: true, background: true, video: true, items: true, itemImages: true };

const SECTION_CAPABILITIES: Record<string, SectionCapabilities> = {
  hero: { subtitle: true, primary: true, secondary: true, limit: true, background: true, video: true, items: true },
  regions: { subtitle: true, primary: true, source: "Фото, описания и цвета областей меняются в разделе «Области Кыргызстана»." },
  journey: { subtitle: true, primary: true, source: "Маршрут, точки и фото берутся из разделов «Маршруты» и «3D-сцены»." },
  destinations: { subtitle: true, limit: true, source: "Карточки — направления с отметкой «Избранное» в разделе «Направления»; фото — обложка направления." },
  tours: { subtitle: true, limit: true, source: "Карточки — экскурсии с отметкой «Избранное» в разделе «Экскурсии»; фото — обложка экскурсии." },
  guides: { subtitle: true, limit: true, source: "Карточки и фото берутся из раздела «Гиды»." },
  routes: { subtitle: true, limit: true, source: "Карточки берутся из раздела «Маршруты»." },
  seasons: { subtitle: true, source: "Сезоны и подходящие экскурсии берутся из разделов «Сезоны» и «Экскурсии»." },
  culture: { subtitle: true, background: true, items: true, itemImages: true },
  nature: { subtitle: true, primary: true, items: true },
  stories: { subtitle: true, limit: true, source: "Статьи с отметкой «Избранное» в разделе «Блог и статьи»; фото — обложка статьи." },
  testimonials: { subtitle: true, primary: true, limit: true, source: "Показываются опубликованные отзывы из раздела «Отзывы»." },
  founder: { primary: true, source: "Фото, имя и рассказ меняются в разделе «Основной гид и основатель»." },
  advantages: { subtitle: true, items: true },
  cta: { subtitle: true, primary: true, secondary: true, background: true },
  newsletter: { subtitle: true },
  about_hero: { subtitle: true, background: true },
  about_story: { body: true, background: true },
  about_mission: { body: true },
  about_principles: { subtitle: true, items: true },
  about_founder: { source: "Фото, имя и рассказ меняются в разделе «Основной гид и основатель»." },
  about_team: { subtitle: true, source: "Карточки сотрудников берутся из раздела «Сотрудники и команда»." },
  about_contacts: { subtitle: true, primary: true, source: "Телефон, почта и адрес меняются в разделе «Контакты»." },
};

const capabilities = (values: Record<string, unknown>) => SECTION_CAPABILITIES[String(values.key)] ?? ALL_CAPABILITIES;
const can = (flag: keyof Omit<SectionCapabilities, "source">) => (values: Record<string, unknown>) => Boolean(capabilities(values)[flag]);

const ITEM_VALUE_HELP = "Для цифр первого экрана: число со знаком «+» или «%», если нужно, — например 7439, 8000+, 90%+. Число анимируется при появлении.";
const ITEMS_DESCRIPTION = "Карточки культуры, преимущества, пункты «Природа и приключения», принципы и цифры нижней панели первого экрана. Порядок меняется стрелками, лишнее можно скрыть или удалить.";

const SECTION_ITEM_FIELDS: FieldConfig[] = [
  { type: "text", name: "title", label: "Заголовок", translated: true, required: true, maxLength: 160 },
  { type: "text", name: "label", label: "Подпись", translated: true, maxLength: 80 },
  { type: "textarea", name: "text", label: "Текст", translated: true, rows: 2 },
  { type: "select", name: "icon", label: "Иконка", allowEmpty: true, options: ICON_NAMES.map((name) => ({ value: name, label: name })) },
  { type: "text", name: "value", label: "Число / значение", maxLength: 30, help: ITEM_VALUE_HELP },
  { type: "text", name: "link", label: "Ссылка", maxLength: 255 },
  { type: "boolean", name: "is_visible", label: "Показывать" },
  // Only hidden where the block doesn't render item photos; the value is still saved unchanged.
  { type: "image", name: "image", label: "Изображение", folder: "sections", when: can("itemImages") },
];

export const sectionsResource: ResourceConfig = {
  key: "sections",
  endpoint: "/admin/sections/",
  model: "site_content.pagesection",
  title: "Секции страниц",
  singular: "секция",
  icon: MapPinned,
  description: "Порядок, видимость, тексты и изображения блоков главной страницы и страницы «О нас».",
  orderable: true,
  translated: true,
  allowCreate: false,
  allowDelete: false,
  fixedParams: ["page_key"],
  columns: [
    { key: "key", label: "Блок", render: (item) => <span className="font-semibold text-night-900">{SECTION_LABELS[String(item.key)] ?? String(item.key)}</span> },
    { key: "title", label: "Заголовок", render: (item) => <span className="text-graphite-600">{String(item.display_name ?? "").split(" · ").slice(1).join(" · ")}</span> },
    translationsColumn,
    toggleColumn("is_visible", "Показывать"),
  ],
  sections: [
    {
      title: "Тексты блока",
      fields: [
        { type: "text", name: "eyebrow", label: "Надзаголовок", translated: true, maxLength: 120 },
        { type: "text", name: "title", label: "Заголовок", translated: true, required: true, maxLength: 200 },
        { type: "textarea", name: "subtitle", label: "Подзаголовок", translated: true, rows: 3, when: can("subtitle") },
        { type: "textarea", name: "body", label: "Основной текст", translated: true, rows: 5, when: can("body") },
      ],
    },
    {
      title: "Кнопки и ссылки",
      when: (values) => can("primary")(values) || can("secondary")(values),
      fields: [
        { type: "text", name: "primary_label", label: "Текст основной кнопки", translated: true, maxLength: 60, when: can("primary") },
        { type: "text", name: "primary_link", label: "Ссылка основной кнопки", maxLength: 255, help: "Путь без языка, например /tours или /contact.", when: can("primary") },
        { type: "text", name: "secondary_label", label: "Текст второй кнопки", translated: true, maxLength: 60, when: can("secondary") },
        { type: "text", name: "secondary_link", label: "Ссылка второй кнопки", maxLength: 255, when: can("secondary") },
      ],
    },
    {
      title: "Отображение",
      description: (values) => capabilities(values).source,
      fields: [
        { type: "boolean", name: "is_visible", label: "Показывать блок" },
        { type: "boolean", name: "animate", label: "Анимация появления" },
        { type: "number", name: "items_limit", label: "Количество карточек", min: 1, max: 24, help: "Для первого экрана — сколько цифр показывать в нижней панели. На компьютере они растягиваются на всю ширину, на телефоне видны первые три.", when: can("limit") },
        { type: "image", name: "background", label: "Фоновое изображение", folder: "sections", help: "Для первого экрана это ещё и постер: он виден, пока загружается видео, поэтому лучше взять первый кадр ролика.", when: can("background") },
        { type: "video", name: "background_video", label: "Основное видео (компьютеры)", folder: "sections", videoRole: "main", posterField: "background", help: "MP4 H.264 2560×1440, 30 кадров/с, без звука, 15–20 секунд, до 40 МБ, ключевой кадр каждую секунду. 1440p выглядит так же чётко, как 4K, но декодируется в разы легче — видео не подтормаживает. Показывается на компьютерах с экраном от Full HD при быстром интернете.", when: can("video") },
        { type: "video", name: "background_video_light", label: "Облегчённое видео 1080p", folder: "sections", videoRole: "light", pairWith: "background_video", help: "Тот же ролик в 1920×1080, около 7 Мбит/с, до 20 МБ. Его получают телефоны, планшеты, небольшие экраны и медленный интернет, а также компьютеры, которые не справляются с основным видео без потери кадров. При режиме экономии трафика и «уменьшении движения» видео не загружается.", when: can("video") },
      ],
    },
    {
      title: "Элементы блока",
      description: ITEMS_DESCRIPTION,
      when: can("items"),
      fields: [{ type: "inline", name: "items", label: "Элементы", itemLabel: "Элемент", itemDefaults: { is_visible: true }, fields: SECTION_ITEM_FIELDS }],
    },
  ],
};

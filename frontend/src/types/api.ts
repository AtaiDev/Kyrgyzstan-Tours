import type { Language } from "@/i18n/languages";

export interface Media {
  id: number;
  kind: "image" | "video";
  url: string;
  large_url: string;
  medium_url: string;
  thumbnail_url: string;
  width: number | null;
  height: number | null;
  author: string;
  license: string;
  license_url: string;
  source_url: string;
  alt: string;
  caption: string;
}

export interface Paginated<T> {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: T[];
}

export type Difficulty = "easy" | "moderate" | "challenging" | "expert";

export interface SiteStats {
  regions: number;
  destinations: number;
  attractions: number;
  tours: number;
  routes: number;
  guides: number;
  reviews: number;
  average_rating: number | null;
}

export interface VisualSettings {
  enable_3d: boolean;
  enable_parallax: boolean;
  enable_scroll_animations: boolean;
  enable_hero_video: boolean;
  enable_map_animations: boolean;
  scene_quality: "low" | "medium" | "high";
  parallax_intensity: number;
  hero_overlay_opacity: number;
  updated_at?: string;
}

export interface SeoEntry {
  title: string;
  description: string;
  keywords: string;
  no_index: boolean;
  og_image: Media | null;
}

export interface SiteContacts {
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  office_latitude: string | null;
  office_longitude: string | null;
}

export interface SiteData {
  language: Language;
  site_name: string;
  logo: Media | null;
  default_og_image: Media | null;
  default_language: Language;
  tagline: string;
  footer_text: string;
  address: string;
  working_hours: string;
  copyright: string;
  contacts: SiteContacts;
  visual: VisualSettings;
  seo: Record<string, SeoEntry>;
  stats: SiteStats;
}

export interface SectionItem {
  id: number;
  icon: string;
  image: Media | null;
  link: string;
  value: string;
  title: string;
  text: string;
  label: string;
}

export interface PageSection {
  key: string;
  position: number;
  background: Media | null;
  background_video: Media | null;
  background_video_light: Media | null;
  primary_link: string;
  secondary_link: string;
  items_limit: number;
  animate: boolean;
  items: SectionItem[];
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  primary_label: string;
  secondary_label: string;
}

export interface RegionBrief {
  slug: string;
  map_code: string;
  accent_color: string;
  name: string;
}

export interface SeasonBrief {
  code: string;
  months: string;
  name: string;
}

export interface TravelStyle {
  slug: string;
  icon: string;
  name: string;
  description: string;
}

export interface RegionCard {
  slug: string;
  map_code: string;
  accent_color: string;
  cover: Media | null;
  area_km2: number | null;
  recommended_days_min: number;
  recommended_days_max: number;
  seasons: SeasonBrief[];
  names: Record<Language, string>;
  destinations_count: number;
  attractions_count: number;
  tours_count: number;
  name: string;
  tagline: string;
  key_places: string;
}

export interface RegionDetail extends RegionCard {
  gallery: Media[];
  highlights: string[];
  attractions: AttractionCard[];
  destinations: DestinationCard[];
  tours: TourCard[];
  routes: RouteCard[];
  description: string;
  nature: string;
  seo_title: string;
  seo_description: string;
}

export interface AttractionCard {
  slug: string;
  kind: string;
  cover: Media | null;
  region: RegionBrief;
  latitude: string | null;
  longitude: string | null;
  altitude_m: number | null;
  is_featured: boolean;
  name: string;
  tagline: string;
}

export interface AttractionDetail extends AttractionCard {
  gallery: Media[];
  destination: { slug: string; name: string } | null;
  seasons: SeasonBrief[];
  tours: TourCard[];
  nearby: AttractionCard[];
  routes: RouteCard[];
  description: string;
  visitor_info: string;
  seo_title: string;
  seo_description: string;
}

export interface DestinationCard {
  slug: string;
  cover: Media | null;
  region: RegionBrief;
  travel_styles: TravelStyle[];
  seasons: SeasonBrief[];
  latitude: string | null;
  longitude: string | null;
  is_featured: boolean;
  tours_count: number;
  name: string;
  tagline: string;
  summary: string;
}

export interface DestinationDetail extends DestinationCard {
  gallery: Media[];
  attractions: AttractionCard[];
  tours: TourCard[];
  related: DestinationCard[];
  routes: RouteCard[];
  description: string;
  seo_title: string;
  seo_description: string;
}

export interface GuideBrief {
  slug: string;
  photo: Media | null;
  name: string;
  headline: string;
}

export interface TourCard {
  slug: string;
  cover: Media | null;
  region: RegionBrief;
  guide: GuideBrief | null;
  travel_styles: TravelStyle[];
  price: string;
  currency: string;
  duration_days: number;
  group_size_min: number;
  group_size_max: number;
  difficulty: Difficulty;
  is_featured: boolean;
  rating: number | null;
  reviews_count: number;
  title: string;
  tagline: string;
  summary: string;
}

export interface TourDay {
  day: number;
  title: string;
  description: string;
  accommodation: string;
  meals: string;
}

export interface RoutePoint {
  latitude: string;
  longitude: string;
  title: string;
}

export interface RouteCard {
  slug: string;
  cover: Media | null;
  regions: RegionBrief[];
  distance_km: number;
  duration_days: number;
  difficulty: Difficulty;
  is_featured: boolean;
  path: RoutePoint[];
  tours_count: number;
  title: string;
  summary: string;
}

export interface RouteStop {
  position: number;
  latitude: string;
  longitude: string;
  nights: number;
  attraction: { slug: string; cover: Media | null; name: string } | null;
  title: string;
  description: string;
}

export interface RouteDetail extends RouteCard {
  stops: RouteStop[];
  tours: TourCard[];
  description: string;
  seo_title: string;
  seo_description: string;
}

export interface SpokenLanguage {
  code: string;
  name: string;
}

export interface GuideCard {
  slug: string;
  photo: Media | null;
  languages: SpokenLanguage[];
  regions: RegionBrief[];
  travel_styles: TravelStyle[];
  experience_years: number;
  is_featured: boolean;
  rating: number | null;
  reviews_count: number;
  tours_count: number;
  name: string;
  headline: string;
  quote: string;
}

export interface GuideDetail extends GuideCard {
  specialization: string[];
  tours: TourCard[];
  reviews: Review[];
  bio: string;
  seo_title: string;
  seo_description: string;
}

export interface Review {
  id: number;
  author_name: string;
  author_country: string;
  avatar: Media | null;
  rating: number;
  travel_date: string | null;
  original_language: Language;
  is_featured: boolean;
  created_at: string;
  tour: { slug: string; title: string } | null;
  guide: { slug: string; name: string } | null;
  is_translated: boolean;
  title: string;
  text: string;
}

export interface TourDetail extends TourCard {
  gallery: Media[];
  days: TourDay[];
  included: string[];
  excluded: string[];
  seasons: SeasonBrief[];
  destinations: DestinationCard[];
  attractions: AttractionCard[];
  route: RouteDetail | null;
  guide_profile: GuideCard | null;
  reviews: Review[];
  related: TourCard[];
  description: string;
  meeting_point: string;
  seo_title: string;
  seo_description: string;
}

export interface TeamMember {
  id: number;
  photo: Media | null;
  email: string;
  name: string;
  role: string;
  bio: string;
}

export interface Founder {
  photo: Media | null;
  experience_years: number;
  guide_slug: string | null;
  name: string;
  role: string;
  headline: string;
  bio: string;
  quote: string;
  mission: string;
}

export interface ArticleCard {
  slug: string;
  cover: Media | null;
  category: { slug: string; name: string } | null;
  author: { photo: Media | null; name: string; role: string } | null;
  published_at: string;
  reading_minutes: number;
  is_featured: boolean;
  title: string;
  excerpt: string;
}

export interface ArticleDetail extends ArticleCard {
  related: ArticleCard[];
  tours: TourCard[];
  body: string;
  seo_title: string;
  seo_description: string;
}

export interface ArticleCategory {
  slug: string;
  articles_count: number | null;
  name: string;
  description: string;
}

export interface FaqItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

export interface StaticPageData {
  slug: string;
  updated_at: string;
  title: string;
  body: string;
  seo_title: string;
  seo_description: string;
}

export interface Season {
  code: string;
  months: string;
  month_numbers: number[];
  image: Media | null;
  highlights: string[];
  tours: TourCard[];
  name: string;
  description: string;
}

export type CameraMotion = "orbit" | "glide" | "rise" | "valley" | "descend" | "sweep";

export interface JourneyTerrain {
  heightmap: string;
  texture: Media;
  size_km: number;
  exaggeration: number;
  heading: number;
  motion: CameraMotion;
  latitude: number | null;
  longitude: number | null;
  min_height: number | null;
  max_height: number | null;
  captured_on: string | null;
  far: { heightmap: string; texture: Media; size_km: number } | null;
}

export interface JourneyScene {
  slug: string;
  photo: Media | null;
  sky_color: string;
  fog_color: string;
  terrain: JourneyTerrain | null;
  attraction: {
    slug: string;
    latitude: string | null;
    longitude: string | null;
    altitude_m: number | null;
    name: string;
    region: RegionBrief;
  } | null;
  gallery: Media[];
  routes: RouteCard[];
  title: string;
  subtitle: string;
  description: string;
  cta_label: string;
}


export interface Taxonomies {
  regions: RegionBrief[];
  travel_styles: TravelStyle[];
  seasons: SeasonBrief[];
  languages: SpokenLanguage[];
  difficulties: Difficulty[];
  attraction_kinds: string[];
}

export interface SearchHit {
  slug: string;
  title: string;
  image: string | null;
  price?: string;
  currency?: string;
  duration_days?: number;
}

export interface SearchResults {
  query: string;
  results: Partial<Record<"regions" | "destinations" | "attractions" | "tours" | "guides", SearchHit[]>>;
}

export interface TourFacets {
  price_min: string | null;
  price_max: string | null;
  duration_min: number | null;
  duration_max: number | null;
}

export interface BookingPayload {
  tour?: string | null;
  guide?: string | null;
  full_name: string;
  email: string;
  phone: string;
  preferred_contact: "email" | "phone" | "whatsapp" | "telegram";
  travel_date: string | null;
  travelers: number;
  message: string;
  source_page: string;
  consent: boolean;
  website?: string;
}

export interface ContactPayload {
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
  website?: string;
}

export interface ReviewPayload {
  author_name: string;
  author_country: string;
  author_email: string;
  rating: number;
  tour?: string | null;
  guide?: string | null;
  travel_date: string | null;
  title: string;
  text: string;
  consent: boolean;
  website?: string;
}

export interface FormResult {
  status: string;
  id?: number;
  team_notified?: boolean;
}

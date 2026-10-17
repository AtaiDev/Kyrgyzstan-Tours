import type { Language } from "@/i18n/languages";
import type {
  ArticleCard,
  ArticleCategory,
  ArticleDetail,
  AttractionCard,
  AttractionDetail,
  BookingPayload,
  ContactPayload,
  DestinationCard,
  DestinationDetail,
  FaqItem,
  FormResult,
  Founder,
  GuideCard,
  GuideDetail,
  JourneyScene,
  Media,
  PageSection,
  Paginated,
  RegionCard,
  RegionDetail,
  Review,
  ReviewPayload,
  RouteCard,
  RouteDetail,
  SearchResults,
  Season,
  SiteData,
  StaticPageData,
  Taxonomies,
  TeamMember,
  TourCard,
  TourDetail,
  TourFacets,
} from "@/types/api";

import type { QueryParams } from "./client";
import { api } from "./client";

const base = "/public";

function detailParams(lang: Language, preview?: boolean): QueryParams {
  return { lang, preview: preview ? 1 : undefined };
}

export const publicApi = {
  site: (lang: Language, signal?: AbortSignal) => api.get<SiteData>(`${base}/site/`, { lang }, signal),
  interfaceStrings: (lang: Language, signal?: AbortSignal) =>
    api.get<{ language: Language; strings: Record<string, string> }>(`${base}/interface-strings/`, { lang }, signal),
  sections: (page: "home" | "about", lang: Language, signal?: AbortSignal) =>
    api.get<{ page: string; sections: PageSection[] }>(`${base}/sections/${page}/`, { lang }, signal),
  search: (q: string, lang: Language, signal?: AbortSignal) => api.get<SearchResults>(`${base}/search/`, { q, lang }, signal),
  taxonomies: (lang: Language, signal?: AbortSignal) => api.get<Taxonomies>(`${base}/taxonomies/`, { lang }, signal),
  founder: (lang: Language, signal?: AbortSignal) => api.get<Founder | null>(`${base}/founder/`, { lang }, signal),

  regions: (lang: Language, signal?: AbortSignal) => api.get<RegionCard[]>(`${base}/regions/`, { lang }, signal),
  region: (slug: string, lang: Language, preview?: boolean, signal?: AbortSignal) =>
    api.get<RegionDetail>(`${base}/regions/${slug}/`, detailParams(lang, preview), signal),

  destinations: (lang: Language, params: QueryParams, signal?: AbortSignal) =>
    api.get<Paginated<DestinationCard>>(`${base}/destinations/`, { lang, ...params }, signal),
  destination: (slug: string, lang: Language, preview?: boolean, signal?: AbortSignal) =>
    api.get<DestinationDetail>(`${base}/destinations/${slug}/`, detailParams(lang, preview), signal),

  attractions: (lang: Language, params: QueryParams, signal?: AbortSignal) =>
    api.get<Paginated<AttractionCard>>(`${base}/attractions/`, { lang, ...params }, signal),
  attraction: (slug: string, lang: Language, preview?: boolean, signal?: AbortSignal) =>
    api.get<AttractionDetail>(`${base}/attractions/${slug}/`, detailParams(lang, preview), signal),

  seasons: (lang: Language, signal?: AbortSignal) => api.get<Season[]>(`${base}/seasons/`, { lang }, signal),
  scenes: (lang: Language, signal?: AbortSignal) => api.get<JourneyScene[]>(`${base}/scenes/`, { lang }, signal),

  tours: (lang: Language, params: QueryParams, signal?: AbortSignal) =>
    api.get<Paginated<TourCard>>(`${base}/tours/`, { lang, ...params }, signal),
  tour: (slug: string, lang: Language, preview?: boolean, signal?: AbortSignal) =>
    api.get<TourDetail>(`${base}/tours/${slug}/`, detailParams(lang, preview), signal),
  tourFacets: (signal?: AbortSignal) => api.get<TourFacets>(`${base}/tours/facets/`, undefined, signal),

  routes: (lang: Language, params: QueryParams, signal?: AbortSignal) =>
    api.get<Paginated<RouteCard>>(`${base}/routes/`, { lang, ...params }, signal),
  route: (slug: string, lang: Language, preview?: boolean, signal?: AbortSignal) =>
    api.get<RouteDetail>(`${base}/routes/${slug}/`, detailParams(lang, preview), signal),

  guides: (lang: Language, params: QueryParams, signal?: AbortSignal) =>
    api.get<Paginated<GuideCard>>(`${base}/guides/`, { lang, ...params }, signal),
  guide: (slug: string, lang: Language, preview?: boolean, signal?: AbortSignal) =>
    api.get<GuideDetail>(`${base}/guides/${slug}/`, detailParams(lang, preview), signal),

  team: (lang: Language, signal?: AbortSignal) => api.get<TeamMember[]>(`${base}/team/`, { lang }, signal),
  reviews: (lang: Language, params: QueryParams, signal?: AbortSignal) =>
    api.get<Paginated<Review>>(`${base}/reviews/`, { lang, ...params }, signal),

  articles: (lang: Language, params: QueryParams, signal?: AbortSignal) =>
    api.get<Paginated<ArticleCard>>(`${base}/articles/`, { lang, ...params }, signal),
  article: (slug: string, lang: Language, preview?: boolean, signal?: AbortSignal) =>
    api.get<ArticleDetail>(`${base}/articles/${slug}/`, detailParams(lang, preview), signal),
  articleCategories: (lang: Language, signal?: AbortSignal) =>
    api.get<ArticleCategory[]>(`${base}/article-categories/`, { lang }, signal),

  faq: (lang: Language, signal?: AbortSignal) => api.get<FaqItem[]>(`${base}/faq/`, { lang }, signal),
  staticPage: (slug: string, lang: Language, signal?: AbortSignal) =>
    api.get<StaticPageData>(`${base}/pages/${slug}/`, { lang }, signal),
  credits: (lang: Language, params: QueryParams, signal?: AbortSignal) =>
    api.get<Paginated<Media>>(`${base}/media-credits/`, { lang, ...params }, signal),

  submitBooking: (lang: Language, payload: BookingPayload) => api.post<FormResult>(`${base}/forms/booking/`, payload, { lang }),
  submitContact: (lang: Language, payload: ContactPayload) => api.post<FormResult>(`${base}/forms/contact/`, payload, { lang }),
  subscribe: (lang: Language, email: string, website = "") =>
    api.post<FormResult>(`${base}/forms/newsletter/`, { email, website }, { lang }),
  submitReview: (lang: Language, payload: ReviewPayload) => api.post<FormResult>(`${base}/forms/review/`, payload, { lang }),
};

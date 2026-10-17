import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import { useI18n } from "@/i18n/context";

import type { QueryParams } from "./client";
import { publicApi } from "./public";

const LONG = 10 * 60 * 1000;

export function usePreviewFlag(): boolean {
  const [params] = useSearchParams();
  return params.get("preview") === "1";
}

export function useSite() {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["site", language],
    queryFn: ({ signal }) => publicApi.site(language, signal),
    staleTime: LONG,
  });
}

export function useSections(page: "home" | "about") {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["sections", page, language],
    queryFn: ({ signal }) => publicApi.sections(page, language, signal),
    staleTime: LONG,
  });
}

export function useTaxonomies() {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["taxonomies", language],
    queryFn: ({ signal }) => publicApi.taxonomies(language, signal),
    staleTime: LONG,
  });
}

export function useRegions() {
  const { language } = useI18n();
  return useQuery({ queryKey: ["regions", language], queryFn: ({ signal }) => publicApi.regions(language, signal), staleTime: LONG });
}

export function useRegion(slug: string | undefined) {
  const { language } = useI18n();
  const preview = usePreviewFlag();
  return useQuery({
    queryKey: ["region", slug, language, preview],
    queryFn: ({ signal }) => publicApi.region(slug ?? "", language, preview, signal),
    enabled: Boolean(slug),
    staleTime: LONG,
  });
}

export function useDestinations(params: QueryParams) {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["destinations", language, params],
    queryFn: ({ signal }) => publicApi.destinations(language, params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useDestination(slug: string | undefined) {
  const { language } = useI18n();
  const preview = usePreviewFlag();
  return useQuery({
    queryKey: ["destination", slug, language, preview],
    queryFn: ({ signal }) => publicApi.destination(slug ?? "", language, preview, signal),
    enabled: Boolean(slug),
  });
}

export function useAttractions(params: QueryParams) {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["attractions", language, params],
    queryFn: ({ signal }) => publicApi.attractions(language, params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useAttraction(slug: string | undefined) {
  const { language } = useI18n();
  const preview = usePreviewFlag();
  return useQuery({
    queryKey: ["attraction", slug, language, preview],
    queryFn: ({ signal }) => publicApi.attraction(slug ?? "", language, preview, signal),
    enabled: Boolean(slug),
  });
}

export function useSeasons() {
  const { language } = useI18n();
  return useQuery({ queryKey: ["seasons", language], queryFn: ({ signal }) => publicApi.seasons(language, signal), staleTime: LONG });
}

export function useScenes() {
  const { language } = useI18n();
  return useQuery({ queryKey: ["scenes", language], queryFn: ({ signal }) => publicApi.scenes(language, signal), staleTime: LONG });
}

export function useTours(params: QueryParams) {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["tours", language, params],
    queryFn: ({ signal }) => publicApi.tours(language, params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useTour(slug: string | undefined) {
  const { language } = useI18n();
  const preview = usePreviewFlag();
  return useQuery({
    queryKey: ["tour", slug, language, preview],
    queryFn: ({ signal }) => publicApi.tour(slug ?? "", language, preview, signal),
    enabled: Boolean(slug),
  });
}

export function useTourFacets() {
  return useQuery({ queryKey: ["tour-facets"], queryFn: ({ signal }) => publicApi.tourFacets(signal), staleTime: LONG });
}

export function useRoutes(params: QueryParams) {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["routes", language, params],
    queryFn: ({ signal }) => publicApi.routes(language, params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useRoute(slug: string | undefined) {
  const { language } = useI18n();
  const preview = usePreviewFlag();
  return useQuery({
    queryKey: ["route", slug, language, preview],
    queryFn: ({ signal }) => publicApi.route(slug ?? "", language, preview, signal),
    enabled: Boolean(slug),
  });
}

export function useGuides(params: QueryParams) {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["guides", language, params],
    queryFn: ({ signal }) => publicApi.guides(language, params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useGuide(slug: string | undefined) {
  const { language } = useI18n();
  const preview = usePreviewFlag();
  return useQuery({
    queryKey: ["guide", slug, language, preview],
    queryFn: ({ signal }) => publicApi.guide(slug ?? "", language, preview, signal),
    enabled: Boolean(slug),
  });
}

export function useTeam() {
  const { language } = useI18n();
  return useQuery({ queryKey: ["team", language], queryFn: ({ signal }) => publicApi.team(language, signal), staleTime: LONG });
}

export function useFounder() {
  const { language } = useI18n();
  return useQuery({ queryKey: ["founder", language], queryFn: ({ signal }) => publicApi.founder(language, signal), staleTime: LONG });
}

export function useReviews(params: QueryParams) {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["reviews", language, params],
    queryFn: ({ signal }) => publicApi.reviews(language, params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useArticles(params: QueryParams) {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["articles", language, params],
    queryFn: ({ signal }) => publicApi.articles(language, params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useArticle(slug: string | undefined) {
  const { language } = useI18n();
  const preview = usePreviewFlag();
  return useQuery({
    queryKey: ["article", slug, language, preview],
    queryFn: ({ signal }) => publicApi.article(slug ?? "", language, preview, signal),
    enabled: Boolean(slug),
  });
}

export function useArticleCategories() {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["article-categories", language],
    queryFn: ({ signal }) => publicApi.articleCategories(language, signal),
    staleTime: LONG,
  });
}

export function useFaq() {
  const { language } = useI18n();
  return useQuery({ queryKey: ["faq", language], queryFn: ({ signal }) => publicApi.faq(language, signal), staleTime: LONG });
}

export function useStaticPage(slug: string) {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["static-page", slug, language],
    queryFn: ({ signal }) => publicApi.staticPage(slug, language, signal),
    staleTime: LONG,
  });
}

export function useCredits(page: number) {
  const { language } = useI18n();
  return useQuery({
    queryKey: ["credits", language, page],
    queryFn: ({ signal }) => publicApi.credits(language, { page, page_size: 24 }, signal),
    placeholderData: keepPreviousData,
  });
}

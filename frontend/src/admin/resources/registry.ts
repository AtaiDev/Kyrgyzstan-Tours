import { attractionsResource, destinationsResource, regionsResource, routesResource, scenesResource, sectionsResource, toursResource } from "./content";
import {
  articleCategoriesResource,
  articlesResource,
  faqResource,
  guidesResource,
  reviewsResource,
  seasonsResource,
  seoResource,
  spokenLanguagesResource,
  staticPagesResource,
  teamResource,
  travelStylesResource,
  usersResource,
} from "./people";
import type { ResourceConfig } from "./types";

export const RESOURCES: ResourceConfig[] = [
  sectionsResource,
  regionsResource,
  attractionsResource,
  destinationsResource,
  toursResource,
  routesResource,
  scenesResource,
  guidesResource,
  teamResource,
  reviewsResource,
  articlesResource,
  articleCategoriesResource,
  faqResource,
  staticPagesResource,
  seoResource,
  seasonsResource,
  travelStylesResource,
  spokenLanguagesResource,
  usersResource,
];

export const RESOURCE_MAP: Record<string, ResourceConfig> = Object.fromEntries(RESOURCES.map((resource) => [resource.key, resource]));

const SPECIAL_PATHS: Record<string, string> = {
  sections: "/admin/r/sections?page=home",
  founder: "/admin/founder",
  "site-settings": "/admin/settings/site",
  seo: "/admin/r/seo-pages",
  media: "/admin/media",
};

export function adminPathForResource(resource: string, language?: string): string {
  if (SPECIAL_PATHS[resource]) return SPECIAL_PATHS[resource];
  return `/admin/r/${resource}${language ? `?missing_language=${language}` : ""}`;
}

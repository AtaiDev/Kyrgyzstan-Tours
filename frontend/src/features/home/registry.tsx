import type { ComponentType } from "react";

import type { PageSection } from "@/types/api";

import { DestinationsSection, GuidesSection, RoutesSection, StoriesSection, ToursSection } from "./CatalogSections";
import { HeroSection } from "./HeroSection";
import { JourneySection } from "./JourneySection";
import { RegionsSection } from "./RegionsSection";
import { SeasonsSection } from "./SeasonsSection";
import {
  AdvantagesSection,
  CtaSection,
  CultureSection,
  FounderSection,
  NatureSection,
  NewsletterSection,
  TestimonialsSection,
} from "./StorySections";

export const HOME_SECTIONS: Record<string, ComponentType<{ section: PageSection }>> = {
  hero: HeroSection,
  regions: RegionsSection,
  journey: JourneySection,
  destinations: DestinationsSection,
  tours: ToursSection,
  guides: GuidesSection,
  routes: RoutesSection,
  seasons: SeasonsSection,
  culture: CultureSection,
  nature: NatureSection,
  stories: StoriesSection,
  testimonials: TestimonialsSection,
  founder: FounderSection,
  advantages: AdvantagesSection,
  cta: CtaSection,
  newsletter: NewsletterSection,
};

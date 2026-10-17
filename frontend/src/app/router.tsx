import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router";

import { BootLoader } from "@/components/ui/States";
import { PublicLayout } from "@/layouts/PublicLayout";

import { LanguageGate, RootRedirect } from "./LanguageGate";
import { RouteError } from "./RouteError";

type PageModule = { default: ComponentType };

function page(loader: () => Promise<PageModule>) {
  return async () => {
    const module = await loader();
    return { Component: module.default };
  };
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect />, errorElement: <RouteError /> },
  {
    path: "/admin/*",
    lazy: page(() => import("@/admin/AdminApp")),
    errorElement: <RouteError />,
    hydrateFallbackElement: <BootLoader />,
  },
  {
    path: "/:lang",
    element: <LanguageGate />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <BootLoader />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, lazy: page(() => import("@/pages/HomePage")) },
          { path: "destinations", lazy: page(() => import("@/pages/DestinationsPage")) },
          { path: "destinations/:slug", lazy: page(() => import("@/pages/DestinationPage")) },
          { path: "regions/:slug", lazy: page(() => import("@/pages/RegionPage")) },
          { path: "attractions/:slug", lazy: page(() => import("@/pages/AttractionPage")) },
          { path: "tours", lazy: page(() => import("@/pages/ToursPage")) },
          { path: "tours/:slug", lazy: page(() => import("@/pages/TourPage")) },
          { path: "routes", lazy: page(() => import("@/pages/RoutesPage")) },
          { path: "routes/:slug", lazy: page(() => import("@/pages/RoutePage")) },
          { path: "guides", lazy: page(() => import("@/pages/GuidesPage")) },
          { path: "guides/:slug", lazy: page(() => import("@/pages/GuidePage")) },
          { path: "about", lazy: page(() => import("@/pages/AboutPage")) },
          { path: "reviews", lazy: page(() => import("@/pages/ReviewsPage")) },
          { path: "blog", lazy: page(() => import("@/pages/BlogPage")) },
          { path: "blog/:slug", lazy: page(() => import("@/pages/ArticlePage")) },
          { path: "contact", lazy: page(() => import("@/pages/ContactPage")) },
          { path: "faq", lazy: page(() => import("@/pages/FaqPage")) },
          { path: "privacy", lazy: page(() => import("@/pages/PrivacyPage")) },
          { path: "terms", lazy: page(() => import("@/pages/TermsPage")) },
          { path: "credits", lazy: page(() => import("@/pages/CreditsPage")) },
          { path: "*", lazy: page(() => import("@/pages/NotFoundPage")) },
        ],
      },
    ],
  },
]);

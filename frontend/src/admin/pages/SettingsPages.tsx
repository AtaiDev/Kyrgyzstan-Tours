import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { adminApi } from "../api";
import { useAdminAuth } from "../auth";
import { Thumb } from "../resources/columns";
import { contactsSingleton, founderSingleton, siteSettingsSingleton, visualSingleton } from "../resources/singletons";
import { Card } from "../ui/Primitives";
import { SingletonPage } from "./SingletonPage";

export function SiteSettingsPage() {
  return <SingletonPage config={siteSettingsSingleton} />;
}

export function ContactsPage() {
  return <SingletonPage config={contactsSingleton} />;
}

export function FounderPage() {
  return <SingletonPage config={founderSingleton} />;
}

function ScenesList() {
  const { canModel } = useAdminAuth();
  const query = useQuery({ queryKey: ["admin", "list", "scenes", "summary"], queryFn: () => adminApi.list("/admin/scenes/", { page_size: 50, ordering: "position" }), enabled: canModel("geography.journeyscene", "view") });
  if (!canModel("geography.journeyscene", "view")) return null;
  return (
    <Card title="3D-сцены" actions={<Link to="/admin/r/scenes" className="inline-flex items-center gap-1 text-sm font-semibold text-glacier-700">Управлять <ArrowRight className="h-4 w-4" aria-hidden /></Link>} className="mt-6 mb-24">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(query.data?.results ?? []).map((scene) => (
          <li key={String(scene.id)}>
            <Link to={`/admin/r/scenes/${scene.id}`} className="flex items-center gap-3 rounded-xl border border-graphite-200 p-2 hover:border-night-900/30">
              <Thumb media={scene.photo} />
              <span className="text-sm font-semibold text-night-900">{String(scene.display_name)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function VisualSettingsPage() {
  return <SingletonPage config={visualSingleton} footer={<ScenesList />} />;
}

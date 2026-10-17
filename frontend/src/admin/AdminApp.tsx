import { Route, Routes } from "react-router";

import { I18nProvider } from "@/i18n/I18nProvider";

import { AdminAuthProvider, RequireAdmin } from "./auth";
import { AdminLayout } from "./layout/AdminLayout";
import { AdminNotFound } from "./pages/AdminNotFound";
import DashboardPage from "./pages/DashboardPage";
import InquiriesPage from "./pages/InquiriesPage";
import LoginPage from "./pages/LoginPage";
import MediaLibraryPage from "./pages/MediaLibraryPage";
import ProfilePage from "./pages/ProfilePage";
import ResourceEditPage from "./pages/ResourceEditPage";
import ResourceListPage from "./pages/ResourceListPage";
import RolesPage from "./pages/RolesPage";
import { ContactsPage, FounderPage, SiteSettingsPage, VisualSettingsPage } from "./pages/SettingsPages";
import TranslationsPage from "./pages/TranslationsPage";
import { FeedbackProvider } from "./ui/feedback";

export default function AdminApp() {
  return (
    <I18nProvider language="ru" persist={false}>
      <FeedbackProvider>
        <AdminAuthProvider>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="r/:resource" element={<ResourceListPage />} />
              <Route path="r/:resource/new" element={<ResourceEditPage />} />
              <Route path="r/:resource/:id" element={<ResourceEditPage />} />
              <Route path="media" element={<MediaLibraryPage />} />
              <Route path="inquiries" element={<InquiriesPage />} />
              <Route path="translations" element={<TranslationsPage />} />
              <Route path="settings/site" element={<SiteSettingsPage />} />
              <Route path="settings/contacts" element={<ContactsPage />} />
              <Route path="settings/visual" element={<VisualSettingsPage />} />
              <Route path="founder" element={<FounderPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<AdminNotFound />} />
            </Route>
          </Routes>
        </AdminAuthProvider>
      </FeedbackProvider>
    </I18nProvider>
  );
}

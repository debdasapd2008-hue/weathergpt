import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/i18n";

const HomePage = lazy(() => import("@/pages/HomePage").then((module) => ({ default: module.HomePage })));
const ForecastPage = lazy(() => import("@/pages/ForecastPage").then((module) => ({ default: module.ForecastPage })));
const AIAssistantPage = lazy(() => import("@/pages/AIAssistantPage").then((module) => ({ default: module.AIAssistantPage })));
const GeneralChatPage = lazy(() => import("@/pages/GeneralChatPage").then((module) => ({ default: module.GeneralChatPage })));
const SavedPlacesPage = lazy(() => import("@/pages/SavedPlacesPage").then((module) => ({ default: module.SavedPlacesPage })));
const AlertsPage = lazy(() => import("@/pages/AlertsPage").then((module) => ({ default: module.AlertsPage })));
const EducationPage = lazy(() => import("@/pages/EducationPage").then((module) => ({ default: module.EducationPage })));
const FarmersPage = lazy(() => import("@/pages/FarmersPage").then((module) => ({ default: module.FarmersPage })));
const TravellersPage = lazy(() => import("@/pages/TravellersPage").then((module) => ({ default: module.TravellersPage })));
const HealthPage = lazy(() => import("@/pages/HealthPage").then((module) => ({ default: module.HealthPage })));
const CameraPage = lazy(() => import("@/pages/CameraPage").then((module) => ({ default: module.CameraPage })));
const FilesPage = lazy(() => import("@/pages/FilesPage").then((module) => ({ default: module.FilesPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));

function PageLoader() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="animate-pulse text-sm text-ink-3 dark:text-white/45">{t("common.loading", "Loading…")}</p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/ai" element={<AIAssistantPage />} />
          <Route path="/chat" element={<GeneralChatPage />} />
          <Route path="/places" element={<SavedPlacesPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/farmers" element={<FarmersPage />} />
          <Route path="/travellers" element={<TravellersPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
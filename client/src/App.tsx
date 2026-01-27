import { useState } from "react";
import ChatDashboard from "./components/ChatDashboard";
import AdminConfig from "./components/AdminConfig";
import { useTranslation } from "react-i18next";
import { BrandingProvider, useBrandingContext } from "./context/BrandingContext";

function MainLayout() {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<"chat" | "admin">("chat");
  const { config, refreshBranding } = useBrandingContext();

  return (
    <div className="h-screen w-full bg-white dark:bg-gray-900 transition-colors duration-200 flex flex-col overflow-hidden">
      <main className="flex-1 flex overflow-hidden">
        {currentView === "chat" ? (
          <ChatDashboard onNavigate={(view) => setCurrentView(view)} />
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="p-2 px-6 bg-white dark:bg-gray-950 flex gap-4 text-xs font-bold border-b dark:border-gray-800">
              <button
                onClick={() => setCurrentView("chat")}
                className="py-2 transition-opacity hover:opacity-75"
                style={{ color: config.primary_color || "#2563eb" }}
              >
                {t('common.back_to_chat')}
              </button>
            </div>
            <AdminConfig onSave={refreshBranding} />
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrandingProvider>
      <MainLayout />
    </BrandingProvider>
  );
}

export default App;
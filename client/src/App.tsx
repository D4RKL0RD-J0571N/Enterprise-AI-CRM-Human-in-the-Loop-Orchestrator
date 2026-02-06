import { useState } from "react";
import ChatDashboard from "./components/ChatDashboard";
import AdminConfig from "./components/AdminConfig";
import { useTranslation } from "react-i18next";
import { BrandingProvider, useBrandingContext } from "./context/BrandingContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./components/LoginPage";

function MainLayout() {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<"chat" | "admin">("chat");
  const { config, refreshBranding } = useBrandingContext();
  const { isAuthenticated, logout, user } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen w-full bg-white dark:bg-[var(--brand-bg)] transition-colors duration-200 flex flex-col overflow-hidden">
      <main className="flex-1 flex overflow-hidden">
        {currentView === "chat" ? (
          <ChatDashboard onNavigate={(view) => setCurrentView(view)} />
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="p-2 px-6 bg-white dark:bg-gray-950 flex justify-between items-center text-xs font-bold border-b dark:border-gray-800">
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentView("chat")}
                  className="py-2 transition-opacity hover:opacity-75"
                  style={{ color: config.primary_color || "#2563eb" }}
                >
                  {t('common.back_to_chat')}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 opacity-50 uppercase tracking-tighter">{t('common.authenticated_as')} <span className="text-white">{user?.username}</span></span>
                <button onClick={logout} className="text-red-500 hover:text-red-400">{t('common.logout')}</button>
              </div>
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
    <AuthProvider>
      <BrandingProvider>
        <MainLayout />
      </BrandingProvider>
    </AuthProvider>
  );
}

export default App;
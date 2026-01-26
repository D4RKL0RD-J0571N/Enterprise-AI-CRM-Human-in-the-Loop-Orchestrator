import { useState, useEffect } from "react";
import ChatDashboard from "./components/ChatDashboard";
import AdminConfig from "./components/AdminConfig";
import { useTranslation } from "react-i18next";

function App() {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<"chat" | "admin">("chat");
  const [brandColor, setBrandColor] = useState("#2563eb");

  // Fetching config using standard browser Fetch
  useEffect(() => {
    fetch("/admin/config") // Adjust this URL to your FastAPI endpoint
      .then(res => res.json())
      .then(data => {
        if (data.primary_color) {
          setBrandColor(data.primary_color);
          document.documentElement.style.setProperty('--brand-primary', data.primary_color);
        }
      })
      .catch(err => console.error("Branding sync failed:", err));
  }, []);

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
                style={{ color: brandColor }}
              >
                {t('common.back_to_chat')}
              </button>
            </div>
            <AdminConfig />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
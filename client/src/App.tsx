import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ChatDashboard from "./components/ChatDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrandingProvider } from "./context/BrandingContext";
import LoginPage from "./components/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsLayout from "./layouts/SettingsLayout";
import OrganizationSettings from "./pages/settings/OrganizationSettings";
import IntelligenceSettings from "./pages/settings/IntelligenceSettings";
import ChannelsSettings from "./pages/settings/ChannelsSettings";
import SystemSettings from "./pages/settings/SystemSettings";
import ClientsPage from "./pages/ClientsPage";

// Wrapper to handle navigation prop for legacy components
const ChatDashboardWrapper = () => {
  const navigate = useNavigate();
  return <ChatDashboard onNavigate={(view) => {
    if (view === 'admin') navigate('/dashboard/settings/organization');
    else if (view === 'chat') navigate('/dashboard/chat');
  }} />;
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  // Apply body background from config if needed, though usually handled by CSS variables + Layout
  // We can leave this effect here if it was doing global style injection, but mostly BrandingContext handles it.

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardHome />} />
        <Route path="chat" element={<ChatDashboardWrapper />} />

        {/* Settings Module */}
        <Route path="settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="organization" replace />} />
          <Route path="organization" element={<OrganizationSettings />} />
          <Route path="intelligence" element={<IntelligenceSettings />} />
          <Route path="channels" element={<ChannelsSettings />} />
          <Route path="developers" element={<SystemSettings />} />
        </Route>

        {/* Core Business Modules */}
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />

        <Route path="clients" element={<ClientsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BrandingProvider>
          <AppRoutes />
        </BrandingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
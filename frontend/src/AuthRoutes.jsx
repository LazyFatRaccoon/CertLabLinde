import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ChangePasswordForm from "./components/auth/ChangePasswordForm";
import UserManagement from "./components/users/UserManagement";
import UserLogs from "./components/userLogs/UserLogs";
import TemplateManager from "./components/templateCreator/TemplateManager";
import StampUploader from "./components/stamp/StampUploader";
import TemplateLogs from "./components/templateLogs/TemplateLogs";
import AnalysisManager from "./components/analysis/AnalysisManager";
import CertificateRequest from "./components/certificate/CertificateRequest";
import SidebarMenu from "@/components/layout/SidebarMenu";
import SettingsTab from "./components/settings/SettingsTab";
import { api } from "@/api/axiosInstance";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthRedirect } from "@/hooks/useAutoRedirect";
import { useAuth } from "@/context/AutoContext";
import { SettingsProvider } from "@/context/SettingsContext";

/* ═══════════════════════════════════════ Dashboard ══════════════════════════ */
const Dashboard = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { authError } = useAuth();
  useAuthRedirect(authError);

  // 📥 Завантажимо всі шаблони (для Sidebar)
  const [templates, setTemplates] = useState([]);
  useEffect(() => {
    api.get("/templates").then(({ data }) => {
      console.log("Шаблони:", data);
      setTemplates(data);
    });
  }, []);

  /* 🚪 Logout */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 🔑 Розпарсимо payload
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  if (!token || !user) return <Navigate to="/login" />;

  return (
    <div className="flex items-start h-screen ">
      {/* ─── SidebarMenu ─── */}
      <SidebarMenu
        roles={user.roles}
        onLogout={handleLogout}
        templates={templates}
        user={user}
        onUserUpdate={setUser}
      />

      {/* ─── Main content ─── */}
      <div className="flex-1 ml-64 p-4 overflow-y-auto">
        <Routes>
          <Route
            path="/template"
            element={<TemplateManager onTemplatesUpdate={setTemplates} />}
          />
          <Route path="/journal" element={<AnalysisManager />} />
          <Route path="/change-password" element={<ChangePasswordForm />} />
          <Route path="/stamp" element={<StampUploader />} />
          <Route
            path="/register-user"
            element={<UserManagement onUserUpdate={setUser} />}
          />
          <Route path="/settings-app" element={<SettingsTab />} />
          {user.roles.includes("supervisor") && (
            <Route path="/logs" element={<UserLogs />} />
          )}
          {(user.roles.includes("supervisor") ||
            user.roles.includes("constructor")) && (
            <Route path="/template-logs" element={<TemplateLogs />} />
          )}
          <Route path="/certificate" element={<CertificateRequest />} />
          <Route path="/" element={<div>Вітаємо, {user.name}!</div>} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════ App Router ════════════════════════ */
export default function App() {
  return (
    <SettingsProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/certificate" element={<CertificateRequest />} />
          <Route path="/*" element={<Dashboard />} />
        </Routes>
      </Router>
    </SettingsProvider>
  );
}

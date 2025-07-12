import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ChangePasswordForm from "./components/auth/ChangePasswordForm";
import UserManagement from "./components/users/UserManagement";
import UserLogs from "./components/userLogs/UserLogs";
//import TemplateCreator from "./components/templateCreator/TemplateCreator";
import TemplateManager from "./components/templateCreator/TemplateManager";
import StampUploader from "./components/stamp/StampUploader";
import TemplateLogs from "./components/templateLogs/TemplateLogs";
import AnalysisManager from "./components/analysis/AnalysisManager";
import CertificateRequest from "./components/certificate/CertificateRequest";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuthRedirect } from "@/hooks/useAutoRedirect";
import { useAuth } from "@/context/AutoContext";

const Sidebar = ({ roles, onLogout }) => {
  return (
    <div className="w-64 bg-gray-100 p-4 h-screen">
      <h2 className="text-xl font-bold mb-4">Меню</h2>
      <ul className="space-y-2">
        {roles.includes("lab") && (
          <li>
            <Link to="/add-entry">Додати запис</Link>
          </li>
        )}
        {(roles.includes("lab") || roles.includes("manager")) && (
          <li>
            <Link to="/journal">Журнал аналізів</Link>
          </li>
        )}
        {roles.includes("manager") && (
          <li>
            <Link to="/edit-journal">Редагування журналу</Link>
          </li>
        )}
        {roles.includes("constructor") && (
          <li>
            <Link to="/template">Створити шаблон</Link>
          </li>
        )}
        {roles.includes("supervisor") && (
          <>
            <li>
              <Link to="/register-user">Користувачі</Link>
            </li>
            <li>
              <Link to="/template-logs">Журнал змін шаблонів</Link>
            </li>
            <li>
              <Link to="/stamp">Печатка</Link>
            </li>
            <li>
              <Link to="/logs">Журнал змін</Link>
            </li>
          </>
        )}
        <li>
          <Link to="/certificate">Замовити сертифікат</Link>
        </li>
        <li>
          <Link to="/change-password">Змінити пароль</Link>
        </li>
        <li>
          <button onClick={onLogout} className="text-red-600">
            Вийти
          </button>
        </li>
      </ul>
    </div>
  );
};

const Dashboard = () => {
  const token = localStorage.getItem("token");
  let user = null;

  if (token && token !== "undefined") {
    try {
      user = JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
      console.error("Invalid token format", err);
    }
  }
  const navigate = useNavigate();
  const { authError } = useAuth();
  useAuthRedirect(authError);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!token || !user) return <Navigate to="/login" />;

  return (
    <div className="flex items-start">
      <Sidebar roles={user.roles} onLogout={handleLogout} />
      <div className="flex-1 p-4">
        <Routes>
          <Route path="/template" element={<TemplateManager />} />
          <Route path="/journal" element={<AnalysisManager />} />
          <Route path="/change-password" element={<ChangePasswordForm />} />
          <Route path="/stamp" element={<StampUploader />} />
          <Route path="/register-user" element={<UserManagement />} />
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
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/certificate" element={<CertificateRequest />} />
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

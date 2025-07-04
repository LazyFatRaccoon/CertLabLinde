import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ChangePasswordForm from "./components/auth/ChangePasswordForm";
import RegisterUserForm from "./components/auth/RegisterUserForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<LoginForm onLogin={() => (window.location.href = "/")} />}
        />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        {isAuthenticated ? (
          <>
            <Route path="/change-password" element={<ChangePasswordForm />} />
            <Route path="/register-user" element={<RegisterUserForm />} />
            <Route path="/" element={<div>Головна сторінка</div>} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
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
    </Router>
  );
}

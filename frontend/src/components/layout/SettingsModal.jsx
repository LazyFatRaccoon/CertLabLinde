import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ChangePasswordForm from "../auth/ChangePasswordForm";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsModal({ user, onClose }) {
  const { theme, setTheme } = useTheme();
  const themes = ["linde", "light", "dark"];

  const overlayRef = useRef();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 pt-20"
    >
      <div
        className={`
          w-full max-w-md p-6 rounded-lg shadow-lg relative animate-fadeInUp
          bg-white text-black 
          dark:bg-gray-800 dark:text-white 
          linde:bg-linde-bg linde:text-linde-text
        `}
      >
        {/* ❌ Close button */}
        <button
          onClick={onClose}
          className={`
            absolute top-2 right-2 
            text-gray-600 hover:text-black 
            dark:text-gray-300 dark:hover:text-white 
            linde:text-white linde:hover:text-gray-200
          `}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок */}
        <h2 className="text-xl font-bold mb-4">Налаштування користувача</h2>

        {/* Інформація про користувача */}
        <div className="space-y-2 text-sm">
          <p>
            <strong>Ім'я:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Дата створення:</strong> {user.createdAt}
          </p>
          <p>
            <strong>Ролі:</strong> {user.roles?.join(", ")}
          </p>
        </div>

        {/* Перемикач теми */}
        <div className="mt-4">
          <label className="block font-semibold mb-1">Тема:</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className={`
              border rounded p-1 text-sm w-full
              bg-white text-black border-gray-300
              dark:bg-gray-700 dark:text-white dark:border-gray-500
              linde:bg-linde-primary linde:text-white linde:border-white
            `}
          >
            {themes.map((t) => (
              <option key={t} value={t}>
                {t === "linde" ? "Linde" : t === "light" ? "Світла" : "Темна"}
              </option>
            ))}
          </select>
        </div>

        {/* Кнопка зміни пароля */}
        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className={`
            mt-4 text-blue-600 hover:underline 
            dark:text-blue-400 
            linde:text-white linde:hover:text-blue-200
          `}
        >
          {showPasswordForm ? "Сховати зміну пароля" : "Змінити пароль"}
        </button>

        {/* Форма зміни пароля */}
        {showPasswordForm && (
          <div className="mt-4 animate-slideDown">
            <ChangePasswordForm />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ChangePasswordForm from "../auth/ChangePasswordForm";

export default function SettingsModal({ user, onClose }) {
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
      <div className="bg-white rounded-lg p-6 shadow-lg relative w-full max-w-md animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4">Налаштування користувача</h2>
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

        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="mt-4 text-blue-600 hover:underline"
        >
          {showPasswordForm ? "Сховати зміну пароля" : "Змінити пароль"}
        </button>

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

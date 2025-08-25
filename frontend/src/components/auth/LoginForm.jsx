import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { tokenStore } from "../../api/tokenStore";
import { API_URL } from "../../constants";
import { SettingsContext } from "../../context/SettingsContext";
import ForgotPasswordForm from "./ForgotPasswordForm"; // імпортуй компонент
import { useImageReady } from "../../hooks/useImageReady";

export default function LoginForm() {
  const { setSettings } = useContext(SettingsContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false); // 🔹 новий стан

  const logoSrc = "/linde-logo-desktop.avif";
  const ready = useImageReady(logoSrc);

  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    try {
      if (token && token !== "undefined") {
        JSON.parse(atob(token.split(".")[1])); // Перевірка валідності
        navigate("/");
      }
    } catch (err) {
      localStorage.removeItem("token");
      console.error("Invalid token", err);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await axios.post(
        `${API_URL}/auth/login`,
        { email, password },
        { withCredentials: true } // щоб отримати cookie з refresh-токеном
      );

      /*  🔑  бек тепер віддає   data.accessToken   */
      tokenStore.set(data.accessToken);
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      console.log("user", JSON.stringify(data.user));
      localStorage.setItem(
        "locations",
        JSON.stringify(data.settings.locations || [])
      );
      localStorage.setItem(
        "products",
        JSON.stringify(data.settings.products || [])
      );
      setSettings(data.settings);

      navigate("/"); // переходимо на головну
    } catch {
      setError("Невірний email або пароль");
    }
  };

  if (!ready) {
    // лоадер, поки картинка не декодована
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="animate-pulse text-[#002d54]">Завантаження…</div>
      </div>
    );
  }

  return (
    <>
      <div className="h-20 bg-[#002d54] flex items-center px-20">
        <div className="shadow-md">
          <img
            src="/linde-logo-desktop.avif"
            alt="Linde Logo"
            className="h-22 mt-4 shadow-md"
          />
        </div>
      </div>

      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow relative transition-all duration-300">
        {showForgot ? (
          <>
            <ForgotPasswordForm />
            <button
              className="mt-4 text-blue-600 hover:underline"
              onClick={() => setShowForgot(false)}
            >
              ← Повернутись до входу
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Вхід</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full border p-2 rounded"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full border p-2 rounded pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#002d54] text-white py-2 rounded"
              >
                Увійти
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-blue-600 hover:underline"
                >
                  Забули пароль?
                </button>
              </div>
              <div className="text-center mt-4">
                <Link
                  to="/certificate"
                  className="text-blue-600 hover:underline"
                >
                  Замовити сертифікат
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
}

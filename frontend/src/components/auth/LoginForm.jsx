import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { tokenStore } from "../../api/tokenStore";
import { API_URL } from "../../constants";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

      navigate("/"); // переходимо на головну
    } catch {
      setError("Невірний email або пароль");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
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
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Увійти
        </button>
        <div className="text-center mt-4">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Забули пароль?
          </Link>
        </div>
        <div className="text-center mt-4">
          <Link to="/certificate" className="text-blue-600 hover:underline">
            Замовити сертифікат
          </Link>
        </div>
      </form>
    </div>
  );
}

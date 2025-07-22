import { tokenStore } from "./tokenStore";
import axios from "axios";

let isRefreshing = false;
let refreshSubscribers = [];
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    console.log("⛔ Interceptor error:", response?.status); // ⬅️

    if (!response || (response.status !== 401 && response.status !== 403)) {
      console.log("❌ Не 401 і не 403 — виходимо");
      return Promise.reject(error);
    }

    if (config._retry) {
      console.log("🔁 Повторна спроба не вдалася — перенаправлення на /login");
      tokenStore.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    config._retry = true;
    console.log("🟡 Перший раз отримали 403 — пробуємо оновити токен");

    const retryOriginalRequest = new Promise((resolve) => {
      refreshSubscribers.push((newToken) => {
        console.log("✅ Новий токен застосовано");
        config.headers["Authorization"] = `Bearer ${newToken}`;
        resolve(api(config));
      });
    });

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        console.log("🔄 Відправляємо refresh-запит");
        const { data } = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        console.log("✅ Оновлено токен:", data.accessToken);
        tokenStore.set(data.accessToken);
        onRefreshed(data.accessToken);
      } catch (e) {
        console.log("❌ Оновлення токена не вдалося:", e.response?.status);
        tokenStore.clear();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login"; // ⬅️ чи виконується?
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return retryOriginalRequest;
  }
);

export default api;

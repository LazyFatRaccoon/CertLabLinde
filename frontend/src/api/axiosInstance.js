import axios from "axios";
import { tokenStore } from "./tokenSore";

let isRefreshing = false;
let refreshSubscribers = [];

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // cookie refreshToken їде автоматично
});

/* ───── request: додаємо Authorization ───── */
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ───── response: ловимо 401 / 403 і оновлюємо токен ───── */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!response || (response.status !== 401 && response.status !== 403)) {
      // це не проблема авторизації
      throw error;
    }

    // ❗ не запускаємо кілька refresh-процесів одночасно
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        tokenStore.set(data.accessToken);
        onRefreshed(data.accessToken);
      } catch (e) {
        tokenStore.clear();
        window.location.href = "/login";
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    // повертаємо проміс, що виконається, коли refresh завершиться
    return new Promise((resolve) => {
      refreshSubscribers.push((newToken) => {
        config.headers.Authorization = `Bearer ${newToken}`;
        resolve(api(config)); // повторюємо оригінальний запит
      });
    });
  }
);

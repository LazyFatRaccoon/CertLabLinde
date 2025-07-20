import { tokenStore } from "./tokenStore";
//import { API_URL } from "../constants";
import axios from "axios";

//export const api = axios.create({ baseURL: API_URL, withCredentials: true });

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
      throw error;
    }

    // Запобігаємо нескінченним циклам
    if (config._retry) {
      tokenStore.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }
    config._retry = true;

    // Додаємо цей запит у чергу на повтор
    const retryOriginalRequest = new Promise((resolve) => {
      refreshSubscribers.push((newToken) => {
        config.headers.Authorization = `Bearer ${newToken}`;
        resolve(api(config));
      });
    });

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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return retryOriginalRequest;
  }
);

export default api;

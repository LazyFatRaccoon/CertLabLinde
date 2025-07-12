import { tokenStore } from "./tokenStore";
import { API_URL } from "../constants";
import axios from "axios";

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

let isRefreshing = false;
let refreshSubscribers = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!response || (response.status !== 401 && response.status !== 403)) {
      throw error;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        tokenStore.set(data.accessToken);
        refreshSubscribers.forEach((cb) => cb(data.accessToken));
        refreshSubscribers = [];
      } catch (e) {
        tokenStore.clear();
        window.location.href = "/login"; // ⬅️ кращий підхід для перенаправлення
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    return new Promise((resolve) => {
      refreshSubscribers.push((newToken) => {
        config.headers.Authorization = `Bearer ${newToken}`;
        resolve(api(config));
      });
    });
  }
);

export default api;

import axios from "axios";

import { envConfig } from "./config";

export const apiClient = axios.create({
  baseURL: envConfig.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

apiClient.interceptors.request.use((config) => {
  const raw = window.localStorage.getItem("assetra.session");
  if (raw) {
    try {
      const session = JSON.parse(raw) as { data?: { accessToken?: string } };
      const token = session.data?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      window.localStorage.removeItem("assetra.session");
    }
  }
  return config;
});

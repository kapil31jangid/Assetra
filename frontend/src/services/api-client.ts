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

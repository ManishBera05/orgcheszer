// --- START OF FILE src/api/axios.ts ---
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const raw = localStorage.getItem("auth-storage");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: { token?: string } };
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let msg = error.message ?? "An unexpected error occurred.";

    // Extract exact backend error message whether it's a JSON object or a plain string
    if (error.response?.data) {
      if (typeof error.response.data === "string") {
        msg = error.response.data;
      } else if ((error.response.data as any).message) {
        msg = (error.response.data as any).message;
      }
    }

    const apiError: ApiError = {
      status: error.response?.status,
      message: msg,
    };

    if (apiError.status === 401) {
      localStorage.removeItem("auth-storage");
    }

    return Promise.reject(apiError);
  },
);

export default api;
// --- END OF FILE src/api/axios.ts ---

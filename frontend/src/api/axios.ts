import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "../types";

/* ─── Base instance ──────────────────────────────────────── */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

/* ─── Request interceptor — inject JWT ───────────────────── */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Read token directly from localStorage so this works without importing
  // the Zustand store (avoids circular dependency issues).
  const raw = localStorage.getItem("auth-storage");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: { token?: string } };
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // malformed storage — ignore
    }
  }
  return config;
});

/* ─── Response interceptor — normalise errors ────────────── */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      status: error.response?.status,
      message:
        (error.response?.data as { message?: string })?.message ??
        error.message ??
        "An unexpected error occurred.",
    };

    // Auto-clear token on 401 (expired / invalid JWT)
    if (apiError.status === 401) {
      localStorage.removeItem("auth-storage");
      // Let the ProtectedRoute redirect to login — no hard navigation here
      // so that the error still propagates to the calling query/mutation.
    }

    return Promise.reject(apiError);
  },
);

export default api;

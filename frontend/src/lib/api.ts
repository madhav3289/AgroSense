import axios, { AxiosError } from "axios";

export const TOKEN_KEY = "agrosense_token";

export const API_BASE_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ??
  "https://agrosense-production-7c71.up.railway.app";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isAuthAttempt = url.includes("/api/auth/login") || url.includes("/api/auth/register");
    if (status === 401 && !isAuthAttempt && typeof window !== "undefined") {
      setToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

/** Normalises the backend's several error shapes into a single string. */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  const err = error as AxiosError<{ error?: string | string[]; msg?: string; message?: string }>;
  const status = err?.response?.status;
  if (status === 413) return "Image too large — please use one under 10 MB.";
  if (status === 429) return "Too many attempts — please try again shortly.";
  const data = err?.response?.data;
  if (data) {
    if (Array.isArray(data.error)) return data.error.join(" ");
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;
    if (typeof data.msg === "string") return data.msg;
  }
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 502) return "We couldn't read that image, please try another.";
  if (status === 503) return "This feature is currently unavailable.";
  if (err?.code === "ERR_NETWORK") return "Can't reach the AgroSense server right now.";
  return fallback;
}

export const CROPS = [
  "rice",
  "maize",
  "jute",
  "cotton",
  "coconut",
  "papaya",
  "orange",
  "apple",
  "muskmelon",
  "watermelon",
  "grapes",
  "mango",
  "banana",
  "pomegranate",
  "lentil",
  "blackgram",
  "mungbean",
  "mothbeans",
  "pigeonpeas",
  "kidneybeans",
  "chickpea",
  "coffee",
] as const;

export type User = {
  id: string;
  username: string;
  email: string;
  created_at?: string;
  is_active?: boolean;
  is_pro?: boolean;
  pro_expires_at?: string | null;
  disease_detection_uses?: number;
  phone?: string;
  location?: string;
  about?: string;
};

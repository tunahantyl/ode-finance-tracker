import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { ApiError } from '@/types';

const TOKEN_KEY = 'ode.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// In dev: Vite proxies /api -> :5000.
// In prod: VITE_API_URL points to absolute API URL (e.g. https://api.tunatest2.site/api).
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      tokenStore.clear();
      if (!location.pathname.startsWith('/login') && !location.pathname.startsWith('/register')) {
        location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function extractApiError(err: unknown): { message: string; details?: { path: string; message: string }[] } {
  if (axios.isAxiosError<ApiError>(err)) {
    const data = err.response?.data;
    return {
      message: data?.error?.message || err.message || 'Beklenmeyen bir hata oluştu.',
      details: data?.error?.details,
    };
  }
  return { message: 'Beklenmeyen bir hata oluştu.' };
}

export function toastError(err: unknown) {
  const { message } = extractApiError(err);
  toast.error(message);
}

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const api = axios.create({ baseURL: API_URL });

function getTokens() {
  return {
    accessToken: localStorage.getItem('ao_admin_access_token'),
    refreshToken: localStorage.getItem('ao_admin_refresh_token'),
  };
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('ao_admin_access_token', accessToken);
  localStorage.setItem('ao_admin_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('ao_admin_access_token');
  localStorage.removeItem('ao_admin_refresh_token');
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = getTokens();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = data.data;
    setTokens(accessToken, newRefreshToken);
    return accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

// On a 401, attempt exactly one silent refresh-and-retry before giving up and
// bouncing to /login. Concurrent 401s share a single in-flight refresh call.
// Endpoints that legitimately return 401 on bad input (wrong password, dead
// refresh token) and should just reject normally — not trigger a silent
// refresh-and-redirect, which would hijack the login form's own error state.
const AUTH_EXEMPT_PATHS = ['/auth/login', '/auth/refresh'];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthExempt = original?.url && AUTH_EXEMPT_PATHS.some((p) => original.url!.includes(p));
    if (error.response?.status === 401 && original && !original._retry && !isAuthExempt) {
      original._retry = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => (refreshPromise = null));
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface PaginatedData<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const fetchConsultations = async () => {
  const { data } = await api.get<ApiEnvelope<any[]>>('/consultations');
  return data.data;
};

export const updateConsultationStatus = async (id: string, status: string) => {
  const { data } = await api.patch<ApiEnvelope<any>>(`/consultations/${id}/status`, { status });
  return data.data;
};

// --- FAQs API ---

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FaqPayload {
  question: string;
  answer: string;
  category?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

export const fetchFaqs = async () => {
  // A store's FAQ list realistically stays well under 100 entries, so one
  // page covers it — no list-page pagination controls needed in the admin UI.
  const { data } = await api.get<ApiEnvelope<PaginatedData<Faq>>>('/admin/faqs', { params: { limit: 100 } });
  return data.data.items;
};

export const createFaq = async (payload: FaqPayload) => {
  const { data } = await api.post<ApiEnvelope<Faq>>('/admin/faqs', payload);
  return data.data;
};

export const updateFaq = async (id: string, payload: Partial<FaqPayload>) => {
  const { data } = await api.patch<ApiEnvelope<Faq>>(`/admin/faqs/${id}`, payload);
  return data.data;
};

export const deleteFaq = async (id: string) => {
  const { data } = await api.delete<ApiEnvelope<{ success: boolean }>>(`/admin/faqs/${id}`);
  return data.data;
};
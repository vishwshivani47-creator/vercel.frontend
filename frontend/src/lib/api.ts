import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authStorage } from './auth';

/**
 * Production Render Backend Base URL
 */
export const PRODUCTION_API_URL = 'https://humorphic-lab-backend.onrender.com/api/v1';

/**
 * Local Development Django Server Base URL
 */
export const LOCAL_API_URL = 'http://localhost:8000/api/v1';

/**
 * Centralized API Base URL resolution:
 * 1. Honors NEXT_PUBLIC_API_URL environment variable if set.
 * 2. In browser environments:
 *    - Defaults to local development URL if accessed via localhost / 127.0.0.1.
 *    - Defaults to production Render URL if accessed via any deployed/external host.
 * 3. In server environments (SSR / build):
 *    - Uses NEXT_PUBLIC_API_URL or defaults based on NODE_ENV.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Client-side host detection fallback
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    if (!isLocal) {
      return PRODUCTION_API_URL;
    }
    return LOCAL_API_URL;
  }

  // Node server-side production build/runtime fallback
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_API_URL;
  }

  return LOCAL_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Flag to prevent multiple refresh calls simultaneously
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Ensure correct baseURL & attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Dynamically guarantee baseURL is resolved from centralized configuration
    if (!config.baseURL || config.baseURL === LOCAL_API_URL) {
      config.baseURL = getApiBaseUrl();
    }
    const token = authStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt to refresh if the failed request was already login or refresh
      if (originalRequest.url?.includes('/auth/login/') || originalRequest.url?.includes('/auth/refresh/')) {
        return Promise.reject(error);
      }

      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) {
        authStorage.clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseUrl = getApiBaseUrl();
        const { data } = await axios.post(`${baseUrl}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = data.access;
        const newRefreshToken = data.refresh || refreshToken;

        authStorage.setTokens(newAccessToken, newRefreshToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        authStorage.clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('humorphic-auth-expired'));
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

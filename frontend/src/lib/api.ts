import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authStorage } from './auth';

/**
 * Verified Production Render Backend Base URL
 * Swagger docs: https://humorphic-lab-backend.onrender.com
 */
export const PRODUCTION_API_URL = 'https://humorphic-lab-backend.onrender.com';

/**
 * Local Development Django Server Base URL
 */
export const LOCAL_API_URL = 'http://localhost:8000';

/**
 * Verified Backend API Endpoints (Swagger-compatible versioned paths)
 */
export const API_ENDPOINTS = {
  HEALTH: '/api/v1/health/',
  LOGIN: '/api/v1/auth/login/',
  REGISTER: '/api/v1/auth/register/',
  LOGOUT: '/api/v1/auth/logout/',
  ME: '/api/v1/auth/me/',
  REFRESH: '/api/v1/auth/refresh/',
  MODELS: '/api/v1/3d-models/',
  USERS: '/api/v1/users/',
  PRODUCTS: '/api/v1/products/',
} as const;

/**
 * Extracts and formats meaningful validation error messages from backend responses.
 * Handles response.data.details dictionaries containing field arrays:
 * - Username already exists.
 * - Email already exists.
 * - Password is too common.
 * - Password confirmation mismatch.
 */
export function extractApiErrorMessage(err: any, fallbackMessage: string): string {
  if (!err) return fallbackMessage;

  // Network / server offline check
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Unable to connect to the backend server. The production server may be waking up from sleep or experiencing network delay. Please try again.';
  }

  const responseData = err.response?.data;
  if (!responseData) {
    return err.message || fallbackMessage;
  }

  // 1. Process response.data.details if present (Django REST Framework serializer errors)
  if (responseData.details && typeof responseData.details === 'object') {
    const details = responseData.details;
    const messages: string[] = [];

    for (const [field, errorVal] of Object.entries(details)) {
      let fieldErrors: string[] = [];
      if (Array.isArray(errorVal)) {
        fieldErrors = errorVal.map(item => String(item).trim());
      } else if (typeof errorVal === 'string') {
        fieldErrors = [errorVal.trim()];
      } else if (errorVal && typeof errorVal === 'object') {
        fieldErrors = Object.values(errorVal).map(v => String(v).trim());
      }

      for (const rawMsg of fieldErrors) {
        if (!rawMsg) continue;
        const lower = rawMsg.toLowerCase();

        if (field === 'username') {
          messages.push(lower.includes('already exists') ? 'Username already exists.' : `Username: ${rawMsg}`);
        } else if (field === 'email') {
          messages.push(lower.includes('already exists') ? 'Email already exists.' : `Email: ${rawMsg}`);
        } else if (field === 'password_confirm') {
          messages.push(lower.includes('match') ? 'Password confirmation mismatch.' : `Password confirmation: ${rawMsg}`);
        } else if (field === 'non_field_errors') {
          messages.push(lower.includes('too common') ? 'Password is too common.' : rawMsg);
        } else if (field === 'password') {
          messages.push(lower.includes('too common') ? 'Password is too common.' : `Password: ${rawMsg}`);
        } else {
          const formattedField = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          messages.push(`${formattedField}: ${rawMsg}`);
        }
      }
    }

    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  // 2. Check top-level message if not the generic DRF wrapper
  if (responseData.message && responseData.message !== 'An error occurred during request processing.') {
    return responseData.message;
  }

  // 3. Check detail field
  if (responseData.detail) {
    return String(responseData.detail);
  }

  return fallbackMessage;
}

/**
 * Centralized API Base URL resolution:
 * 1. Honors NEXT_PUBLIC_API_URL environment variable if set.
 *    Strips any trailing '/api/v1' or slashes because all endpoints explicitly include versioned paths.
 * 2. In browser environments:
 *    - Defaults to local development URL if accessed via localhost / 127.0.0.1.
 *    - Defaults to production Render URL if accessed via any deployed host (Vercel, Render, etc.).
 * 3. In server environments (SSR / build):
 *    - Uses NEXT_PUBLIC_API_URL or defaults based on NODE_ENV.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    // Strip trailing slashes and redundant '/api/v1' if user provided it in env
    return envUrl.trim().replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
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

// Request Interceptor: Ensure correct baseURL, ensure /api/v1 prefix & attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Dynamically guarantee baseURL is resolved from centralized configuration
    config.baseURL = getApiBaseUrl();

    // Ensure endpoint URL starts with /api/v1 to prevent any 404 from unversioned paths (e.g. /auth/register/)
    if (config.url && !config.url.startsWith('http')) {
      let path = config.url.startsWith('/') ? config.url : `/${config.url}`;
      if (!path.startsWith('/api/v1/')) {
        path = `/api/v1${path}`;
      }
      // Deduplicate accidental double prefixes like /api/v1/api/v1/
      config.url = path.replace(/^\/api\/v1\/api\/v1\//, '/api/v1/');
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
        const refreshEndpoint = `${baseUrl}/api/v1/auth/refresh/`;
        const { data } = await axios.post(refreshEndpoint, {
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

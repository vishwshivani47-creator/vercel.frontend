import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authStorage } from './auth';

/**
 * Verified Production Render Backend Base URL (Versioned API)
 * Swagger docs: https://humorphic-lab-backend.onrender.com
 */
export const PRODUCTION_API_URL = 'https://humorphic-lab-backend.onrender.com/api/v1';

/**
 * Local Development Django Server Base URL (Versioned API)
 */
export const LOCAL_API_URL = 'http://localhost:8000/api/v1';

/**
 * Verified Backend API Endpoints (relative to /api/v1)
 */
export const API_ENDPOINTS = {
  HEALTH: '/health/',
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  LOGOUT: '/auth/logout/',
  ME: '/auth/me/',
  REFRESH: '/auth/refresh/',
  MODELS: '/3d-models/',
  USERS: '/users/',
  PRODUCTS: '/products/',
} as const;

/**
 * Extracts and formats meaningful validation and system error messages from backend responses.
 * Handles:
 * - 500 Internal Server Errors (prevents raw stack traces)
 * - 502/503/504 Cold starts & Service Unavailable
 * - 401 Authentication & credential failures
 * - 400 Field-level serializer validation (Username/Email collision, weak password, etc.)
 */
export function extractApiErrorMessage(err: any, fallbackMessage: string): string {
  if (!err) return fallbackMessage;

  // Network / server offline check
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Unable to connect to the backend server. The production server may be waking up from sleep or experiencing network delay. Please try again.';
  }

  const status = err.response?.status;
  const responseData = err.response?.data;

  // 502 / 503 / 504 Gateway / Service Unavailable
  if (status === 502 || status === 503 || status === 504) {
    return 'The backend service is temporarily waking up or unavailable. Please wait a moment and try again.';
  }

  // 500 Internal Server Error
  if (status === 500 || (responseData && typeof responseData === 'object' && responseData.status_code === 500)) {
    return 'The backend server encountered an internal error. Please try again in a few moments.';
  }

  // 401 Unauthorized / Invalid Credentials
  if (status === 401) {
    if (responseData && typeof responseData === 'object' && responseData.message) {
      if (!responseData.message.includes('error occurred during request processing')) {
        return responseData.message;
      }
    }
    return 'Invalid credentials provided. Please check your username and password.';
  }

  if (!responseData || typeof responseData !== 'object') {
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
        } else if (field === 'non_field_errors' || field === 'password') {
          if (lower.includes('too common')) {
            messages.push('Password is too common.');
          } else if (lower.includes('too short')) {
            messages.push('Password must be at least 8 characters.');
          } else if (lower.includes('entirely numeric')) {
            messages.push('Password cannot be entirely numeric.');
          } else {
            messages.push(rawMsg);
          }
        } else {
          const formattedField = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          messages.push(rawMsg.startsWith(formattedField) ? rawMsg : `${formattedField}: ${rawMsg}`);
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
 *    Guarantees it ends with '/api/v1'.
 * 2. Defaults to PRODUCTION_API_URL ('https://humorphic-lab-backend.onrender.com/api/v1')
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api/v1')) {
      clean += '/api/v1';
    }
    return clean;
  }

  // Client-side host detection fallback
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    if (!isLocal) {
      return PRODUCTION_API_URL;
    }
    // Default to production Render backend even locally if no local Django server is configured
    return PRODUCTION_API_URL;
  }

  // Node server-side build/runtime fallback
  return PRODUCTION_API_URL;
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

// Request Interceptor: Ensure correct baseURL with /api/v1 & attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Dynamically guarantee baseURL is resolved from centralized configuration
    let base = getApiBaseUrl().replace(/\/+$/, '');
    if (!base.endsWith('/api/v1')) {
      base += '/api/v1';
    }
    config.baseURL = base;

    // Normalize relative path so it never duplicates /api/v1/api/v1/
    if (config.url && !config.url.startsWith('http')) {
      let path = config.url.startsWith('/') ? config.url : `/${config.url}`;
      if (path.startsWith('/api/v1/')) {
        path = path.slice(7); // strip redundant '/api/v1' prefix
      }
      config.url = path;
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
        let baseUrl = getApiBaseUrl().replace(/\/+$/, '');
        if (!baseUrl.endsWith('/api/v1')) {
          baseUrl += '/api/v1';
        }
        const refreshEndpoint = `${baseUrl}/auth/refresh/`;
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

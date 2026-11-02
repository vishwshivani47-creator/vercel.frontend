import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types/auth.types';

export const authService = {
  /**
   * Register a new user
   * Verified Swagger endpoint: POST /api/v1/auth/register/
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.REGISTER, payload);
    authStorage.setTokens(data.access, data.refresh);
    authStorage.setUser(data.user);
    return data;
  },

  /**
   * Authenticate user with credentials
   * Verified Swagger endpoint: POST /api/v1/auth/login/
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, payload);
    authStorage.setTokens(data.access, data.refresh);
    authStorage.setUser(data.user);
    return data;
  },

  /**
   * Blacklist refresh token and logout
   * Verified Swagger endpoint: POST /api/v1/auth/logout/
   */
  async logout(): Promise<void> {
    const refresh = authStorage.getRefreshToken();
    try {
      if (refresh) {
        await apiClient.post(API_ENDPOINTS.LOGOUT, { refresh });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      authStorage.clearTokens();
    }
  },

  /**
   * Fetch current authenticated user profile
   * Verified Swagger endpoint: GET /api/v1/auth/me/
   */
  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>(API_ENDPOINTS.ME);
    authStorage.setUser(data);
    return data;
  },
};

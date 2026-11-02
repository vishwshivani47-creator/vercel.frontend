import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { User } from '@/types/auth.types';

export const usersService = {
  async getProfile(): Promise<User> {
    const { data } = await apiClient.get<User>(API_ENDPOINTS.ME);
    return data;
  },

  async updateProfile(id: string, payload: Partial<User>): Promise<User> {
    const { data } = await apiClient.patch<User>(`${API_ENDPOINTS.USERS}${id}/`, payload);
    return data;
  },
};

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { Model3D, Category, PaginatedResponse } from '@/types/models3d.types';

export const modelsService = {
  async getModels(params?: {
    category?: string;
    search?: string;
    page?: number;
    featured?: boolean;
    format?: string;
  }): Promise<PaginatedResponse<Model3D>> {
    const { data } = await apiClient.get<PaginatedResponse<Model3D>>(API_ENDPOINTS.MODELS, {
      params,
    });
    return data;
  },

  async getModelById(id: string): Promise<Model3D> {
    const { data } = await apiClient.get<Model3D>(`${API_ENDPOINTS.MODELS}${id}/`);
    return data;
  },

  async getMyModels(page = 1): Promise<PaginatedResponse<Model3D>> {
    const { data } = await apiClient.get<PaginatedResponse<Model3D>>(`${API_ENDPOINTS.MODELS}my_models/`, {
      params: { page },
    });
    return data;
  },

  async getCategories(): Promise<PaginatedResponse<Category>> {
    const { data } = await apiClient.get<PaginatedResponse<Category>>(`${API_ENDPOINTS.MODELS}categories/`);
    return data;
  },

  async uploadModel(formData: FormData): Promise<Model3D> {
    const { data } = await apiClient.post<Model3D>(API_ENDPOINTS.MODELS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async deleteModel(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.MODELS}${id}/`);
  },
};

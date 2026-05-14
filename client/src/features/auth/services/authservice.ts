import { apiClient } from '../../../core/api/apiClient';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/authtypes';
import type { ApiResponse, NoData } from '../../../core/types/ApiResponse';

export const authService = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<NoData>> => {
    return await apiClient<NoData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async (): Promise<ApiResponse<NoData>> => {
    return await apiClient<NoData>('/auth/logout', {
      method: 'POST',
    });
  },
};
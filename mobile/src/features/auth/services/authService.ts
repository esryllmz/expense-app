import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse } from '../../../core/types/ApiResponse';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types/authTypes';

export const authService = {
  async login(request: LoginRequest) {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      request
    );

    return response.data;
  },

  async register(request: RegisterRequest) {
    const response = await apiClient.post<ApiResponse<null>>(
      '/auth/register',
      request
    );

    return response.data;
  },

  async refreshToken(refreshToken: string) {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/refresh-token',
      { refreshToken }
    );

    return response.data;
  },

  async logout() {
    const response = await apiClient.post<ApiResponse<null>>('/auth/logout');

    return response.data;
  },

  async me() {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');

    return response.data;
  },
};

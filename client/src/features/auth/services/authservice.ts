import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse, NoData } from '../../../core/types/ApiResponse';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types/authTypes';

export const authService = {
  login: (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: (data: RegisterRequest): Promise<ApiResponse<NoData>> => {
    return apiClient<NoData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: (): Promise<ApiResponse<NoData>> => {
    return apiClient<NoData>('/auth/logout', {
      method: 'POST',
    });
  },

  me: (): Promise<ApiResponse<User>> => {
    return apiClient<User>('/auth/me', {
      method: 'GET',
    });
  },
};
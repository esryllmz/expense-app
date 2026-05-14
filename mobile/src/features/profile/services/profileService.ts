import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse } from '../../../core/types/ApiResponse';

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const profileService = {
  async updateProfile(request: UpdateProfileRequest) {
    const response = await apiClient.put<ApiResponse<null>>('/users/profile', request);
    return response.data;
  },

  async changePassword(request: ChangePasswordRequest) {
    const response = await apiClient.patch<ApiResponse<null>>(
      '/users/change-password',
      request
    );

    return response.data;
  },
};
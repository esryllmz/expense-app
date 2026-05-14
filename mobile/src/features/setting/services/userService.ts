import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse } from '../../../core/types/ApiResponse';
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../types/userTypes';

export const userService = {
  async updateProfile(request: UpdateProfileRequest) {
    const response = await apiClient.put<ApiResponse<null>>(
      '/users/profile',
      request
    );

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

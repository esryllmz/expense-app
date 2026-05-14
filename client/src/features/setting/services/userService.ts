import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse, NoData } from '../../../core/types/ApiResponse';
import type { User } from '../../auth/types/authtypes';

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const userService = {
  updateProfile: (
    data: UpdateProfileRequest
  ): Promise<ApiResponse<User | NoData>> => {
    return apiClient<User | NoData>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword: (
    data: ChangePasswordRequest
  ): Promise<ApiResponse<NoData>> => {
    return apiClient<NoData>('/users/change-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
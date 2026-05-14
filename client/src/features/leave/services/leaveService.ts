import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse, NoData } from '../../../core/types/ApiResponse';
import type {
  CreateLeaveRequest,
  Leave,
  UpdateLeaveStatusRequest,
} from '../types/leaveTypes';

export const leaveService = {
  getMine: (): Promise<ApiResponse<Leave[]>> => {
    return apiClient<Leave[]>('/leaves/me');
  },

  getSubordinates: (): Promise<ApiResponse<Leave[]>> => {
    return apiClient<Leave[]>('/leaves/subordinates');
  },

  create: (data: CreateLeaveRequest): Promise<ApiResponse<NoData>> => {
    return apiClient<NoData>('/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: (
    id: number,
    data: UpdateLeaveStatusRequest
  ): Promise<ApiResponse<NoData>> => {
    return apiClient<NoData>(`/leaves/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
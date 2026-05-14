import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse } from '../../../core/types/ApiResponse';
import type { CreateLeaveRequest, Leave, RequestStatus } from '../types/leaveTypes';

export const leaveService = {
  async getMyLeaves() {
    const response = await apiClient.get<ApiResponse<Leave[]>>('/leaves/me');
    return response.data;
  },

  async getSubordinateLeaves() {
    const response = await apiClient.get<ApiResponse<Leave[]>>('/leaves/subordinates');
    return response.data;
  },

  async createLeave(request: CreateLeaveRequest) {
    const response = await apiClient.post<ApiResponse<null>>('/leaves', request);
    return response.data;
  },

  async updateStatus(leaveId: number, status: Exclude<RequestStatus, 'PENDING'>) {
    const response = await apiClient.patch<ApiResponse<null>>(`/leaves/${leaveId}/status`, {
      status,
    });

    return response.data;
  },
};
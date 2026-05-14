import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse } from '../../../core/types/ApiResponse';
import type {
  CreateLeaveRequest,
  Leave,
  RequestStatus,
} from '../types/leaveTypes';

const filterPendingLeaves = (leaves: Leave[]) => {
  return leaves.filter((leave) => leave.status === 'PENDING');
};

export const leaveService = {
  async getMine() {
    const response = await apiClient.get<ApiResponse<Leave[]>>('/leaves/me');
    return response.data;
  },

  async getSubordinates() {
    const response = await apiClient.get<ApiResponse<Leave[]>>(
      '/leaves/subordinates'
    );

    return response.data;
  },

  async getMinePending() {
    const response = await this.getMine();

    return {
      ...response,
      data: response.data ? filterPendingLeaves(response.data) : [],
    };
  },

  async getSubordinatesPending() {
    const response = await this.getSubordinates();

    return {
      ...response,
      data: response.data ? filterPendingLeaves(response.data) : [],
    };
  },

  async create(request: CreateLeaveRequest) {
    const response = await apiClient.post<ApiResponse<Leave>>(
      '/leaves',
      request
    );

    return response.data;
  },

  async updateStatus(
    leaveId: number,
    status: Exclude<RequestStatus, 'PENDING'>
  ) {
    const response = await apiClient.patch<ApiResponse<null>>(
      `/leaves/${leaveId}/status`,
      { status }
    );

    return response.data;
  },
};
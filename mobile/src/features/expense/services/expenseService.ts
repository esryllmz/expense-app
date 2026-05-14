import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse } from '../../../core/types/ApiResponse';
import type {
  CreateExpenseRequest,
  Expense,
  RequestStatus,
} from '../types/expenseTypes';

export const expenseService = {
  async getMine() {
    const response = await apiClient.get<ApiResponse<Expense[]>>('/expenses/me');
    return response.data;
  },

  async getSubordinates() {
    const response = await apiClient.get<ApiResponse<Expense[]>>(
      '/expenses/subordinates'
    );
    return response.data;
  },

  async create(request: CreateExpenseRequest) {
    const response = await apiClient.post<ApiResponse<Expense>>(
      '/expenses',
      request
    );
    return response.data;
  },

  async updateStatus(
    expenseId: number,
    status: Exclude<RequestStatus, 'PENDING'>
  ) {
    const response = await apiClient.patch<ApiResponse<null>>(
      `/expenses/${expenseId}/status`,
      { status }
    );

    return response.data;
  },
};

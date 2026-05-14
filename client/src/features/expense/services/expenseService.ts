import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse, NoData } from '../../../core/types/ApiResponse';
import type {
  CreateExpenseRequest,
  Expense,
  UpdateExpenseStatusRequest,
} from '../types/expenseTypes';

export const expenseService = {
  getMine: (): Promise<ApiResponse<Expense[]>> => {
    return apiClient<Expense[]>('/expenses/me');
  },

  getSubordinates: (): Promise<ApiResponse<Expense[]>> => {
    return apiClient<Expense[]>('/expenses/subordinates');
  },

  create: (data: CreateExpenseRequest): Promise<ApiResponse<NoData>> => {
    return apiClient<NoData>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: (
    id: number,
    data: UpdateExpenseStatusRequest
  ): Promise<ApiResponse<NoData>> => {
    return apiClient<NoData>(`/expenses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  status: RequestStatus;
  employeeFullName: string;
  employeeId: number;
  createdDate: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
}

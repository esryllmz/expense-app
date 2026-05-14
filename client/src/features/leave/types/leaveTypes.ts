import type { RequestStatus } from '../../expense/types/expenseTypes';

export interface Leave {
  id: number;
  description: string;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  employeeFullName: string;
  employeeId: number;
}

export interface CreateLeaveRequest {
  description: string;
  startDate: string;
  endDate: string;
}

export interface UpdateLeaveStatusRequest {
  status: Exclude<RequestStatus, 'PENDING'>;
}
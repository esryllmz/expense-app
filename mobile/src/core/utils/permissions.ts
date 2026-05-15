import type { UserRole } from '../../features/auth/types/authTypes';
import type { RequestStatus } from '../../features/expense/types/expenseTypes';

export const canManageRequests = (role?: UserRole | null) =>
  role === 'ROLE_GM' || role === 'ROLE_TEAM_LEADER';

export const canCreateOwnRequest = (role?: UserRole | null) =>
  role === 'ROLE_EMPLOYEE' || role === 'ROLE_TEAM_LEADER';

export const isGM = (role?: UserRole | null) => role === 'ROLE_GM';

export const isTeamLead = (role?: UserRole | null) =>
  role === 'ROLE_TEAM_LEADER';

export const canApproveRequest = ({
  role,
  currentUserId,
  employeeId,
  status,
}: {
  role?: UserRole | null;
  currentUserId?: number | null;
  employeeId?: number | null;
  status?: RequestStatus | null;
}) => {
  return (
    canManageRequests(role) &&
    status === 'PENDING' &&
    Boolean(currentUserId) &&
    Boolean(employeeId) &&
    currentUserId !== employeeId
  );
};

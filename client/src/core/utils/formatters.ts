import type { UserRole } from '../../features/auth/types/authTypes';
import type { RequestStatus } from '../../features/expense/types/expenseTypes';

export const formatDate = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatCurrency = (value?: number | string | null) => {
  const numberValue = Number(value || 0);

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(numberValue);
};

export const calculateLeaveDays = (
  startDate?: string | null,
  endDate?: string | null
) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diff = end.getTime() - start.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const getTodayInputValue = () => {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().split('T')[0];
};

export const getStatusLabel = (status?: RequestStatus | string | null) => {
  switch (status) {
    case 'PENDING':
      return 'Beklemede';
    case 'APPROVED':
      return 'Onaylandı';
    case 'REJECTED':
      return 'Reddedildi';
    default:
      return '-';
  }
};

export const getRoleLabel = (role?: UserRole | string | null) => {
  switch (role) {
    case 'ROLE_GM':
      return 'Genel Müdür';
    case 'ROLE_TEAM_LEADER':
      return 'Takım Lideri';
    case 'ROLE_EMPLOYEE':
      return 'Personel';
    default:
      return 'Personel';
  }
};
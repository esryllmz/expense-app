export const formatCurrency = (value?: number | string | null) => {
  const numberValue = Number(value || 0);

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

export const formatDate = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatDateRange = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate || !endDate) return '-';

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '-';
  }

  const dayMonthFormatter = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
  });

  const yearFormatter = new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
  });

  return `${dayMonthFormatter.format(start)} - ${dayMonthFormatter.format(end)} ${yearFormatter.format(end)}`;
};

export const calculateLeaveDays = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diff = end.getTime() - start.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const isBeforeToday = (dateText: string) => {
  const selected = new Date(dateText);
  const today = new Date();

  if (Number.isNaN(selected.getTime())) {
    return true;
  }

  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return selected < today;
};

export const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
};

export const getStatusLabel = (status?: string) => {
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

export const getRoleLabel = (role?: string) => {
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
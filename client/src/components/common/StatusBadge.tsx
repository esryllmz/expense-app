import { getStatusLabel } from '../../core/utils/formatters';
import type { RequestStatus } from '../../features/expense/types/expenseTypes';

interface StatusBadgeProps {
  status?: RequestStatus | string | null;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const className =
    status === 'APPROVED'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'REJECTED'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-black ${className}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};
import { X, CheckCircle, XCircle } from 'lucide-react';
import { calculateLeaveDays, formatCurrency, formatDate, getStatusLabel } from '../core/utils/formatters';

type ApprovalType = 'EXPENSE' | 'LEAVE';

interface ApprovalModalProps {
  isOpen: boolean;
  type: ApprovalType;
  item: any | null;
  canAct?: boolean;
  loading?: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalModal = ({
  isOpen,
  type,
  item,
  canAct = false,
  loading = false,
  onClose,
  onApprove,
  onReject,
}: ApprovalModalProps) => {
  if (!isOpen || !item) return null;

  const isExpense = type === 'EXPENSE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-outline-variant/20 overflow-hidden">
        <div className="p-6 border-b border-surface-container flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-on-surface">
              {isExpense ? 'Masraf Talebi' : 'İzin Talebi'}
            </h2>

            <p className="text-sm text-on-surface-variant">
              Talep detaylarını inceleyebilirsiniz.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <InfoRow label="Talep Sahibi" value={item.employeeFullName || '-'} />
          <InfoRow label="Açıklama" value={item.description || '-'} />

          {isExpense ? (
            <>
              <InfoRow label="Tutar" value={formatCurrency(item.amount)} />
              <InfoRow label="Oluşturulma Tarihi" value={formatDate(item.createdDate)} />
            </>
          ) : (
            <>
              <InfoRow label="Başlangıç Tarihi" value={formatDate(item.startDate)} />
              <InfoRow label="Bitiş Tarihi" value={formatDate(item.endDate)} />
              <InfoRow
                label="Gün Sayısı"
                value={`${calculateLeaveDays(item.startDate, item.endDate)} gün`}
              />
            </>
          )}

          <InfoRow label="Durum" value={getStatusLabel(item.status)} />
        </div>

        {canAct && item.status === 'PENDING' && (
          <div className="p-6 border-t border-surface-container flex gap-3">
            <button
              type="button"
              onClick={onReject}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-error/10 text-error font-black hover:bg-error/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle size={18} />
              Reddet
            </button>

            <button
              type="button"
              onClick={onApprove}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-primary text-white font-black hover:bg-surface-tint flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle size={18} />
              Onayla
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
      {label}
    </p>

    <p className="text-sm font-bold text-on-surface mt-1">
      {value}
    </p>
  </div>
);
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../core/utils/formatters';
import type { Expense } from '../../features/expense/types/expenseTypes';
import type { Leave } from '../../features/leave/types/leaveTypes';

type ApprovalType = 'EXPENSE' | 'LEAVE';

interface ApprovalModalProps {
  isOpen: boolean;
  type: ApprovalType;
  item: Expense | Leave | null;
  canAct: boolean;
  loading?: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const isExpense = (item: Expense | Leave): item is Expense => {
  return 'amount' in item;
};

export const ApprovalModal = ({
  isOpen,
  type,
  item,
  canAct,
  loading = false,
  onClose,
  onApprove,
  onReject,
}: ApprovalModalProps) => {
  if (!isOpen || !item) return null;

  const title = type === 'EXPENSE' ? 'Masraf Detayı' : 'İzin Detayı';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-4xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-7 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Talep sahibi: {item.employeeFullName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-7 space-y-5">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Açıklama
            </p>

            <p className="mt-2 text-sm font-bold text-slate-900">
              {item.description}
            </p>
          </div>

          {isExpense(item) ? (
            <>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Tutar
                </p>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatCurrency(item.amount)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Oluşturma Tarihi
                </p>

                <p className="mt-2 text-sm font-bold text-slate-900">
                  {formatDate(item.createdDate)}
                </p>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Başlangıç
                </p>

                <p className="mt-2 text-sm font-bold text-slate-900">
                  {formatDate(item.startDate)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Bitiş
                </p>

                <p className="mt-2 text-sm font-bold text-slate-900">
                  {formatDate(item.endDate)}
                </p>
              </div>
            </div>
          )}

          {!canAct && (
            <div className="p-4 rounded-2xl bg-slate-50 text-sm text-slate-500">
              Bu talep için işlem yapamazsınız. Sadece bekleyen ve size bağlı
              personele ait talepler onaylanabilir veya reddedilebilir.
            </div>
          )}

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
            >
              Kapat
            </button>

            {canAct && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={onReject}
                  className="flex-1 py-4 rounded-2xl font-black bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Reddet
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={onApprove}
                  className="flex-1 py-4 rounded-2xl font-black bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Onayla
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
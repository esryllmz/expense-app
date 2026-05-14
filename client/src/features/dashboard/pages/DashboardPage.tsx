import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  FileText,
  MoreHorizontal,
  Receipt,
  TurkishLira,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ApprovalModal } from '../../../components/common/ApprovalModal';
import { DataState } from '../../../components/common/DataState';
import { StatusBadge } from '../../../components/common/StatusBadge';
import type { RootState } from '../../../core/store/store';
import { formatCurrency, formatDate } from '../../../core/utils/formatters';
import { canApproveRequest, canManageRequests } from '../../../core/utils/permissions';
import { expenseService } from '../../expense/services/expenseService';
import type { Expense, RequestStatus } from '../../expense/types/expenseTypes';
import { leaveService } from '../../leave/services/leaveService';
import type { Leave } from '../../leave/types/leaveTypes';

const DashboardPage = () => {
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.auth.user);

  const manageable = canManageRequests(user?.role);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const [expenseResponse, leaveResponse] = await Promise.all([
        manageable ? expenseService.getSubordinates() : expenseService.getMine(),
        manageable ? leaveService.getSubordinates() : leaveService.getMine(),
      ]);

      setExpenses(expenseResponse.data || []);
      setLeaves(leaveResponse.data || []);
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setLoading(false);
    }
  }, [manageable]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );
  }, [expenses]);

  const pendingApprovalCount = useMemo(() => {
    return [...expenses, ...leaves].filter((item) => item.status === 'PENDING')
      .length;
  }, [expenses, leaves]);

  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 5);
  }, [expenses]);

  const selectedCanAct = useMemo(() => {
    return canApproveRequest({
      role: user?.role,
      currentUserId: user?.id,
      employeeId: selectedExpense?.employeeId,
      status: selectedExpense?.status,
    });
  }, [selectedExpense, user?.id, user?.role]);

  const updateExpenseStatus = async (
    expenseId: number,
    status: Exclude<RequestStatus, 'PENDING'>
  ) => {
    setApprovalLoading(true);

    try {
      await expenseService.updateStatus(expenseId, { status });
      setSelectedExpense(null);
      await loadDashboard();
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-6">
        <SummaryCard
          title="Toplam Masraf"
          value={formatCurrency(totalExpenseAmount)}
          description="Listelenen masraf taleplerinin toplamı"
          icon={<TurkishLira size={22} />}
        />

        <SummaryCard
          title="Bekleyen Onaylar"
          value={pendingApprovalCount.toString()}
          description={
            manageable
              ? 'İşlem bekleyen bağlı personel talepleri'
              : 'Bekleyen talepleriniz'
          }
          icon={<Clock3 size={22} />}
        />

        <SummaryCard
          title="İzin Talepleri"
          value={leaves.length.toString()}
          description="Listelenen izin talepleri"
          icon={<FileText size={22} />}
        />
      </div>

      <section className="bg-white rounded-[2rem] border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
          <h2 className="text-lg font-black text-on-surface">
            Son Masraf Talepleri
          </h2>

          <button
            onClick={() => navigate('/expenses')}
            className="text-primary font-bold text-sm hover:underline"
          >
            Tümünü Gör
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low">
              <tr className="text-left text-on-surface-variant">
                <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">
                  Talep Detayı
                </th>
                <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">
                  Tutar
                </th>
                <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">
                  Tarih
                </th>
                <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">
                  Durum
                </th>
                <th className="px-6 py-4 font-black text-xs uppercase tracking-widest text-right">
                  İşlem
                </th>
              </tr>
            </thead>

            <tbody>
              <DataState
                loading={loading}
                empty={!loading && recentExpenses.length === 0}
                emptyText="Masraf talebi bulunamadı."
                colSpan={5}
              />

              {!loading &&
                recentExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-t border-outline-variant/10"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Receipt size={18} />
                        </div>

                        <div>
                          <p className="font-bold text-on-surface">
                            {expense.description}
                          </p>

                          {manageable && (
                            <p className="text-xs text-on-surface-variant mt-1">
                              Talep sahibi: {expense.employeeFullName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold">
                      {formatCurrency(expense.amount)}
                    </td>

                    <td className="px-6 py-4">
                      {formatDate(expense.createdDate)}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={expense.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedExpense(expense)}
                        className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary"
                        title="Detay"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <ApprovalModal
        isOpen={!!selectedExpense}
        type="EXPENSE"
        item={selectedExpense}
        canAct={selectedCanAct}
        loading={approvalLoading}
        onClose={() => setSelectedExpense(null)}
        onApprove={() =>
          selectedExpense && updateExpenseStatus(selectedExpense.id, 'APPROVED')
        }
        onReject={() =>
          selectedExpense && updateExpenseStatus(selectedExpense.id, 'REJECTED')
        }
      />
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="bg-white rounded-[2rem] border border-outline-variant/20 shadow-sm p-6 flex items-start justify-between">
      <div>
        <p className="text-sm text-on-surface-variant">{title}</p>
        <p className="text-3xl font-black text-on-surface mt-8">{value}</p>
        <p className="text-xs text-success mt-2">{description}</p>
      </div>

      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
};

export default DashboardPage;
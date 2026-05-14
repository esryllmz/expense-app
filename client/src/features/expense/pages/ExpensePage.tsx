import { useCallback, useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Plus, Receipt } from 'lucide-react';
import { useSelector } from 'react-redux';
import { ApprovalModal } from '../../../components/common/ApprovalModal';
import { DataState } from '../../../components/common/DataState';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { ViewTabs } from '../../../components/common/ViewTabs';
import type { RootState } from '../../../core/store/store';
import { formatCurrency, formatDate } from '../../../core/utils/formatters';
import {
  canApproveRequest,
  canCreateOwnRequest,
  canManageRequests,
  isGM,
  isTeamLead,
} from '../../../core/utils/permissions';
import { ExpenseModal } from '../components/ExpenseModal';
import { expenseService } from '../services/expenseService';
import type { Expense, RequestStatus } from '../types/expenseTypes';

type ExpenseView = 'mine' | 'subordinates';

export const ExpensesPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const manageable = canManageRequests(user?.role);
  const gm = isGM(user?.role);
  const teamLead = isTeamLead(user?.role);
  const canCreate = canCreateOwnRequest(user?.role);

  const [view, setView] = useState<ExpenseView>('mine');

  useEffect(() => {
    if (!user?.role) return;

    if (gm) {
      setView('subordinates');
      return;
    }

    if (teamLead) {
      setView((currentView) => currentView || 'subordinates');
      return;
    }

    setView('mine');
  }, [user?.role, gm, teamLead]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const loadExpenses = useCallback(async () => {
    if (!user?.role) return;

    setLoading(true);

    try {
      const response =
        gm || view === 'subordinates'
          ? await expenseService.getSubordinates()
          : await expenseService.getMine();

      setExpenses(response.data || []);
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setLoading(false);
    }
  }, [view, user?.role, gm]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

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
      await loadExpenses();
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setApprovalLoading(false);
    }
  };

  const tabs = useMemo(() => {
    if (!teamLead) return [];

    return [
      { label: 'Onay Talepleri', value: 'subordinates' as const },
      { label: 'Benim Taleplerim', value: 'mine' as const },
    ];
  }, [teamLead]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface">Masraf Yönetimi</h1>

          <p className="text-sm text-on-surface-variant">
            {view === 'subordinates'
              ? user?.role === 'ROLE_GM'
                ? 'Organizasyon içindeki masraf taleplerini görüntüleyebilir ve yönetebilirsiniz.'
                : 'Bağlı personelinizin masraf taleplerini görüntüleyebilir ve yönetebilirsiniz.'
              : 'Kendi masraf taleplerinizi görüntüleyebilir ve yeni talep oluşturabilirsiniz.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {teamLead && (
            <ViewTabs<ExpenseView>
              value={view}
              items={tabs}
              onChange={setView}
            />
          )}
          {canCreate && view === 'mine' && !gm && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-3 rounded-2xl bg-primary text-white font-black flex items-center gap-2 hover:bg-surface-tint"
            >
              <Plus size={18} />
              Yeni Masraf
            </button>
          )}
        </div>
      </div>

      <section className="bg-white rounded-[2rem] border border-outline-variant/20 shadow-sm overflow-hidden">
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
                empty={!loading && expenses.length === 0}
                emptyText="Masraf talebi bulunamadı."
                colSpan={5}
              />

              {!loading &&
                expenses.map((expense) => (
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

                          {view === 'subordinates' && (
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

      <ExpenseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadExpenses}
      />

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
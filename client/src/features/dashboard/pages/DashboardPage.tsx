import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, FileText, MoreHorizontal, Receipt, TurkishLira } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../core/store/store';
import { apiClient } from '../../../core/api/apiClient';
import { formatCurrency, formatDate, getStatusLabel } from '../../../core/utils/formatters';
import { ApprovalModal } from '../../../components/ApprovalModal';

interface Expense {
  id: number;
  description: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employeeFullName: string;
  employeeId: number;
  createdDate: string;
}

interface Leave {
  id: number;
  description: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employeeFullName: string;
  employeeId: number;
}

const DashboardPage = () => {
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.auth.user);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const isManager =
    user?.role === 'ROLE_GM' || user?.role === 'ROLE_TEAM_LEADER';

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const expenseEndpoint = isManager ? '/expenses/subordinates' : '/expenses/me';
      const leaveEndpoint = isManager ? '/leaves/subordinates' : '/leaves/me';

      const [expenseResponse, leaveResponse] = await Promise.all([
        apiClient<Expense[]>(expenseEndpoint),
        apiClient<Leave[]>(leaveEndpoint),
      ]);

      setExpenses(expenseResponse.data || []);
      setLeaves(leaveResponse.data || []);
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  const pendingApprovalCount = useMemo(() => {
    return [...expenses, ...leaves].filter((item) => item.status === 'PENDING').length;
  }, [expenses, leaves]);

  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 5);
  }, [expenses]);

  const updateExpenseStatus = async (
    expenseId: number,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    setApprovalLoading(true);

    try {
      await apiClient<null>(`/expenses/${expenseId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

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
          description={isManager ? 'İşlem bekleyen bağlı personel talepleri' : 'Bekleyen talepleriniz'}
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
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                    Yükleniyor...
                  </td>
                </tr>
              )}

              {!loading && recentExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                    Masraf talebi bulunamadı.
                  </td>
                </tr>
              )}

              {!loading &&
                recentExpenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-outline-variant/10">
                    <td className="px-6 py-4">
                      <p className="font-bold text-on-surface">{expense.description}</p>

                      {isManager && (
                        <p className="text-xs text-on-surface-variant mt-1">
                          Talep sahibi: {expense.employeeFullName}
                        </p>
                      )}
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
        canAct={isManager}
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

const StatusBadge = ({ status }: { status: string }) => {
  const className =
    status === 'APPROVED'
      ? 'bg-success/10 text-success border-success/20'
      : status === 'REJECTED'
        ? 'bg-error/10 text-error border-error/20'
        : 'bg-warning/10 text-warning border-warning/20';

  return (
    <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-black ${className}`}>
      {getStatusLabel(status)}
    </span>
  );
};

export default DashboardPage;
import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../core/api/apiClient';
import { DollarSign, Clock, FileText, MoreVertical } from 'lucide-react';

interface Expense {
  id: number;
  description: string;
  amount: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
  vendor?: string; // Eğer backend'den dönüyorsa
}

const DashboardPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        // Backend: ExpenseController (@GetMapping("/me"))
        const response = await apiClient<Expense[]>('/expenses/me');
        if (response.success && response.data) {
          setExpenses(response.data);
        }
      } catch (error) {
        console.error('Harcamalar yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // İstatistikleri dinamik hesaplama
  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'PENDING').length;
  const activeProjects = 12; // Sabit veya başka bir endpoint'ten çekilebilir

  return (
    <div className="flex flex-col gap-8">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Spending" 
          amount={`$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          trend="+12.5% from last month" 
          icon={<DollarSign size={20} />} 
          trendUp={true} 
        />
        <StatCard 
          title="Pending Approvals" 
          amount={pendingCount.toString()} 
          trend="Requires your attention" 
          icon={<Clock size={20} className="text-amber-600" />} 
          trendUp={false} 
        />
        <StatCard 
          title="Active Projects" 
          amount={activeProjects.toString()} 
          trend="2 projects ending soon" 
          icon={<FileText size={20} className="text-primary" />} 
          trendUp={true} 
        />
      </div>

      {/* Harcama Tablosu */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-container-high flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-on-surface">Recent Expense Reports</h2>
          <button className="text-sm font-semibold text-primary hover:text-primary-fixed-variant transition-colors">
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-surface-container-high">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Report Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-outline">Loading records...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-outline">No recent expenses found.</td></tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-surface-container-lowest/50 transition-colors group bg-white">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-on-surface">{expense.description}</div>
                      <div className="text-xs text-secondary mt-1">Vendor: {expense.vendor || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono tracking-tight text-on-surface">
                      ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {new Date(expense.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={expense.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Yardımcı Bileşenler ---

const StatCard = ({ title, amount, trend, icon, trendUp }: any) => (
  <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <span className="text-sm font-medium text-on-surface-variant">{title}</span>
      <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center border border-outline-variant/10 text-primary">
        {icon}
      </div>
    </div>
    <div>
      <div className="text-3xl font-bold text-on-surface tracking-tight mb-2">{amount}</div>
      <div className={`text-xs font-medium flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
        {trend}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: Expense['status'] }) => {
  const getStyles = () => {
    switch (status) {
      case 'APPROVED': return "bg-emerald-50 text-emerald-700 border-emerald-200 indicator-emerald";
      case 'PENDING': return "bg-amber-50 text-amber-700 border-amber-200 indicator-amber";
      case 'REJECTED': return "bg-rose-50 text-rose-700 border-rose-200 indicator-rose";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getIndicatorColor = () => {
    switch (status) {
      case 'APPROVED': return "bg-emerald-500";
      case 'PENDING': return "bg-amber-500";
      case 'REJECTED': return "bg-rose-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStyles()}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getIndicatorColor()}`}></span>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

export default DashboardPage;
import { useEffect, useState } from 'react';
import { CalendarDays, MoreHorizontal, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../core/store/store';
import { apiClient } from '../../../core/api/apiClient';
import { calculateLeaveDays, formatDate, getStatusLabel } from '../../../core/utils/formatters';
import { LeaveModal } from '../components/LeaveModal';
import { ApprovalModal } from '../../../components/ApprovalModal';

interface Leave {
  id: number;
  description: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employeeFullName: string;
  employeeId: number;
}

export const LeavePage = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const isManager =
    user?.role === 'ROLE_GM' || user?.role === 'ROLE_TEAM_LEADER';

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const loadLeaves = async () => {
    setLoading(true);

    try {
      const endpoint = isManager ? '/leaves/subordinates' : '/leaves/me';
      const response = await apiClient<Leave[]>(endpoint);

      setLeaves(response.data || []);
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const updateLeaveStatus = async (
    leaveId: number,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    setApprovalLoading(true);

    try {
      await apiClient<null>(`/leaves/${leaveId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      setSelectedLeave(null);
      await loadLeaves();
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface">İzinler</h1>
          <p className="text-sm text-on-surface-variant">
            {isManager
              ? 'Bağlı personelinizin izin taleplerini görüntüleyebilirsiniz.'
              : 'Kendi izin taleplerinizi görüntüleyebilir ve yeni talep oluşturabilirsiniz.'}
          </p>
        </div>

        {!isManager && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-3 rounded-2xl bg-primary text-white font-black flex items-center gap-2 hover:bg-surface-tint"
          >
            <Plus size={18} />
            Yeni İzin
          </button>
        )}
      </div>

      <section className="bg-white rounded-[2rem] border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low">
              <tr className="text-left text-on-surface-variant">
                <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">
                  Açıklama
                </th>
                <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">
                  Başlangıç
                </th>
                <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">
                  Bitiş
                </th>
                <th className="px-6 py-4 font-black text-xs uppercase tracking-widest">
                  Gün
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
                  <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                    Yükleniyor...
                  </td>
                </tr>
              )}

              {!loading && leaves.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                    İzin talebi bulunamadı.
                  </td>
                </tr>
              )}

              {!loading &&
                leaves.map((leave) => (
                  <tr key={leave.id} className="border-t border-outline-variant/10">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <CalendarDays size={18} />
                        </div>

                        <div>
                          <p className="font-bold text-on-surface">{leave.description}</p>

                          {isManager && (
                            <p className="text-xs text-on-surface-variant mt-1">
                              Talep sahibi: {leave.employeeFullName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">{formatDate(leave.startDate)}</td>
                    <td className="px-6 py-4">{formatDate(leave.endDate)}</td>

                    <td className="px-6 py-4 font-bold">
                      {calculateLeaveDays(leave.startDate, leave.endDate)} gün
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={leave.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLeave(leave)}
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

      <LeaveModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadLeaves}
      />

      <ApprovalModal
        isOpen={!!selectedLeave}
        type="LEAVE"
        item={selectedLeave}
        canAct={isManager}
        loading={approvalLoading}
        onClose={() => setSelectedLeave(null)}
        onApprove={() =>
          selectedLeave && updateLeaveStatus(selectedLeave.id, 'APPROVED')
        }
        onReject={() =>
          selectedLeave && updateLeaveStatus(selectedLeave.id, 'REJECTED')
        }
      />
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
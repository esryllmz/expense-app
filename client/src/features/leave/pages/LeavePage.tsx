import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, MoreHorizontal, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { ApprovalModal } from '../../../components/common/ApprovalModal';
import { DataState } from '../../../components/common/DataState';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { ViewTabs } from '../../../components/common/ViewTabs';
import type { RootState } from '../../../core/store/store';
import { calculateLeaveDays, formatDate } from '../../../core/utils/formatters';
import {
  canApproveRequest,
  canCreateOwnRequest,
  canManageRequests,
  isGM,
  isTeamLead,
} from '../../../core/utils/permissions';
import type { RequestStatus } from '../../expense/types/expenseTypes';
import { LeaveModal } from '../components/LeaveModal';
import { leaveService } from '../services/leaveService';
import type { Leave } from '../types/leaveTypes';

type LeaveView = 'mine' | 'subordinates';

export const LeavePage = () => {
  const user = useSelector((state: RootState) => state.auth.user);

 const manageable = canManageRequests(user?.role);
  const gm = isGM(user?.role);
  const teamLead = isTeamLead(user?.role);
  const canCreate = canCreateOwnRequest(user?.role);

  const [view, setView] = useState<LeaveView>('mine');

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

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

 const loadLeaves = useCallback(async () => {
    if (!user?.role) return;

    setLoading(true);

    try {
      const response =
        gm || view === 'subordinates'
          ? await leaveService.getSubordinates()
          : await leaveService.getMine();

      setLeaves(response.data || []);
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setLoading(false);
    }
  }, [view, user?.role, gm]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const selectedCanAct = useMemo(() => {
    return canApproveRequest({
      role: user?.role,
      currentUserId: user?.id,
      employeeId: selectedLeave?.employeeId,
      status: selectedLeave?.status,
    });
  }, [selectedLeave, user?.id, user?.role]);

  const updateLeaveStatus = async (
    leaveId: number,
    status: Exclude<RequestStatus, 'PENDING'>
  ) => {
    setApprovalLoading(true);

    try {
      await leaveService.updateStatus(leaveId, { status });
      setSelectedLeave(null);
      await loadLeaves();
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
          <h1 className="text-2xl font-black text-on-surface">İzin Yönetimi</h1>

          <p className="text-sm text-on-surface-variant">
            {view === 'subordinates'
              ? user?.role === 'ROLE_GM'
                ? 'Organizasyon içindeki izin taleplerini görüntüleyebilir ve yönetebilirsiniz.'
                : 'Bağlı personelinizin izin taleplerini görüntüleyebilir ve yönetebilirsiniz.'
              : 'Kendi izin taleplerinizi görüntüleyebilir ve yeni talep oluşturabilirsiniz.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {teamLead && (
            <ViewTabs<LeaveView>
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
              Yeni İzin
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
              <DataState
                loading={loading}
                empty={!loading && leaves.length === 0}
                emptyText="İzin talebi bulunamadı."
                colSpan={6}
              />

              {!loading &&
                leaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-t border-outline-variant/10"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <CalendarDays size={18} />
                        </div>

                        <div>
                          <p className="font-bold text-on-surface">
                            {leave.description}
                          </p>

                          {view === 'subordinates' && (
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
        canAct={selectedCanAct}
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
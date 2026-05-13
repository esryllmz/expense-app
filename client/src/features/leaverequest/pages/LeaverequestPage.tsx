import React, { useState, useEffect } from 'react';
import { Plus, CalendarDays, ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { apiClient } from '../../../core/api/apiClient';
import { LeaveModal } from '../components/LeaverequestModal';

interface LeaverequestRequest {
  id: number;
  leaveType: string; // Örn: Yıllık İzin, Mazeret İzni
  startDate: string;
  endDate: string;
  duration: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const LeaverequestPage = () => {
  const [leaves, setLeaves] = useState<LeaverequestRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await apiClient<LeaverequestRequest[]>('/leaves/me');
      if (response.success && response.data) setLeaves(response.data);
    } catch (err) {
      console.error("İzinler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  return (
    <main className="flex-1 p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-outline-variant/20 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">İzin Taleplerim</h1>
          <p className="text-sm text-on-surface-variant font-medium">İzin haklarınızı ve geçmiş taleplerinizi takip edin.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-surface-tint transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} />
          Yeni İzin Talebi
        </button>
      </div>

      {/* List Section */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-outline font-medium">Yükleniyor...</div>
        ) : leaves.length === 0 ? (
          <div className="py-20 text-center text-outline font-medium bg-white rounded-3xl border border-dashed border-outline-variant">Henüz bir izin talebiniz bulunmuyor.</div>
        ) : (
          leaves.map((leave) => (
            <div key={leave.id} className="bg-white p-5 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Sol Taraf: İkon ve Bilgi */}
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <CalendarDays size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-on-surface text-lg">{leave.leaveType || 'Yıllık İzin'}</h3>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
                    <span>{new Date(leave.startDate).toLocaleDateString('tr-TR')}</span>
                    <span className="text-outline-variant">—</span>
                    <span>{new Date(leave.endDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              {/* Sağ Taraf: Süre, Durum ve Aksiyon */}
              <div className="flex items-center justify-between md:justify-end gap-12 border-t md:border-t-0 pt-4 md:pt-0 border-surface-container">
                <div className="text-right">
                  <span className="block text-2xl font-black text-primary leading-none">{leave.duration} Gün</span>
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Süre</span>
                </div>
                
                <div className="min-w-[120px] text-right">
                  <LeaveStatusBadge status={leave.status} />
                </div>

                <button className="p-2 hover:bg-surface-container rounded-full text-outline-variant group-hover:text-primary transition-all hidden md:block">
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <LeaveModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchLeaves} 
      />
    </main>
  );
};

const LeaveStatusBadge = ({ status }: { status: string }) => {
  const config: any = {
    PENDING: { label: 'Beklemede', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    APPROVED: { label: 'Onaylandı', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Reddedildi', style: 'bg-rose-50 text-rose-700 border-rose-200' }
  };
  const item = config[status] || config.PENDING;
  return (
    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black border uppercase tracking-wider ${item.style}`}>
      {item.label}
    </span>
  );
};
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Receipt, Check, X, Users, User } from 'lucide-react';
import { apiClient } from '../../../core/api/apiClient';
import type { RootState } from '../../../core/store/store';
import { ExpenseModal } from '../components/ExpenseModal';

export const ExpensesPage = () => {
  const [activeTab, setActiveTab] = useState<'ME' | 'SUBORDINATES'>('ME');
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useSelector((state: RootState) => state.auth);
  
  // Yetki Kontrolleri
  const userRoles = user?.roles?.map((r: any) => r.name) || [];
  const isGM = userRoles.includes('ROLE_GM');
  const isManager = userRoles.includes('ROLE_TEAM_LEADER') || isGM;
  const canCreate = !isGM; // GM talep oluşturmaz

  // Başlangıç sekmesini ayarla: GM ise doğrudan alt kadroya bakmalı
  useEffect(() => {
    if (isGM) setActiveTab('SUBORDINATES');
  }, [isGM]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Backend Endpoint Seçimi
      const endpoint = activeTab === 'ME' ? '/expenses/me' : '/expenses/subordinates';
      const response = await apiClient<any[]>(endpoint);
      if (response.success) setData(response.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleStatusUpdate = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      // Backend: @PatchMapping("/{id}/status")
      const response = await apiClient(`/expenses/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (response.success) fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <main className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">
            {isGM ? "Harcama Onay Merkezi" : "Harcama Taleplerim"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Sekme Değiştirici: Sadece MANAGER/GM görür */}
          {isManager && !isGM && (
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
              <button 
                onClick={() => setActiveTab('ME')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'ME' ? 'bg-white shadow-sm text-primary' : 'text-outline'}`}
              >
                <User size={14}/> Taleplerim
              </button>
              <button 
                onClick={() => setActiveTab('SUBORDINATES')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'SUBORDINATES' ? 'bg-white shadow-sm text-primary' : 'text-outline'}`}
              >
                <Users size={14}/> Ekibim
              </button>
            </div>
          )}

          {canCreate && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-surface-tint active:scale-95 transition-all">
              <Plus size={18} /> Yeni Talep
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-outline">Yükleniyor...</div>
        ) : data.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-outline-variant/30 shadow-sm flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Receipt size={20} />
                </div>
                <StatusBadge status={item.status} />
              </div>
              <h3 className="font-bold text-on-surface leading-tight">
                {activeTab === 'SUBORDINATES' && <span className="text-primary block text-[10px] uppercase mb-1">{item.employeeName}</span>}
                {item.description}
              </h3>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex justify-between items-end border-t border-surface-container pt-4">
                <span className="text-[10px] font-black text-outline uppercase tracking-widest">Tutar</span>
                <span className="text-xl font-black text-on-surface">₺{item.amount.toLocaleString('tr-TR')}</span>
              </div>

              {/* ONAY BUTONLARI: Sadece GM ve sadece beklemedeki alt kadro talepleri için */}
              {isGM && item.status === 'PENDING' && (
                <div className="flex gap-2 animate-in slide-in-from-bottom-2">
                  <button 
                    onClick={() => handleStatusUpdate(item.id, 'REJECTED')}
                    className="flex-1 py-2.5 bg-rose-50 text-rose-700 rounded-xl font-bold text-xs hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-1"
                  >
                    <X size={14}/> Red
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(item.id, 'APPROVED')}
                    className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-1"
                  >
                    <Check size={14}/> Onayla
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <ExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} />
    </main>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${styles[status]}`}>{status}</span>;
};
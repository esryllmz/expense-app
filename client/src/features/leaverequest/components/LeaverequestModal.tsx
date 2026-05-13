import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { apiClient } from '../../../core/api/apiClient';

export const LeaveModal = ({ isOpen, onClose, onSuccess }: any) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient('/leaves', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (response.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      alert("İzin talebi gönderilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-outline-variant/20 overflow-hidden animate-in zoom-in-95">
        <div className="p-8 border-b border-surface-container flex justify-between items-center">
          <h2 className="text-xl font-black text-on-surface tracking-tight">Yeni İzin Talebi Oluştur</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">İzin Türü</label>
            <select 
              className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-surface-container-lowest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-sm appearance-none"
              value={formData.leaveType}
              onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
            >
              <option value="ANNUAL">Yıllık İzin</option>
              <option value="SICK">Hastalık İzni</option>
              <option value="EXCUSE">Mazeret İzni</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Başlangıç</label>
              <input 
                type="date" required
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-surface-container-lowest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-sm"
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Bitiş</label>
              <input 
                type="date" required
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-surface-container-lowest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-sm"
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-on-surface-variant hover:bg-surface-container rounded-2xl">İptal</button>
            <button 
              disabled={loading}
              className="flex-1 bg-primary text-white py-4 rounded-2xl font-black hover:bg-surface-tint shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : 'Talebi Oluştur'}
              {!loading && <Send size={18} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
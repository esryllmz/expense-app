import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { apiClient } from '../../../core/api/apiClient';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LeaveModal = ({ isOpen, onClose, onSuccess }: LeaveModalProps) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    description: '',
  });

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      startDate: '',
      endDate: '',
      description: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      alert('Açıklama alanı boş olamaz.');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert('Başlangıç ve bitiş tarihi seçilmelidir.');
      return;
    }

    if (formData.endDate < formData.startDate) {
      alert('Bitiş tarihi başlangıç tarihinden önce olamaz.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient<null>('/leaves', {
        method: 'POST',
        body: JSON.stringify({
          description: formData.description.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate,
        }),
      });

      if (response.success) {
        onSuccess();
        handleClose();
      }
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-outline-variant/20 overflow-hidden animate-in zoom-in-95">
        <div className="p-8 border-b border-surface-container flex justify-between items-center">
          <h2 className="text-xl font-black text-on-surface tracking-tight">
            Yeni İzin Talebi Oluştur
          </h2>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-surface-container rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
                Başlangıç
              </label>

              <input
                type="date"
                required
                value={formData.startDate}
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-surface-container-lowest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-sm"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
                Bitiş
              </label>

              <input
                type="date"
                required
                value={formData.endDate}
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-surface-container-lowest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-sm"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endDate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
              Açıklama
            </label>

            <textarea
              required
              rows={4}
              value={formData.description}
              className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-surface-container-lowest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm resize-none"
              placeholder="İzin talebiniz için kısa bir açıklama yazın..."
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-4 font-bold text-on-surface-variant hover:bg-surface-container rounded-2xl"
            >
              İptal
            </button>

            <button
              type="submit"
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
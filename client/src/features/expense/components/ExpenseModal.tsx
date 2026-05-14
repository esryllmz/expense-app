import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { expenseService } from '../services/expenseService';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpenseModal = ({
  isOpen,
  onClose,
  onSuccess,
}: ExpenseModalProps) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
  });

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const description = formData.description.trim();
    const amount = Number(formData.amount);

    if (!description) {
      toast.error('Açıklama alanı boş olamaz.');
      return;
    }

    if (!formData.amount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Tutar 0’dan büyük olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      const response = await expenseService.create({
        description,
        amount,
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
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-outline-variant/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-surface-container flex justify-between items-center">
          <h2 className="text-xl font-black text-on-surface tracking-tight">
            Yeni Masraf Talebi
          </h2>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-surface-container rounded-full text-outline transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
              Açıklama
            </label>

            <input
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-surface-container-lowest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
              placeholder="Masraf detayını belirtin..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
              Tutar ₺
            </label>

            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: e.target.value,
                })
              }
              className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-surface-container-lowest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-black text-lg"
              placeholder="0,00"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-4 font-bold text-on-surface-variant hover:bg-surface-container rounded-2xl transition-all"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-4 rounded-2xl font-black hover:bg-surface-tint shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : 'Talebi Gönder'}
              {!loading && <Send size={18} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
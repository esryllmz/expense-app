import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Lock, Mail, Save, BadgeCheck } from 'lucide-react';
import { apiClient } from '../../../core/api/apiClient';
import type { RootState } from '../../../core/store/store';
import { toast } from 'react-toastify';

export const SettingsPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);

  // Form State: Sadece senin backend UpdateUserRequest yapına uygun alanlar
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  // Şifre State: ChangePasswordRequest yapısına uygun
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend: @PutMapping("/profile")
      const response = await apiClient('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      if (response.success) {
        toast.success("Bilgileriniz güncellendi.");
        // Not: Burada user bilgisini güncelleyen bir dispatch gerekebilir
      }
    } catch (err) {
      toast.error("Güncelleme sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Yeni şifreler uyuşmuyor.");
      return;
    }
    setLoading(true);
    try {
      // Backend: @PatchMapping("/change-password")
      const response = await apiClient('/users/change-password', {
        method: 'PATCH',
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      if (response.success) {
        toast.success("Şifreniz başarıyla değiştirildi.");
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error("Mevcut şifreniz hatalı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-on-surface tracking-tight">Profil Ayarları</h1>
        <p className="text-sm text-on-surface-variant">Hesap bilgilerinizi ve güvenlik tercihlerinizi buradan yönetebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Bilgi Kartı - Giriş Yapan Kişinin Özeti */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-outline-variant/30 flex items-center gap-6 shadow-sm">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">{user?.firstName} {user?.lastName}</h2>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
              <Mail size={14} className="text-outline" />
              {user?.email}
              <span className="mx-2 text-outline-variant">|</span>
              <span className="text-primary font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 bg-primary/5 rounded">
                {user?.roles?.[0]?.name.replace('ROLE_', '')}
              </span>
            </div>
          </div>
        </div>

        {/* Kişisel Bilgiler Formu */}
        <section className="bg-white rounded-[2rem] border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-surface-container flex items-center gap-3">
            <BadgeCheck size={20} className="text-primary" />
            <h3 className="font-bold text-on-surface">Kişisel Detaylar</h3>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-outline uppercase tracking-widest ml-1">Adınız</label>
                <input 
                  type="text" 
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-outline uppercase tracking-widest ml-1">Soyadınız</label>
                <input 
                  type="text" 
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium" 
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-surface-tint transition-all disabled:opacity-50 shadow-md"
              >
                <Save size={18} /> Güncelle
              </button>
            </div>
          </form>
        </section>

        {/* Şifre Güvenlik Formu */}
        <section className="bg-white rounded-[2rem] border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-surface-container flex items-center gap-3">
            <Lock size={20} className="text-primary" />
            <h3 className="font-bold text-on-surface">Güvenlik ve Şifre</h3>
          </div>
          <form onSubmit={handleChangePassword} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-outline uppercase tracking-widest ml-1">Mevcut Şifre</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-outline uppercase tracking-widest ml-1">Yeni Şifre</label>
                <input 
                  type="password" 
                  placeholder="Yeni şifre"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-outline uppercase tracking-widest ml-1">Yeni Şifre (Tekrar)</label>
                <input 
                  type="password" 
                  placeholder="Tekrar"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-3 bg-on-surface text-white rounded-xl font-bold hover:bg-on-surface-variant transition-all disabled:opacity-50"
              >
                Şifreyi Değiştir
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
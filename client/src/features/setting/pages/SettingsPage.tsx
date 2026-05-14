import React, { useEffect, useState } from 'react';
import { Lock, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../core/store/store';
import { setUser } from '../../auth/store/authSlice';
import { userService } from '../services/userService';

export const SettingsPage = () => {
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.auth.user);

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  }, [user?.firstName, user?.lastName]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();

    if (!firstName || !lastName) {
      toast.error('Ad ve soyad alanları boş olamaz.');
      return;
    }

    setProfileLoading(true);

    try {
      const response = await userService.updateProfile({
        firstName,
        lastName,
      });

      if (response.success && user) {
        if (response.data && 'id' in response.data) {
          dispatch(setUser(response.data));
        } else {
          dispatch(
            setUser({
              ...user,
              firstName,
              lastName,
            })
          );
        }
      }
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmNewPassword
    ) {
      toast.error('Şifre alanları boş olamaz.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('Yeni şifre ve tekrar şifre eşleşmiyor.');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      });

      if (response.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      }
    } catch {
      // apiClient toast gösteriyor.
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <section className="bg-white rounded-4xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-surface-container flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Save size={18} />
          </div>

          <div>
            <h2 className="text-lg font-black text-on-surface">
              Kişisel Detaylar
            </h2>
            <p className="text-sm text-on-surface-variant">
              Ad ve soyad bilgilerinizi güncelleyebilirsiniz.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
                Adınız
              </label>

              <input
                value={profileForm.firstName}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    firstName: e.target.value,
                  })
                }
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
                Soyadınız
              </label>

              <input
                value={profileForm.lastName}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    lastName: e.target.value,
                  })
                }
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-8 py-3 rounded-2xl bg-primary text-white font-black hover:bg-surface-tint disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={17} />
              {profileLoading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-4xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-surface-container flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Lock size={18} />
          </div>

          <div>
            <h2 className="text-lg font-black text-on-surface">
              Güvenlik ve Şifre
            </h2>
            <p className="text-sm text-on-surface-variant">
              Şifreniz en az 8 karakter, bir büyük harf, bir küçük harf ve bir
              rakam içermelidir.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
              Mevcut Şifre
            </label>

            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
                Yeni Şifre
              </label>

              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
                Yeni Şifre Tekrar
              </label>

              <input
                type="password"
                value={passwordForm.confirmNewPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmNewPassword: e.target.value,
                  })
                }
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-8 py-3 rounded-2xl bg-primary text-white font-black hover:bg-surface-tint disabled:opacity-50 flex items-center gap-2"
            >
              <Lock size={17} />
              {passwordLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
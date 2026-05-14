import React, { ChangeEvent, FormEvent, useState } from 'react';
import { ArrowRight, Building2, Lock, Mail, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const { login, register, isLoginLoading, isRegisterLoading } = useAuth();

  const loading = isLoginLoading || isRegisterLoading;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (isLogin) {
        await login({
          email: formData.email.trim(),
          password: formData.password,
        });
        return;
      }

      const response = await register({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });

      if (response.success) {
        toast.success('Kayıt başarılı. Lütfen giriş yapınız.');
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
        });
        setIsLogin(true);
      }
    } catch (err: any) {
      const message =
        err?.message || err?.message === ''
          ? err.message
          : 'Sunucu ile iletişim kurulamadı veya bilgiler hatalı.';

      setErrorMsg(message || 'İşlem başarısız oldu.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface to-surface-container-high p-4">
      <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(30,41,59,0.05)] border border-outline-variant/20 p-10 flex flex-col">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center mb-4 shadow-sm">
            <Building2 className="text-on-primary-container" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            CapitalFlow
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Enterprise Expense Management
          </p>
        </div>

        <div className="w-full border-t border-surface-container-high mb-6" />

        {errorMsg && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error font-medium text-center">
            {errorMsg}
          </div>
        )}

        <h2 className="text-lg font-semibold text-on-surface mb-4">
          {isLogin ? 'Hesabınıza giriş yapın' : 'Erişim talebi oluşturun'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex gap-4">
              <div className="flex flex-col gap-1 w-1/2">
                <label className="text-xs font-medium text-on-surface-variant">
                  Ad
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 text-outline" size={18} />
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full h-10 pl-10 pr-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="Ahmet"
                    required={!isLogin}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 w-1/2">
                <label className="text-xs font-medium text-on-surface-variant">
                  Soyad
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 text-outline" size={18} />
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full h-10 pl-10 pr-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="Yılmaz"
                    required={!isLogin}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-medium text-on-surface-variant"
              htmlFor="email"
            >
              İş E-postası
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 text-outline" size={18} />
              <input
                name="email"
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-10 pl-10 pr-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline/70"
                placeholder="ad.soyad@company.com"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-medium text-on-surface-variant"
              htmlFor="password"
            >
              Şifre
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 text-outline" size={18} />
              <input
                name="password"
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full h-10 pl-10 pr-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline/70"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-primary hover:bg-surface-tint text-on-primary text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'İşleniyor...' : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-surface-container-high text-center">
          <p className="text-sm text-on-surface-variant">
            {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
              className="text-sm font-semibold text-primary hover:text-primary-fixed-variant ml-1 transition-colors"
            >
              {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
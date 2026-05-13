import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../core/store/store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // 1. Durum Kontrolü: Redux state'i henüz yükleniyorsa (örneğin token doğrulanıyorsa)
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  // 2. Kimlik Kontrolü: Kullanıcı giriş yapmamışsa, Auth sayfasına (/) yönlendir
  if (!isAuthenticated) {
    // state={{ from: location }} sayesinde kullanıcı giriş yaptıktan sonra kaldığı yere geri dönebilir
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 3. Yetki (Rol) Kontrolü: Eğer bu sayfa özel bir rol gerektiriyorsa (Örn: ADMIN)
  if (requiredRole) {
    // Yorum satırındaki kurala göre: Roller bir nesne dizisi ve içinde 'name' var
    // user?.roles örneği: [{ id: 1, name: "ADMIN" }, { id: 2, name: "USER" }]
    const hasRole = user?.roles?.some((role: any) => role.name === requiredRole);
    
    // Alternatif (Eğer backend tek bir string dönüyorsa bunu kullan): 
    // const hasRole = user?.role === requiredRole;

    if (!hasRole) {
      // Yetkisi yoksa, güvenli liman olan dashboard'a geri gönder
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 4. Onay: Tüm kontrollerden başarıyla geçtiyse, istenen sayfayı göster
  return <>{children}</>;
};

export default ProtectedRoute;
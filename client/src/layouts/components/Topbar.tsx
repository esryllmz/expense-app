import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import type { RootState } from '../../core/store/store';
import { logout } from '../../features/auth/store/authSlice';
import { getRoleLabel } from '../../core/utils/formatters';

export const Topbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch();
  const location = useLocation();

  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Genel Bakış';
      case '/expenses':
        return 'Masraflar';
      case '/leaves':
        return 'İzinler';
      case '/settings':
        return 'Ayarlar';
      case '/admin':
        return 'Yönetici Paneli';
      default:
        return 'CapitalFlow';
    }
  };

  const avatarName =
    user?.firstName && user?.lastName
      ? `${user.firstName}+${user.lastName}`
      : 'Kullanıcı';

  return (
    <header className="bg-white/80 backdrop-blur-md shrink-0 sticky top-0 w-full z-30 border-b border-outline-variant/10 flex items-center justify-between px-8 h-16">
      <span className="text-lg font-black text-on-surface tracking-tight">
        {getPageTitle()}
      </span>

      <div className="flex items-center gap-6">
        <button className="text-on-surface-variant hover:text-primary transition-all relative p-2 rounded-lg hover:bg-surface-container-high">
          <Bell size={22} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white ring-1 ring-error/20" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-surface-container-low transition-all focus:outline-none group"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-on-surface">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Kullanıcı'}
              </span>

              <span className="text-[10px] text-on-surface-variant font-medium">
                {getRoleLabel(user?.role)}
              </span>
            </div>

            <div className="w-10 h-10 rounded-xl overflow-hidden border border-outline-variant/30 group-hover:border-primary/50 transition-colors shadow-sm">
              <img
                src={`https://ui-avatars.com/api/?name=${avatarName}&background=004ac6&color=fff&bold=true`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-outline-variant/10 py-3 animate-in fade-in zoom-in duration-150">
              <div className="px-5 py-3 border-b border-outline-variant/10 mb-2">
                <p className="text-sm font-black text-on-surface truncate">
                  {user?.firstName} {user?.lastName}
                </p>

                <p className="text-xs text-on-surface-variant truncate">
                  {user?.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-error hover:bg-error/5 transition-colors font-bold"
              >
                <LogOut size={18} />
                Güvenli Çıkış
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
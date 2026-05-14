import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { sessionStorageService } from '../core/auth/sessionStorage';
import type { RootState } from '../core/store/store';
import { authService } from '../features/auth/services/authservice';
import {
  logout as logoutAction,
  setUser,
} from '../features/auth/store/authSlice';
import type { UserRole } from '../features/auth/types/authtypes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const reduxUser = useSelector((state: RootState) => state.auth.user);

  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  const user = useMemo(() => {
    return reduxUser ?? sessionStorageService.getUser();
  }, [reduxUser]);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      if (!sessionStorageService.hasAnyToken()) {
        dispatch(logoutAction());

        if (isMounted) {
          setSessionValid(false);
          setCheckingSession(false);
        }

        return;
      }

      try {
        const response = await authService.me();

        if (response.success && response.data) {
          dispatch(setUser(response.data));

          if (isMounted) {
            setSessionValid(true);
          }
        } else {
          dispatch(logoutAction());

          if (isMounted) {
            setSessionValid(false);
          }
        }
      } catch {
        dispatch(logoutAction());

        if (isMounted) {
          setSessionValid(false);
        }
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  if (checkingSession) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (!sessionValid) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
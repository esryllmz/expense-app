import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import type { RootState } from '../core/store/store';
import type { UserRole } from '../features/auth/types/authtypes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useSelector(
    (state: RootState) => state.auth
  );

  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
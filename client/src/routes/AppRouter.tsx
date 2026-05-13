import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../features/dashboard/pages/Dashboard';
import AuthPage from '../features/auth/pages/AuthPage';
import { ExpensesPage } from '../features/expense/pages/ExpensePage';
import { LeaverequestPage } from '../features/leaverequest/pages/LeaverequestPage';
import { SettingsPage } from '../features/setting/pages/SettingsPage';

export const AppRouter = () => {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES (Herkese Açık Sayfalar) */}
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
 

      {/* 2. PROTECTED ROUTES (Sadece Giriş Yapmış Kullanıcılar) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/leaves" element={<LeaverequestPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 3. ADMIN / MANAGER ROUTES (Yetki Gerektiren Özel Alan) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN"> 
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* <Route path="users" element={<UsersManagementPage />} /> */}
      </Route>

      {/* 4. CATCH-ALL (Bilinmeyen veya 404 sayfaları) */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
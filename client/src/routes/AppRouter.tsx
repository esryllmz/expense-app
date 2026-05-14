import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import AuthPage from '../features/auth/pages/AuthPage';
import { ExpensesPage } from '../features/expense/pages/ExpensePage';
import { LeavePage } from '../features/leave/pages/LeavePage';
import { SettingsPage } from '../features/setting/pages/SettingsPage';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/leaves" element={<LeavePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ROLE_GM">
            <MainLayout />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
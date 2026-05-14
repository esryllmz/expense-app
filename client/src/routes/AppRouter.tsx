import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from '../features/auth/pages/AuthPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import { ExpensesPage } from '../features/expense/pages/ExpensePage';
import { LeavePage } from '../features/leave/pages/LeavePage';
import { SettingsPage } from '../features/setting/pages/SettingsPage';
import { MainLayout } from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';

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

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
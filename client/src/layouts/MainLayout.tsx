import React from 'react';
import { Outlet } from 'react-router-dom'; // Eklenen satır
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar'; 

// HATA ÇÖZÜMÜ: children zorunluluğunu kaldırdık!
interface MainLayoutProps {
  title?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ title }) => {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar/>
        <main className="flex-1 overflow-y-auto p-6">
           {/* HATA ÇÖZÜMÜ: children yerine Outlet koyduk. 
               AppRouter'daki sayfalar otomatik olarak buraya yüklenecek! */}
           <Outlet />
        </main>
      </div>
    </div>
  );
};
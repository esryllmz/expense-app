import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export const MainLayout: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => {
  return (
    // h-screen ve overflow-hidden: Sayfanın dışarı taşmasını ve devleşmesini engeller
    <div className="flex h-screen w-full bg-surface overflow-hidden text-on-surface">
      
      {/* SIDEBAR: Solda sabit, genişliği belli */}
      <Sidebar />

      {/* İÇERİK ALANI: Sidebar'ın yanından başlar ve kendi içinde kayar */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* main: Burası kaydırılabilir (scroll) olan alan */}
        <main className="flex-1 overflow-y-auto p-base lg:p-base">
          <div className="max-w-[1400px] mx-auto w-full space-y-base">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
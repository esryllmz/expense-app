import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

const Topbar = () => (
  <header className="bg-white/70 backdrop-blur-lg border-b border-outline-variant/30 h-16 flex items-center justify-between px-lg sticky top-0 z-40 ml-sidebar-width">
    <div className="flex items-center gap-md">
      <h1 className="text-xl font-bold text-on-surface">Overview</h1>
      <div className="flex items-center bg-surface-container-low rounded-full px-md py-1 border border-outline-variant/30 w-64">
        <Search size={18} className="text-slate-400 mr-2" />
        <input className="bg-transparent border-none outline-none text-sm w-full h-8" placeholder="Search..." />
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Bell size={20} className="text-primary cursor-pointer" />
      <Settings size={20} className="text-primary cursor-pointer" />
      <div className="w-8 h-8 rounded-full bg-slate-200 border border-outline-variant overflow-hidden">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="profile" />
      </div>
    </div>
  </header>
);

export default Topbar;
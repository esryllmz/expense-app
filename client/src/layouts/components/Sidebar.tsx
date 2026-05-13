import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, FileText, Settings, Building2 } from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Expenses', path: '/expenses', icon: <Receipt size={20} /> },
    { name: 'Leave Requests', path: '/leaves', icon: <FileText size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 bg-inverse-surface border-r border-inverse-surface flex flex-col text-inverse-on-surface h-screen">
      
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shadow-sm">
          <Building2 size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">CapitalFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold text-outline tracking-wider uppercase">Menu</div>
        
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-inverse-primary border-l-2 border-primary'
                  : 'text-outline hover:text-white hover:bg-white/5 border-l-2 border-transparent'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>
      
    </aside>
  );
};
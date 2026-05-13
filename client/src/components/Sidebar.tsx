import React from 'react';
import { LayoutDashboard, ReceiptText, CheckSquare, LogOut, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  return (
    <aside className="bg-on-secondary-fixed h-screen w-sidebar-width fixed left-0 top-0 shadow-xl flex flex-col py-lg z-50 text-white">
      <div className="px-lg mb-xl flex items-center gap-sm">
        <div className="bg-primary p-2 rounded-lg"><LayoutDashboard size={24} /></div>
        <span className="text-2xl font-bold tracking-tighter italic">NexaFlow</span>
      </div>
      <nav className="flex-1 px-sm space-y-1">
        <SidebarLink icon={<LayoutDashboard size={20}/>} label="Dashboard" active />
        <SidebarLink icon={<ReceiptText size={20}/>} label="Expenses" />
        <SidebarLink icon={<CheckSquare size={20}/>} label="Approvals" />
      </nav>
      <div className="px-lg mt-auto space-y-md">
        <button className="w-full bg-primary-container text-white py-sm rounded-lg flex justify-center items-center gap-sm shadow-lg hover:opacity-90">
          <Plus size={18} /> New Request
        </button>
        <button onClick={() => navigate('/')} className="w-full flex items-center gap-md text-slate-400 py-sm hover:text-white transition-colors">
          <LogOut size={20}/> Logout
        </button>
      </div>
    </aside>
  );
};

const SidebarLink = ({ icon, label, active = false }: any) => (
  <a className={`flex items-center gap-md px-md py-sm rounded-r-lg border-l-4 transition-all ${active ? 'bg-primary-container/20 text-white border-primary' : 'text-slate-400 border-transparent hover:bg-white/5'}`} href="#">
    {icon} <span className="font-semibold text-sm">{label}</span>
  </a>
);

export default Sidebar;
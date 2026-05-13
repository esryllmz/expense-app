import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { TrendingUp, Clock, CreditCard } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="flex bg-surface min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <main className="p-lg ml-sidebar-width space-y-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <StatCard title="Total Spend" value="$124,500" sub="+4.2% from last month" icon={<TrendingUp />} color="text-primary" />
            <StatCard title="Pending" value="24" sub="Requires attention" icon={<Clock />} color="text-tertiary" />
            <StatCard title="Active Cards" value="156" sub="Across 12 departments" icon={<CreditCard />} color="text-secondary" />
          </div>
          {/* Buraya Tablo Gelecek */}
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, icon, color }: any) => (
  <div className="bg-white rounded-xl p-md shadow-sm border border-outline-variant/20 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{title}</span>
      <div className={`${color} opacity-80`}>{icon}</div>
    </div>
    <div>
      <div className="text-3xl font-bold text-on-surface">{value}</div>
      <p className="text-xs text-secondary mt-1">{sub}</p>
    </div>
  </div>
);

export default Dashboard;
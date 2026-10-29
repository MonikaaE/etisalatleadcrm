import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  CheckSquare,
  Database,
  FileSpreadsheet,
  Send,
  FileText,
  MessageSquare,
  ShieldAlert,
  Settings,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Companies & Leads', to: '/companies', icon: Building2 },
    { name: 'Contacts', to: '/contacts', icon: Users },
    { name: 'Tasks & Follow-ups', to: '/tasks', icon: CheckSquare },
    { name: 'Data Sourcing', to: '/sources', icon: Database },
    { name: 'Import Leads', to: '/imports', icon: FileSpreadsheet },
    { name: 'Campaigns', to: '/campaigns', icon: Send },
    { name: 'Templates', to: '/templates', icon: FileText },
    { name: 'WhatsApp Inbox', to: '/inbox', icon: MessageSquare },
    { name: 'Compliance & Suppression', to: '/suppression', icon: ShieldAlert },
  ];

  if (hasRole(['ADMIN', 'SALES_MANAGER'])) {
    navigation.push({ name: 'Admin & Settings', to: '/settings', icon: Settings });
  }

  return (
    <aside className="w-64 bg-[#0f1629] border-r border-[rgba(99,102,241,0.15)] flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-[rgba(99,102,241,0.15)]">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <PhoneCall className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-tight text-white font-display">KYZEN</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">CRM</span>
          </div>
          <p className="text-xs text-slate-400">Etisalat Channel Partner</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Main Navigation
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Dubai / Etisalat B2B Partner Badge */}
      <div className="p-3 mx-3 mb-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent border border-emerald-500/20 flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <div className="text-xs">
          <span className="text-emerald-400 font-semibold block">Dubai B2B SIM Sales</span>
          <span className="text-slate-400 text-[11px]">Etisalat Enterprise Partner</span>
        </div>
      </div>

      {/* User profile brief */}
      <div className="p-4 border-t border-[rgba(99,102,241,0.15)] bg-[#0b1021]/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
          {user?.firstName?.[0] || 'U'}
          {user?.lastName?.[0] || ''}
        </div>
        <div className="overflow-hidden flex-1">
          <p className="text-sm font-medium text-slate-200 truncate leading-tight">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-[11px] text-indigo-400/80 truncate capitalize">
            {user?.role?.replace('_', ' ').toLowerCase()}
          </p>
        </div>
      </div>
    </aside>
  );
};

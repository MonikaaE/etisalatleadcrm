import React from 'react';
import { LogOut, Bell, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[rgba(99,102,241,0.15)] bg-[#0f1629]/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* UAE Region & Status Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#131d35] px-3 py-1.5 rounded-full border border-[rgba(99,102,241,0.2)]">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>UAE (Dubai & Northern Emirates)</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Etisalat Business Partner Authorized</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5" />
        </button>

        <div className="h-4 w-px bg-[rgba(99,102,241,0.2)]" />

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-200 block">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              {user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

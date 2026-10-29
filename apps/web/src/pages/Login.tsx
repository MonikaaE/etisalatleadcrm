import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PhoneCall, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Admin@123456');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-xl shadow-indigo-500/25 mb-4">
            <PhoneCall className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">KYZEN B2B CRM</h1>
          <p className="text-sm text-slate-400 mt-1">Etisalat Channel Partner • Dubai Lead Intelligence</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl border-[rgba(99,102,241,0.25)]">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kyzen.ae"
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Fill */}
          <div className="mt-6 pt-5 border-t border-[rgba(99,102,241,0.15)]">
            <p className="text-xs text-slate-400 font-medium mb-2.5">Quick Demo Logins (Password: Admin@123456):</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@kyzen.ae')}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 text-left transition-colors"
              >
                <div className="font-semibold">Admin</div>
                <div className="text-[10px] text-slate-400">admin@kyzen.ae</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('manager@kyzen.ae')}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 text-left transition-colors"
              >
                <div className="font-semibold">Sales Manager</div>
                <div className="text-[10px] text-slate-400">manager@kyzen.ae</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('rep@kyzen.ae')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-left transition-colors"
              >
                <div className="font-semibold">Sales Rep</div>
                <div className="text-[10px] text-slate-400">rep@kyzen.ae</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('analyst@kyzen.ae')}
                className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-left transition-colors"
              >
                <div className="font-semibold">Data Analyst</div>
                <div className="text-[10px] text-slate-400">analyst@kyzen.ae</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

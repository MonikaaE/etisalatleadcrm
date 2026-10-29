import React, { useEffect, useState } from 'react';
import {
  Settings,
  Users,
  Shield,
  Key,
  Database,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../lib/api';

export const AdminSettings: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'integrations' | 'audit' | 'mail'>('users');
  const [loading, setLoading] = useState(true);
  // mail settings state
  const [senderEmail, setSenderEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const handleSaveMailSettings = async () => {
    try {
      await api.post('/admin/mail-settings', { senderEmail, smtpPassword });
      // optionally show a toast
      alert('Mail settings saved');
    } catch (err) {
      console.error('Failed to save mail settings', err);
      alert('Error saving mail settings');
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [uRes, iRes, aRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/integrations'),
          api.get('/admin/audit'),
        ]);
        if (uRes.data?.success) setUsers(uRes.data.data);
        if (iRes.data?.success) setIntegrations(iRes.data.data);
        if (aRes.data?.success) setAuditLogs(aRes.data.data);
      } catch (err) {
        console.error('Failed to load admin settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Administration & Settings</h1>
        <p className="text-sm text-slate-400">Team permissions, audit logs, and external integration connectors</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[rgba(99,102,241,0.15)] pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members & Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'integrations'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'audit'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>System Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveTab('mail')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'mail'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Mail Settings</span>
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(99,102,241,0.15)] bg-[#0f1629]/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(99,102,241,0.08)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5 font-medium text-slate-200">
                      {u.firstName} {u.lastName}
                      <span className="block text-xs text-slate-500 font-normal">{u.email}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge-purple text-xs font-semibold">{u.role}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge-green text-xs font-semibold">{u.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 text-sm">Meta WhatsApp Cloud API</h3>
              <span className="badge-yellow text-xs">Awaiting Token</span>
            </div>
            <p className="text-xs text-slate-400">
              Direct connection to WhatsApp Business Cloud API for high-volume Etisalat B2B templates and 2-way conversation threads.
            </p>
            <div className="text-xs text-slate-500 font-mono bg-[#0f1629] p-2 rounded">
              Config: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
            </div>
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 text-sm">Postmark / Resend Transactional Email</h3>
              <span className="badge-yellow text-xs">Awaiting Token</span>
            </div>
            <p className="text-xs text-slate-400">
              SPF/DKIM-aligned outbound delivery with instant webhook tracking for bounces, opens, and opt-outs.
            </p>
            <div className="text-xs text-slate-500 font-mono bg-[#0f1629] p-2 rounded">
              Config: EMAIL_API_KEY, EMAIL_FROM_ADDRESS
            </div>
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 text-sm">UAE National Economic Registry / Lead APIs</h3>
              <span className="badge-green text-xs">Ready</span>
            </div>
            <p className="text-xs text-slate-400">
              CSV/XLSX Bulk ingestion and automated schema mapping for Dubai Chamber & DED commercial directories.
            </p>
            <div className="text-xs text-slate-500 font-mono bg-[#0f1629] p-2 rounded">
              Driver: In-App Worker + BullMQ Engine
            </div>
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(99,102,241,0.15)] bg-[#0f1629]/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(99,102,241,0.08)]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500 text-xs">No audit logs recorded yet.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-200">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      </td>
                      <td className="px-4 py-3.5 text-indigo-300 font-mono text-xs">{log.action}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        {log.entityType} ({log.entityId?.slice(0, 8)}...)
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mail Settings Tab */}
      {activeTab === 'mail' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Outbound Mail Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">Configure the email account used for sending campaigns and bulk outreach.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Sender Email Address</label>
              <input
                id="mail-sender-email"
                type="email"
                placeholder="e.g. outreach@yourcompany.com"
                className="w-full rounded-lg bg-[#0f1629] border border-indigo-500/30 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent px-3 py-2.5 text-sm transition-all"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">The email address that recipients will see in the "From" field.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">App Password</label>
              <input
                id="mail-app-password"
                type="password"
                placeholder="Enter your app-specific password"
                className="w-full rounded-lg bg-[#0f1629] border border-indigo-500/30 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent px-3 py-2.5 text-sm transition-all"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">For Gmail, generate an App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">myaccount.google.com/apppasswords</a>.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              id="mail-save-btn"
              onClick={handleSaveMailSettings}
              disabled={!senderEmail || !smtpPassword}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
            >
              Save Mail Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter
} from 'lucide-react';
import api from '../lib/api';

export const Suppression: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suppressions, setSuppressions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    email: '',
    phone: '',
    channel: 'WHATSAPP',
    reason: 'UNSUBSCRIBED',
    notes: '',
  });

  const fetchSuppressions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppression');
      if (res.data?.success) {
        setSuppressions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load suppression entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppressions();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/suppression', {
        email: newEntry.email || undefined,
        phone: newEntry.phone || undefined,
        channel: newEntry.channel,
        reason: newEntry.reason,
        notes: newEntry.notes || undefined,
      });
      setIsModalOpen(false);
      setNewEntry({ email: '', phone: '', channel: 'WHATSAPP', reason: 'UNSUBSCRIBED', notes: '' });
      fetchSuppressions();
    } catch (err) {
      console.error('Error adding suppression:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this suppression?')) return;
    try {
      await api.delete(`/suppression/${id}`);
      fetchSuppressions();
    } catch (err) {
      console.error('Error deleting suppression:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Compliance & Suppression List</h1>
          <p className="text-sm text-slate-400">Enforce UAE Personal Data Protection Law and Do-Not-Contact exclusions across all channels</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exclusion</span>
        </button>
      </div>

      {/* Suppression Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(99,102,241,0.15)] bg-[#0f1629]/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3.5">Identifier (Email / Phone)</th>
                <th className="px-4 py-3.5">Channel</th>
                <th className="px-4 py-3.5">Suppression Reason</th>
                <th className="px-4 py-3.5">Added Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(99,102,241,0.08)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">
                    Loading suppression records...
                  </td>
                </tr>
              ) : suppressions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">
                    No active suppression or opt-out entries.
                  </td>
                </tr>
              ) : (
                suppressions.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-200">
                      {entry.email || entry.phone || 'All Contact Points'}
                      {entry.notes && (
                        <span className="block text-xs text-slate-500 mt-0.5">{entry.notes}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="badge-purple text-xs uppercase">{entry.channel || 'ALL'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="badge-red text-xs uppercase">{entry.reason}</span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete exclusion"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Exclusion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold font-display text-white mb-4">Add Exclusion / Opt-Out</h2>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="label">Email Address (Optional)</label>
                <input
                  type="email"
                  value={newEntry.email}
                  onChange={(e) => setNewEntry({ ...newEntry, email: e.target.value })}
                  placeholder="contact@company.ae"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">UAE Phone / WhatsApp (Optional)</label>
                <input
                  type="text"
                  value={newEntry.phone}
                  onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
                  placeholder="+971 50 123 4567"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Channel</label>
                  <select
                    value={newEntry.channel}
                    onChange={(e) => setNewEntry({ ...newEntry, channel: e.target.value })}
                    className="input-field"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone Calls</option>
                  </select>
                </div>
                <div>
                  <label className="label">Reason</label>
                  <select
                    value={newEntry.reason}
                    onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                    className="input-field"
                  >
                    <option value="UNSUBSCRIBED">Unsubscribed</option>
                    <option value="DO_NOT_CONTACT">Do Not Contact (DNC)</option>
                    <option value="BOUNCED">Bounced</option>
                    <option value="COMPLAINED">Spam Complaint</option>
                    <option value="LEGAL_REQUEST">Legal Request</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Audit Notes</label>
                <input
                  type="text"
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  placeholder="Requested via WhatsApp STOP on 28 Oct"
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(99,102,241,0.15)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Exclusion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

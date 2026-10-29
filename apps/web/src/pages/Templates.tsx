import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Mail,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Copy
} from 'lucide-react';
import api from '../lib/api';

export const Templates: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    channel: 'WHATSAPP',
    category: 'MARKETING',
    bodyText: '',
    subject: '',
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/templates');
      if (res.data?.success) {
        setTemplates(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/templates', newTemplate);
      setIsModalOpen(false);
      setNewTemplate({ name: '', channel: 'WHATSAPP', category: 'MARKETING', bodyText: '', subject: '' });
      fetchTemplates();
    } catch (err) {
      console.error('Error creating template:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Outreach & WhatsApp Templates</h1>
          <p className="text-sm text-slate-400">Pre-approved Meta WhatsApp Business Cloud and Email message templates with variable tokens</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-slate-500">
            <FileText className="w-8 h-8 mx-auto text-indigo-400/50 mb-3" />
            <p>No message templates found.</p>
          </div>
        ) : (
          templates.map((tpl) => (
            <div key={tpl.id} className="glass-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {tpl.channel === 'WHATSAPP' ? (
                      <span className="p-1.5 rounded-lg bg-green-500/10 text-emerald-400">
                        <MessageSquare className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Mail className="w-4 h-4" />
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-300 uppercase">{tpl.channel}</span>
                  </div>
                  <span className="badge-purple text-[10px] uppercase font-bold">{tpl.category}</span>
                </div>

                <h3 className="font-semibold text-slate-200 text-sm">{tpl.name}</h3>
                {tpl.subject && (
                  <p className="text-xs text-indigo-300 font-medium mt-1">Sub: {tpl.subject}</p>
                )}

                <div className="mt-3 p-3 rounded-lg bg-[#0f1629] border border-[rgba(99,102,241,0.1)] text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed">
                  {tpl.bodyText}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[rgba(99,102,241,0.1)] text-[11px] text-slate-400">
                <span>Variables: {'{{1}}'}, {'{{name}}'}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Meta Compliant</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold font-display text-white mb-4">Create Message Template</h2>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="label">Template Name *</label>
                <input
                  type="text"
                  required
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g. etisalat_sim_renewal_intro"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Channel</label>
                  <select
                    value={newTemplate.channel}
                    onChange={(e) => setNewTemplate({ ...newTemplate, channel: e.target.value })}
                    className="input-field"
                  >
                    <option value="WHATSAPP">WhatsApp Cloud API</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="MARKETING">Marketing / Promotion</option>
                    <option value="UTILITY">Utility / Service Update</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>
              </div>

              {newTemplate.channel === 'EMAIL' && (
                <div>
                  <label className="label">Subject Line</label>
                  <input
                    type="text"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    placeholder="e.g. Corporate Etisalat SIM Packages for {{company_name}}"
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="label">Message Body *</label>
                <textarea
                  rows={4}
                  required
                  value={newTemplate.bodyText}
                  onChange={(e) => setNewTemplate({ ...newTemplate, bodyText: e.target.value })}
                  placeholder="Hello {{first_name}}, this is Kyzen Telecom. We noticed {{company_name}} may benefit from our exclusive Etisalat corporate SIM rates..."
                  className="input-field font-mono text-xs"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tip: Use {'{{first_name}}'}, {'{{company_name}}'} for automated dynamic personalization.
                </span>
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
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

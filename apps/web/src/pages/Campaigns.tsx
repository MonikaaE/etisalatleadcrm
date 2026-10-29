import React, { useEffect, useState } from 'react';
import {
  Send,
  Plus,
  Mail,
  MessageSquare,
  Play,
  Pause,
  Users,
  CheckCircle2,
  Trash2,
  CheckSquare,
  Square,
  X,
  Phone,
  Building2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../lib/api';
import { EmailAutomationModal } from '../components/EmailAutomationModal';
import type { RecipientLead } from '../components/EmailAutomationModal';

export const Campaigns: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  // Email Automation Modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [modalRecipients, setModalRecipients] = useState<RecipientLead[]>([]);

  // Multi-select state
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Audience / Lead management modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeCampaignForAudience, setActiveCampaignForAudience] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [audienceList, setAudienceList] = useState<any[]>([]);
  const [loadingAudience, setLoadingAudience] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    channel: 'WHATSAPP',
    description: '',
  });

  const openCampaignEmailDispatch = async (campaign: any) => {
    try {
      const res = await api.get(`/campaigns/${campaign.id}/audiences`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const leads: RecipientLead[] = res.data.data.map((a: any) => ({
          companyId: a.company?.id,
          contactId: a.contact?.id,
          name: a.contact?.fullName || 'Managing Director',
          companyName: a.company?.name || 'Enterprise Account',
          email: a.contact?.email || a.company?.email || `contact@${a.company?.name ? a.company.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'enterprise'}.ae`,
          phone: a.contact?.phone || a.company?.phone,
          industry: a.company?.industry,
          emirate: a.company?.emirate,
          potentialSimQty: a.company?.potentialSimQty || 15,
        }));
        setModalRecipients(leads);
        setIsEmailModalOpen(true);
        return;
      }
    } catch (err) {
      console.error('Failed to load campaign audience:', err);
    }
    setModalRecipients([]);
    setIsEmailModalOpen(true);
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns');
      if (res.data?.success) {
        setCampaigns(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/campaigns', {
        name: newCampaign.name,
        type: newCampaign.channel,
        channel: newCampaign.channel,
        description: newCampaign.description,
      });
      setIsModalOpen(false);
      setNewCampaign({ name: '', channel: 'WHATSAPP', description: '' });
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setFormError(err.response?.data?.message || 'Error creating campaign');
    }
  };

  const handleLaunchCampaign = async (id: string) => {
    try {
      await api.post(`/campaigns/${id}/launch`);
      fetchCampaigns();
    } catch (err) {
      console.error('Error launching campaign:', err);
      alert('Error launching campaign');
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await api.post(`/campaigns/${id}/pause`);
      fetchCampaigns();
    } catch (err) {
      console.error('Error pausing campaign:', err);
      alert('Error pausing campaign');
    }
  };

  // ─── SINGLE & BULK DELETE ────────────────────────────────────
  const handleDeleteSingleCampaign = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${name}"?`)) return;
    try {
      await api.delete(`/campaigns/${id}`);
      setSelectedCampaignIds((prev) => prev.filter((i) => i !== id));
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      alert('Failed to delete campaign');
    }
  };

  const handleBulkDeleteCampaigns = async () => {
    if (!selectedCampaignIds.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedCampaignIds.length} selected campaign(s)?`)) return;

    setIsDeletingBulk(true);
    try {
      await api.post('/campaigns/bulk-delete', { ids: selectedCampaignIds });
      setSelectedCampaignIds([]);
      fetchCampaigns();
    } catch (err) {
      console.error('Failed bulk delete:', err);
      alert('Failed to delete selected campaigns');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // ─── MULTI-SELECT TOGGLES ────────────────────────────────────
  const toggleSelectCampaign = (id: string) => {
    setSelectedCampaignIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCampaignIds.length === campaigns.length) {
      setSelectedCampaignIds([]);
    } else {
      setSelectedCampaignIds(campaigns.map((c) => c.id));
    }
  };

  // ─── AUDIENCE / LEADS MANAGEMENT IN CAMPAIGN ──────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openAudienceModal = async (campaign: any) => {
    setActiveCampaignForAudience(campaign);
    setLoadingAudience(true);
    try {
      const res = await api.get(`/campaigns/${campaign.id}/audiences`);
      if (res.data?.success) {
        setAudienceList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load campaign audience:', err);
    } finally {
      setLoadingAudience(false);
    }
  };

  const handleRemoveLeadFromCampaign = async (audienceId: string) => {
    if (!activeCampaignForAudience) return;
    try {
      await api.delete(`/campaigns/${activeCampaignForAudience.id}/audiences/${audienceId}`);
      setAudienceList((prev) => prev.filter((a) => a.id !== audienceId));
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to remove lead from campaign:', err);
      alert('Failed to remove lead');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Multichannel Outreach Campaigns</h1>
          <p className="text-sm text-slate-400">
            Automated WhatsApp Business and Email outreach sequences to UAE prospects
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setModalRecipients([]);
              setIsEmailModalOpen(true);
            }}
            className="btn-primary text-xs py-2 px-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 shadow-lg shadow-indigo-600/30 font-bold"
          >
            <Mail className="w-4 h-4" />
            <span>✉️ Bulk / Separate Mail Sender</span>
          </button>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setFormError('');
            }}
            className="btn-secondary text-xs py-2 px-3 text-slate-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Select All Bar */}
      {campaigns.length > 0 && (
        <div className="flex items-center justify-between bg-[#0d1424] p-3 rounded-xl border border-[rgba(99,102,241,0.15)] text-xs">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 font-semibold text-slate-300 hover:text-white"
          >
            {selectedCampaignIds.length === campaigns.length && campaigns.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
            )}
            <span>Select All Campaigns ({campaigns.length})</span>
          </button>

          <span className="text-slate-400">
            Total active sequences: <strong className="text-white">{campaigns.length}</strong>
          </span>
        </div>
      )}

      {/* FLOATING BULK ACTIONS BAR */}
      {selectedCampaignIds.length > 0 && (
        <div className="sticky top-4 z-40 p-3 rounded-xl bg-indigo-950/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
              {selectedCampaignIds.length} Campaigns Selected
            </span>
            <span className="text-xs text-slate-300 font-medium">Bulk Campaign Actions</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isDeletingBulk}
              onClick={handleBulkDeleteCampaigns}
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 text-rose-400 hover:bg-rose-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeletingBulk ? 'Deleting...' : 'Delete Selected Campaigns'}</span>
            </button>

            <button
              onClick={() => setSelectedCampaignIds([])}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-slate-500">
            <Send className="w-8 h-8 mx-auto text-indigo-400/50 mb-3" />
            <p>No outreach campaigns created yet.</p>
          </div>
        ) : (
          campaigns.map((camp) => {
            const isSelected = selectedCampaignIds.includes(camp.id);
            const audienceCount = camp._count?.audiences || camp.totalRecipients || 0;

            return (
              <div
                key={camp.id}
                className={`glass-card p-5 flex flex-col justify-between space-y-4 transition-all relative ${
                  isSelected ? 'border-indigo-500 bg-indigo-950/20' : ''
                }`}
              >
                <div>
                  {/* Checkbox, Channel Badge, & Delete Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectCampaign(camp.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>

                      {camp.type === 'WHATSAPP' || camp.channel === 'WHATSAPP' ? (
                        <span className="p-1.5 rounded-lg bg-green-500/10 text-emerald-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <Mail className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {camp.type || camp.channel || 'WHATSAPP'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`badge text-[10px] uppercase font-semibold ${
                          camp.status === 'RUNNING'
                            ? 'badge-green'
                            : camp.status === 'COMPLETED'
                            ? 'badge-blue'
                            : camp.status === 'PAUSED'
                            ? 'badge-yellow'
                            : 'badge-gray'
                        }`}
                      >
                        {camp.status}
                      </span>

                      <button
                        onClick={() => handleDeleteSingleCampaign(camp.id, camp.name)}
                        title="Delete Campaign"
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-200 text-base">{camp.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {camp.notes || camp.description || 'Targeted Etisalat B2B outreach sequence.'}
                  </p>

                  {/* Performance Counters */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[rgba(99,102,241,0.1)] text-center">
                    <div className="p-2 rounded bg-[#0f1629]">
                      <span className="text-[10px] text-slate-500 uppercase block">Sent</span>
                      <span className="font-bold text-slate-200 text-xs">{camp.sent || camp.sentCount || 0}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0f1629]">
                      <span className="text-[10px] text-slate-500 uppercase block">Delivered</span>
                      <span className="font-bold text-emerald-400 text-xs">{camp.delivered || camp.deliveredCount || 0}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0f1629]">
                      <span className="text-[10px] text-slate-500 uppercase block">Replies</span>
                      <span className="font-bold text-indigo-400 text-xs">{camp.replied || camp.repliedCount || 0}</span>
                    </div>
                  </div>

                  {/* Campaign Audience Leads Count Button */}
                  <div className="mt-3">
                    <button
                      onClick={() => openAudienceModal(camp)}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-[#0e1628] hover:bg-indigo-600/10 border border-[rgba(99,102,241,0.15)] text-xs text-indigo-300 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Target Leads in Campaign:</span>
                      </span>
                      <span className="font-bold text-white bg-indigo-500/20 px-2 py-0.5 rounded">
                        {audienceCount} Leads
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  {camp.status === 'RUNNING' ? (
                    <button
                      onClick={() => handlePauseCampaign(camp.id)}
                      className="w-full btn-secondary justify-center text-xs py-2 text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Campaign</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLaunchCampaign(camp.id)}
                      className="w-full btn-primary justify-center text-xs py-2"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Launch Campaign</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* VIEW & MANAGE LEADS IN CAMPAIGN MODAL */}
      {activeCampaignForAudience && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 shadow-2xl border-indigo-500/40 animate-fade-in space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[rgba(99,102,241,0.15)] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Audience Leads: {activeCampaignForAudience.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {audienceList.length} leads assigned to this {activeCampaignForAudience.type || activeCampaignForAudience.channel} campaign
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCampaignForAudience(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2">
              {loadingAudience ? (
                <div className="py-8 text-center text-slate-500">Loading campaign leads...</div>
              ) : audienceList.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p>No leads added to this campaign yet.</p>
                  <p className="text-xs mt-1 text-slate-400">
                    Go to <strong>Lead Scraper</strong> or <strong>Accounts</strong> and click "+ Add to Campaign".
                  </p>
                </div>
              ) : (
                audienceList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#0a0f1e] border border-[rgba(99,102,241,0.1)] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{item.company?.name || 'Company Account'}</span>
                        <span className="text-[10px] text-slate-500">({item.company?.emirate || 'UAE'})</span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-3 mt-1">
                        {item.contact && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Users className="w-3 h-3 text-indigo-400" />
                            <span>{item.contact.fullName} ({item.contact.title || 'Decision Maker'})</span>
                          </span>
                        )}
                        {(item.contact?.phone || item.company?.phone) && (
                          <span className="flex items-center gap-1 font-mono text-emerald-400">
                            <Phone className="w-3 h-3" />
                            <span>{item.contact?.phone || item.company?.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveLeadFromCampaign(item.id)}
                      title="Remove lead from this campaign"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[rgba(99,102,241,0.15)] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveCampaignForAudience(null)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl animate-fade-in space-y-4">
            <h2 className="text-xl font-bold font-display text-white">Create Outreach Campaign</h2>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="label">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g. Dubai Logistics SIM Quota Q4"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Primary Channel</label>
                <select
                  value={newCampaign.channel}
                  onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}
                  className="input-field"
                >
                  <option value="WHATSAPP">WhatsApp Business Cloud API</option>
                  <option value="EMAIL">Email Outreach</option>
                </select>
              </div>

              <div>
                <label className="label">Objective / Notes</label>
                <textarea
                  rows={2}
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Targeting PROs and HR heads in Al Quoz & JAFZA..."
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
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Email & WhatsApp Automation Modal */}
      <EmailAutomationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialRecipients={modalRecipients}
        initialMode="BULK"
        onSuccess={() => {
          fetchCampaigns();
        }}
      />
    </div>
  );
};

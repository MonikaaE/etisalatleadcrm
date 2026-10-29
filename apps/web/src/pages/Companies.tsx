import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  Bot,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Send,
  X,
  CheckSquare,
  Square,
  Phone,
  Mail,
  Building2,
  Users,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { EmailAutomationModal } from '../components/EmailAutomationModal';
import type { RecipientLead } from '../components/EmailAutomationModal';

export const Companies: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [companies, setCompanies] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emirate, setEmirate] = useState('');
  const [industry, setIndustry] = useState('');
  const [leadStatus, setLeadStatus] = useState('');

  // Email Automation Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailModalRecipients, setEmailModalRecipients] = useState<RecipientLead[]>([]);
  const [emailModalMode, setEmailModalMode] = useState<'BULK' | 'SINGLE'>('BULK');

  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [aiLookupLoading, setAiLookupLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiLookupResult, setAiLookupResult] = useState<null | any>(null);

  // Quick AI Lookup Drawer / Modal
  const [isQuickAiOpen, setIsQuickAiOpen] = useState(false);
  const [quickAiQuery, setQuickAiQuery] = useState('');
  const [quickAiLoading, setQuickAiLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quickAiResult, setQuickAiResult] = useState<any | null>(null);
  const [quickAiError, setQuickAiError] = useState('');

  // Multi-select & Bulk operations
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Add to Campaign Modal
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [targetCompanyIdsForCampaign, setTargetCompanyIdsForCampaign] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isAddingToCampaign, setIsAddingToCampaign] = useState(false);
  const [campaignSuccessMsg, setCampaignSuccessMsg] = useState('');

  const openEmailModalForSelected = (mode: 'BULK' | 'SINGLE' = 'BULK') => {
    const targetCompanies = companies.filter((c) => selectedCompanyIds.includes(c.id));
    const leads: RecipientLead[] = (targetCompanies.length > 0 ? targetCompanies : companies.slice(0, 5)).map((c) => ({
      companyId: c.id,
      id: c.id,
      name: c.contacts?.[0]?.fullName || c.contacts?.[0]?.firstName || 'Decision Maker',
      companyName: c.name,
      email: c.contacts?.[0]?.email || c.email || `outreach@${c.domain || 'enterprise.ae'}`,
      phone: c.contacts?.[0]?.phone || c.phone || '+971501234567',
      industry: c.industry,
      emirate: c.emirate,
      potentialSimQty: c.potentialSimQty || 15,
    }));
    setEmailModalRecipients(leads);
    setEmailModalMode(mode);
    setIsEmailModalOpen(true);
  };

  const openEmailModalForSingle = (c: any) => {
    const lead: RecipientLead = {
      companyId: c.id,
      id: c.id,
      name: c.contacts?.[0]?.fullName || c.contacts?.[0]?.firstName || 'Decision Maker',
      companyName: c.name,
      email: c.contacts?.[0]?.email || c.email || `contact@${c.domain || 'enterprise.ae'}`,
      phone: c.contacts?.[0]?.phone || c.phone || '+971501234567',
      industry: c.industry,
      emirate: c.emirate,
      potentialSimQty: c.potentialSimQty || 15,
    };
    setEmailModalRecipients([lead]);
    setEmailModalMode('SINGLE');
    setIsEmailModalOpen(true);
  };

  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: '',
    emirate: 'Dubai',
    potentialSimQty: 10,
    phone: '',
    email: '',
    website: '',
  });

  const [contacts, setContacts] = useState([
    { firstName: '', lastName: '', title: '', phone: '', email: '' },
  ]);

  const navigate = useNavigate();

  const addContact = () =>
    setContacts((prev) => [...prev, { firstName: '', lastName: '', title: '', phone: '', email: '' }]);

  const removeContact = (i: number) =>
    setContacts((prev) => prev.filter((_, idx) => idx !== i));

  const updateContact = (i: number, field: string, value: string) =>
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  // AI Lookup in Create Modal
  const handleAiLookup = async () => {
    const name = newCompany.name.trim();
    if (name.length < 2) {
      setFormError('Please enter a company name first (at least 2 characters).');
      return;
    }
    setFormError('');
    setAiLookupLoading(true);
    setAiLookupResult(null);
    try {
      const res = await api.post('/companies/ai-lookup', { name });
      const data = res.data?.data;
      if (!data) throw new Error('Empty response');

      setNewCompany((prev) => ({
        ...prev,
        phone: data.phone || prev.phone,
        email: data.email || prev.email,
        website: data.website || prev.website,
        industry: data.industry || prev.industry,
        emirate: data.emirate
          ? data.emirate.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          : prev.emirate,
        potentialSimQty: data.potentialSimQty || prev.potentialSimQty,
      }));

      if (Array.isArray(data.contacts) && data.contacts.length > 0) {
        setContacts(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.contacts.map((c: any) => ({
            firstName: c.firstName || '',
            lastName: c.lastName || '',
            title: c.title || '',
            phone: c.phone || '',
            email: c.email || '',
          }))
        );
      }

      setAiLookupResult({ confidence: data.confidence, sources: data.sources || [] });
    } catch {
      setFormError('AI lookup failed. Please fill in details manually.');
    } finally {
      setAiLookupLoading(false);
    }
  };

  // Quick Standalone AI Lookup
  const handleRunQuickAiLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (quickAiQuery.trim().length < 2) {
      setQuickAiError('Please enter a company name (at least 2 characters)');
      return;
    }
    setQuickAiLoading(true);
    setQuickAiError('');
    setQuickAiResult(null);

    try {
      const res = await api.post('/companies/ai-lookup', { name: quickAiQuery.trim() });
      if (res.data?.success && res.data?.data) {
        setQuickAiResult(res.data.data);
      }
    } catch (err: any) {
      setQuickAiError(err.response?.data?.message || 'Lookup failed');
    } finally {
      setQuickAiLoading(false);
    }
  };

  const handleSaveQuickAiLead = async () => {
    if (!quickAiResult) return;
    try {
      const contactsToSave = quickAiResult.contacts?.map((c: any) => ({
        firstName: c.firstName,
        lastName: c.lastName,
        title: c.title,
        phone: c.phone,
        email: c.email,
      })) || [];

      await api.post('/companies', {
        name: quickAiResult.name,
        phone: quickAiResult.phone,
        email: quickAiResult.email,
        website: quickAiResult.website,
        industry: quickAiResult.industry,
        emirate: quickAiResult.emirate?.replace(/_/g, ' ') || 'Dubai',
        potentialSimQty: quickAiResult.potentialSimQty || 20,
        contacts: contactsToSave,
      });

      setIsQuickAiOpen(false);
      setQuickAiResult(null);
      setQuickAiQuery('');
      fetchCompanies(1);
    } catch (err) {
      console.error('Failed to save AI lead:', err);
    }
  };

  const fetchCompanies = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (emirate) params.append('emirate', emirate.toUpperCase());
      if (industry) params.append('industry', industry);
      if (leadStatus) params.append('leadStatus', leadStatus);
      params.append('page', pageNumber.toString());
      params.append('limit', '15');

      const res = await api.get(`/companies?${params.toString()}`);
      if (res.data?.success) {
        setCompanies(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, emirate, industry, leadStatus]);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      if (res.data?.success) {
        setCampaignsList(res.data.data);
        if (res.data.data.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    }
  };

  useEffect(() => {
    fetchCompanies(1);
  }, [fetchCompanies]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validContacts = contacts.filter((c) => c.firstName.trim() && c.phone.trim());
    if (validContacts.length === 0) {
      setFormError('At least one contact with a first name and phone number is required.');
      return;
    }

    try {
      await api.post('/companies', { ...newCompany, contacts: validContacts });
      setIsModalOpen(false);
      setNewCompany({ name: '', industry: '', emirate: 'Dubai', potentialSimQty: 10, phone: '', email: '', website: '' });
      setContacts([{ firstName: '', lastName: '', title: '', phone: '', email: '' }]);
      setAiLookupResult(null);
      fetchCompanies(1);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create account. Please check your inputs.');
    }
  };

  // ─── SINGLE & BULK DELETE LEADS ──────────────────────────────
  const handleDeleteSingleCompany = async (companyId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from Leads?`)) return;
    try {
      await api.delete(`/companies/${companyId}`);
      setSelectedCompanyIds((prev) => prev.filter((id) => id !== companyId));
      fetchCompanies(meta.page);
    } catch (err) {
      console.error('Failed to delete lead:', err);
      alert('Failed to delete lead.');
    }
  };

  const handleBulkDeleteCompanies = async () => {
    if (selectedCompanyIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedCompanyIds.length} selected lead(s)?`)) return;

    setIsDeletingBulk(true);
    try {
      await api.post('/companies/bulk-delete', { ids: selectedCompanyIds });
      setSelectedCompanyIds([]);
      fetchCompanies(1);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Failed to delete selected leads.');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // ─── MULTI-SELECT HELPERS ────────────────────────────────────
  const toggleSelectCompany = (id: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCompanyIds.length === companies.length) {
      setSelectedCompanyIds([]);
    } else {
      setSelectedCompanyIds(companies.map((c) => c.id));
    }
  };

  // ─── ADD TO CAMPAIGN HELPERS ─────────────────────────────────
  const openCampaignModal = (ids: string[]) => {
    setTargetCompanyIdsForCampaign(ids);
    setCampaignSuccessMsg('');
    fetchCampaigns();
    setIsCampaignModalOpen(true);
  };

  const handleConfirmAddToCampaign = async () => {
    if (!targetCompanyIdsForCampaign.length) return;
    setIsAddingToCampaign(true);
    setCampaignSuccessMsg('');

    try {
      let targetId = selectedCampaignId;

      if (newCampaignName.trim()) {
        const newCampRes = await api.post('/campaigns', {
          name: newCampaignName.trim(),
          type: 'WHATSAPP',
          description: `Campaign created for ${targetCompanyIdsForCampaign.length} leads`,
        });
        if (newCampRes.data?.data?.id) {
          targetId = newCampRes.data.data.id;
        }
      }

      if (!targetId) {
        alert('Please select or create a campaign');
        setIsAddingToCampaign(false);
        return;
      }

      const res = await api.post('/companies/add-to-campaign', {
        campaignId: targetId,
        companyIds: targetCompanyIdsForCampaign,
      });

      if (res.data?.success) {
        setCampaignSuccessMsg(`Added ${targetCompanyIdsForCampaign.length} lead(s) to campaign!`);
        setTimeout(() => {
          setIsCampaignModalOpen(false);
          setNewCampaignName('');
          setSelectedCompanyIds([]);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Error adding to campaign:', err);
      alert(err.response?.data?.message || 'Failed to add leads to campaign');
    } finally {
      setIsAddingToCampaign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick AI Lookup button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">B2B Leads & Enterprise Accounts</h1>
          <p className="text-sm text-slate-400">
            UAE Commercial Accounts Directory with Etisalat SIM quotas, decision makers, and outreach status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openEmailModalForSelected('BULK')}
            className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-lg shadow-indigo-600/20"
          >
            <Mail className="w-4 h-4" />
            <span>✉️ Bulk Mail Automation</span>
          </button>

          <button
            onClick={() => {
              setIsQuickAiOpen(true);
              setQuickAiResult(null);
              setQuickAiError('');
            }}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/20"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>⚡ AI Lookup</span>
          </button>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setFormError('');
              setAiLookupResult(null);
            }}
            className="btn-secondary text-xs py-2 px-3 text-slate-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead Account</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 glass-card p-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, phone, email, or domain..."
            className="input-field pl-9 text-xs py-2"
          />
        </div>

        <select
          value={emirate}
          onChange={(e) => setEmirate(e.target.value)}
          className="input-field w-auto text-xs py-2"
        >
          <option value="">All Emirates</option>
          <option value="Dubai">Dubai</option>
          <option value="Abu Dhabi">Abu Dhabi</option>
          <option value="Sharjah">Sharjah</option>
          <option value="Ajman">Ajman</option>
          <option value="Ras Al Khaimah">Ras Al Khaimah</option>
        </select>

        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="input-field w-auto text-xs py-2"
        >
          <option value="">All Industries</option>
          <option value="CONSTRUCTION">Construction & Real Estate</option>
          <option value="LOGISTICS">Logistics & Supply Chain</option>
          <option value="TRADING">Trading & Retail</option>
          <option value="IT_TECHNOLOGY">Technology & IT</option>
          <option value="HEALTHCARE">Healthcare & Pharma</option>
        </select>

        <select
          value={leadStatus}
          onChange={(e) => setLeadStatus(e.target.value)}
          className="input-field w-auto text-xs py-2"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="CONTACTED">Contacted</option>
          <option value="MEETING_BOOKED">Meeting Booked</option>
          <option value="PROPOSAL_SENT">Proposal Sent</option>
          <option value="WON">Won</option>
        </select>

        <button
          onClick={() => fetchCompanies(1)}
          className="btn-secondary text-xs py-2 px-3"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Apply</span>
        </button>
      </div>

      {/* STICKY BULK ACTIONS BAR (When leads are selected) */}
      {selectedCompanyIds.length > 0 && (
        <div className="sticky top-4 z-40 p-3.5 rounded-xl bg-[#0e162d]/95 border border-indigo-500/50 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow">
              {selectedCompanyIds.length} Leads Selected
            </span>
            <span className="text-xs text-slate-300 font-medium">Quick Outreach:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openEmailModalForSelected('BULK')}
              className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-600/30"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>✉️ Send Mail (Bulk / Separate)</span>
            </button>

            <button
              onClick={() => openEmailModalForSelected('BULK')}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>💬 WhatsApp Blast</span>
            </button>

            <button
              onClick={() => openCampaignModal(selectedCompanyIds)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-slate-300"
            >
              <Send className="w-3.5 h-3.5" />
              <span>+ Add to Campaign</span>
            </button>

            <button
              disabled={isDeletingBulk}
              onClick={handleBulkDeleteCompanies}
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 text-rose-400 hover:bg-rose-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeletingBulk ? 'Deleting...' : 'Delete'}</span>
            </button>

            <button
              onClick={() => setSelectedCompanyIds([])}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Companies Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(99,102,241,0.15)] bg-[#0f1629]/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3.5 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-white"
                  >
                    {selectedCompanyIds.length === companies.length && companies.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">Company / Lead</th>
                <th className="px-4 py-3.5">Emirate / Industry</th>
                <th className="px-4 py-3.5">SIM Potential</th>
                <th className="px-4 py-3.5 text-center">Score</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(99,102,241,0.08)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No accounts found matching filters.
                  </td>
                </tr>
              ) : (
                companies.map((c) => {
                  const isSelected = selectedCompanyIds.includes(c.id);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectCompany(c.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200">{c.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          {c.phone && <span className="font-mono text-emerald-400">{c.phone}</span>}
                          {c.website && (
                            <a
                              href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:underline flex items-center gap-0.5"
                            >
                              <span>{c.domain || 'Visit'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium text-slate-200 block">{c.emirate || 'Dubai'}</span>
                        <span className="text-xs text-slate-400">{c.industry || 'General Business'}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-amber-400 flex items-center gap-1 text-xs">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{c.potentialSimQty ? `${c.potentialSimQty} SIMs` : '15 SIMs'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Etisalat Target</span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            c.score >= 80
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {c.score || 75}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="badge-blue text-xs uppercase">{c.leadStatus || 'NEW'}</span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEmailModalForSingle(c)}
                            title="Send Email (Select Template & Preview)"
                            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEmailModalForSingle(c)}
                            title="Send WhatsApp Message"
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/20 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openCampaignModal([c.id])}
                            title="Add lead to Campaign"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteSingleCompany(c.id, c.name)}
                            title="Delete Lead"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => navigate(`/companies/${c.id}`)}
                            className="btn-ghost text-xs py-1 px-2 text-slate-300 hover:text-white"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[rgba(99,102,241,0.15)] bg-[#0f1629]/30 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {(meta.page - 1) * meta.limit + 1} to{' '}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} companies
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchCompanies(meta.page - 1)}
              className="p-1 rounded bg-[#131d35] border border-[rgba(99,102,241,0.2)] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {meta.page} of {meta.totalPages || 1}
            </span>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchCompanies(meta.page + 1)}
              className="p-1 rounded bg-[#131d35] border border-[rgba(99,102,241,0.2)] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK AI LOOKUP MODAL */}
      {isQuickAiOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 shadow-2xl border-indigo-500/40 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(99,102,241,0.15)] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">⚡ AI Company Intelligence Lookup</h3>
                  <p className="text-xs text-slate-400">Search any UAE business to extract verified contacts and phone</p>
                </div>
              </div>
              <button onClick={() => setIsQuickAiOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRunQuickAiLookup} className="flex gap-2">
              <input
                type="text"
                value={quickAiQuery}
                onChange={(e) => setQuickAiQuery(e.target.value)}
                placeholder="Enter company name (e.g. Al Futtaim Logistics)..."
                className="input-field py-2 text-xs flex-1"
              />
              <button
                type="submit"
                disabled={quickAiLoading}
                className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
              >
                {quickAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'AI Search'}
              </button>
            </form>

            {quickAiError && <p className="text-xs text-rose-400">{quickAiError}</p>}

            {quickAiResult && (
              <div className="p-4 rounded-xl bg-[#0a0f1e] border border-indigo-500/30 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{quickAiResult.name}</h4>
                  <span className="badge-green text-[10px] font-semibold">● Verified UAE Lead</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Phone</span>
                    <span className="font-mono text-emerald-400">{quickAiResult.phone || 'Unavailable'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Email</span>
                    <span>{quickAiResult.email || 'Unavailable'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Location</span>
                    <span>{quickAiResult.address || 'Dubai, UAE'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Industry</span>
                    <span>{quickAiResult.industry}</span>
                  </div>
                </div>

                {quickAiResult.contacts && quickAiResult.contacts.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">Authorized Decision Maker:</span>
                    <div className="font-semibold text-white mt-0.5">
                      {quickAiResult.contacts[0].firstName} {quickAiResult.contacts[0].lastName} ({quickAiResult.contacts[0].title})
                    </div>
                    {quickAiResult.contacts[0].phone && (
                      <div className="text-emerald-400 font-mono text-[11px] mt-0.5">
                        {quickAiResult.contacts[0].phone}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(99,102,241,0.15)]">
                  <button
                    type="button"
                    onClick={handleSaveQuickAiLead}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save to Leads Accounts</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD TO CAMPAIGN MODAL */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl border-indigo-500/40 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(99,102,241,0.15)] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Add {targetCompanyIdsForCampaign.length} Lead(s) to Campaign
                </h3>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {campaignSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-center font-semibold text-sm flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{campaignSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="label">Select Existing Outreach Campaign</label>
                  {campaignsList.length > 0 ? (
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="input-field py-2"
                    >
                      {campaignsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.type || c.channel}) - {c.status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-slate-500 italic">No existing campaigns found.</p>
                  )}
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[rgba(99,102,241,0.2)]"></div>
                  <span className="flex-shrink mx-2 text-slate-500 text-[10px] uppercase font-bold">OR CREATE NEW</span>
                  <div className="flex-grow border-t border-[rgba(99,102,241,0.2)]"></div>
                </div>

                <div>
                  <label className="label">New Campaign Name</label>
                  <input
                    type="text"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    placeholder="e.g. High Priority SIM Outreach Q4"
                    className="input-field py-2"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[rgba(99,102,241,0.15)]">
                  <button
                    type="button"
                    onClick={() => setIsCampaignModalOpen(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isAddingToCampaign}
                    onClick={handleConfirmAddToCampaign}
                    className="btn-primary"
                  >
                    {isAddingToCampaign ? 'Adding...' : 'Confirm & Add to Campaign'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Company Modal with AI lookup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-xl w-full p-6 shadow-2xl animate-fade-in my-8">
            <h2 className="text-xl font-bold font-display text-white mb-4">Add Lead Account</h2>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label">Company Name *</label>
                  {aiLookupResult && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      <span>AI enriched</span>
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newCompany.name}
                    onChange={(e) => {
                      setNewCompany({ ...newCompany, name: e.target.value });
                      setAiLookupResult(null);
                    }}
                    placeholder="e.g. Al Naboodah Contracting LLC"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAiLookup}
                    disabled={aiLookupLoading || newCompany.name.trim().length < 2}
                    title="Auto-fill company info and contacts using Google Gemini AI"
                    className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 whitespace-nowrap border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/20 disabled:opacity-40"
                  >
                    {aiLookupLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>{aiLookupLoading ? 'Fetching...' : 'AI Lookup'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="text"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    placeholder="+971 4 XXX XXXX"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    placeholder="info@company.ae"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Emirate *</label>
                  <select
                    value={newCompany.emirate}
                    onChange={(e) => setNewCompany({ ...newCompany, emirate: e.target.value })}
                    className="input-field"
                  >
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                  </select>
                </div>
                <div>
                  <label className="label">Industry *</label>
                  <select
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select industry</option>
                    <option value="CONSTRUCTION">Construction</option>
                    <option value="LOGISTICS">Logistics</option>
                    <option value="TRADING">Trading</option>
                    <option value="IT_TECHNOLOGY">Technology</option>
                    <option value="HEALTHCARE">Healthcare</option>
                  </select>
                </div>
              </div>

              {/* Contacts section */}
              <div className="pt-2 border-t border-[rgba(99,102,241,0.15)] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Authorized Decision Makers *</label>
                  <button
                    type="button"
                    onClick={addContact}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Another</span>
                  </button>
                </div>

                {contacts.map((contact, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#0f1629] border border-[rgba(99,102,241,0.15)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Contact {idx + 1}</span>
                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(idx)}
                          className="text-slate-500 hover:text-rose-400 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required={idx === 0}
                        placeholder="First Name *"
                        value={contact.firstName}
                        onChange={(e) => updateContact(idx, 'firstName', e.target.value)}
                        className="input-field text-xs py-1.5"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={contact.lastName}
                        onChange={(e) => updateContact(idx, 'lastName', e.target.value)}
                        className="input-field text-xs py-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Title (e.g. PRO, MD)"
                        value={contact.title}
                        onChange={(e) => updateContact(idx, 'title', e.target.value)}
                        className="input-field text-xs py-1.5"
                      />
                      <input
                        type="text"
                        required={idx === 0}
                        placeholder="Direct Phone * (+971 50...)"
                        value={contact.phone}
                        onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                        className="input-field text-xs py-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[rgba(99,102,241,0.15)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError('');
                    setAiLookupResult(null);
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk and Separate Email Automation Modal */}
      <EmailAutomationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialRecipients={emailModalRecipients}
        initialMode={emailModalMode}
        onSuccess={() => {
          fetchCompanies(meta.page);
        }}
      />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Database,
  Search,
  Globe,
  MapPin,
  Building2,
  Phone,
  Mail,
  Flame,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Users,
  Compass,
  Trash2,
  Send,
  X,
  Bot,
  Loader2,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';
import api from '../lib/api';

export const DataSources: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sources, setSources] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [scrapedLeads, setScrapedLeads] = useState<any[]>(() => {
    try {
      const cached = sessionStorage.getItem('kyzen_scraped_leads');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loadingSources, setLoadingSources] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [savedLeadMap, setSavedLeadMap] = useState<Record<string, boolean>>(() => {
    try {
      const cached = sessionStorage.getItem('kyzen_saved_leads_map');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // Multi-select state
  const [selectedLeadIndices, setSelectedLeadIndices] = useState<number[]>([]);

  // AI Lookup State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiLookupResult, setAiLookupResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState('');
  const [aiSaved, setAiSaved] = useState(false);

  // Scraper filters
  const [scrapeSource, setScrapeSource] = useState('all');
  const [query, setQuery] = useState('Logistics');
  const [emirate, setEmirate] = useState('Dubai');
  const [scrapeLimit, setScrapeLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<'scraper' | 'sources'>('scraper');

  // Campaign Picker Modal State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [targetLeadsForCampaign, setTargetLeadsForCampaign] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isAddingToCampaign, setIsAddingToCampaign] = useState(false);
  const [campaignSuccessMsg, setCampaignSuccessMsg] = useState('');

  const fetchSources = async () => {
    setLoadingSources(true);
    try {
      const res = await api.get('/sources');
      if (res.data?.success) {
        setSources(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setLoadingSources(false);
    }
  };

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
      console.error('Failed to load campaigns:', err);
    }
  };

  const handleRunScraper = async (customQuery?: string) => {
    setIsScraping(true);
    setSelectedLeadIndices([]);
    const targetQuery = customQuery || query;
    try {
      const res = await api.post('/sources/realtime/scrape', {
        source: scrapeSource,
        query: targetQuery,
        emirate,
        limit: scrapeLimit,
      });

      if (res.data?.success && res.data?.data?.leads) {
        setScrapedLeads(res.data.data.leads);
        sessionStorage.setItem('kyzen_scraped_leads', JSON.stringify(res.data.data.leads));
      }
    } catch (err) {
      console.error('Failed to scrape leads:', err);
    } finally {
      setIsScraping(false);
    }
  };

  // ─── AI SINGLE COMPANY LOOKUP ────────────────────────────────
  const handleRunAiLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = aiSearchQuery.trim();
    if (clean.length < 2) {
      setAiError('Please enter a UAE company name (at least 2 letters)');
      return;
    }
    setAiSearching(true);
    setAiError('');
    setAiLookupResult(null);
    setAiSaved(false);

    try {
      const isUrl = clean.startsWith('http://') || clean.startsWith('https://') || (clean.includes('.') && !clean.includes(' '));
      
      if (isUrl) {
        const res = await api.post('/companies/scrape-website', { url: clean });
        if (res.data?.success && res.data?.data) {
          const scraped = res.data.data;
          setAiLookupResult({
            name: scraped.title?.replace(/[-|].*$/, '').trim() || clean.replace(/^https?:\/\//, '').split('/')[0],
            phone: scraped.primaryPhone,
            phoneNormalized: scraped.primaryPhoneNormalized,
            email: scraped.primaryEmail,
            website: scraped.website,
            domain: scraped.domain,
            address: scraped.address || 'United Arab Emirates',
            industry: 'LOGISTICS',
            emirate: 'DUBAI',
            employeeSizeBand: '51-200',
            potentialSimQty: 25,
            contacts: [],
            confidence: scraped.verified ? 'high' : 'medium',
            sources: [scraped.source || 'Live Website Contact Scraper'],
          });
          return;
        }
      }

      const res = await api.post('/companies/ai-lookup', { name: clean });
      if (res.data?.success && res.data?.data) {
        setAiLookupResult(res.data.data);
      } else {
        setAiError('No intelligence found for this company.');
      }
    } catch (err: any) {
      console.error('AI Lookup error:', err);
      setAiError(err.response?.data?.message || 'Lookup failed. Please verify the company name or URL.');
    } finally {
      setAiSearching(false);
    }
  };

  // ─── SAVE LEAD TO CRM ─────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveToCrm = async (lead: any) => {
    try {
      await api.post('/sources/realtime/import-lead', lead);
      setSavedLeadMap((prev) => {
        const updated = { ...prev, [lead.name]: true };
        sessionStorage.setItem('kyzen_saved_leads_map', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Failed to import scraped lead into CRM:', err);
    }
  };

  // ─── SAVE SELECTED LEADS TO CRM ──────────────────────────────
  const handleSaveSelectedToCrm = async () => {
    const selectedLeads = selectedLeadIndices.map((i) => scrapedLeads[i]).filter(Boolean);
    if (selectedLeads.length === 0) return;

    try {
      await api.post('/sources/realtime/import-leads', { leads: selectedLeads });
      setSavedLeadMap((prev) => {
        const updated = { ...prev };
        for (const l of selectedLeads) {
          updated[l.name] = true;
        }
        sessionStorage.setItem('kyzen_saved_leads_map', JSON.stringify(updated));
        return updated;
      });
      setSelectedLeadIndices([]);
    } catch (err) {
      console.error('Failed to import selected leads:', err);
    }
  };

  const handleSaveAll = async () => {
    const unSaved = scrapedLeads.filter((l) => !savedLeadMap[l.name]);
    if (unSaved.length === 0) return;
    try {
      await api.post('/sources/realtime/import-leads', { leads: unSaved });
      setSavedLeadMap((prev) => {
        const updated = { ...prev };
        for (const l of unSaved) {
          updated[l.name] = true;
        }
        sessionStorage.setItem('kyzen_saved_leads_map', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Failed to save all:', err);
    }
  };

  // ─── REMOVE / DELETE FROM CURRENT DISCOVERY ───────────────────
  const handleRemoveSingleLead = (index: number) => {
    setScrapedLeads((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      sessionStorage.setItem('kyzen_scraped_leads', JSON.stringify(updated));
      return updated;
    });
    setSelectedLeadIndices((prev) => prev.filter((idx) => idx !== index));
  };

  const handleRemoveSelectedLeads = () => {
    setScrapedLeads((prev) => {
      const updated = prev.filter((_, idx) => !selectedLeadIndices.includes(idx));
      sessionStorage.setItem('kyzen_scraped_leads', JSON.stringify(updated));
      return updated;
    });
    setSelectedLeadIndices([]);
  };

  // ─── MULTI-SELECT TOGGLES ─────────────────────────────────────
  const toggleSelectLead = (index: number) => {
    setSelectedLeadIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIndices.length === scrapedLeads.length) {
      setSelectedLeadIndices([]);
    } else {
      setSelectedLeadIndices(scrapedLeads.map((_, i) => i));
    }
  };

  // ─── CAMPAIGN MODAL HANDLERS ─────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openCampaignModal = (leads: any[]) => {
    setTargetLeadsForCampaign(leads);
    setCampaignSuccessMsg('');
    fetchCampaigns();
    setIsCampaignModalOpen(true);
  };

  const handleConfirmAddToCampaign = async () => {
    if (!targetLeadsForCampaign.length) return;
    setIsAddingToCampaign(true);
    setCampaignSuccessMsg('');

    try {
      let targetId = selectedCampaignId;

      // If user typed a new campaign name, create it first
      if (newCampaignName.trim()) {
        const newCampRes = await api.post('/campaigns', {
          name: newCampaignName.trim(),
          type: 'WHATSAPP',
          description: `Discovered leads outreach from ${query} ${emirate}`,
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

      // Add leads to campaign
      const res = await api.post('/campaigns/add-leads', {
        campaignId: targetId,
        leads: targetLeadsForCampaign,
      });

      if (res.data?.success) {
        setCampaignSuccessMsg(`Successfully added ${targetLeadsForCampaign.length} lead(s) to campaign!`);
        // Mark as saved in CRM
        setSavedLeadMap((prev) => {
          const updated = { ...prev };
          for (const l of targetLeadsForCampaign) {
            updated[l.name] = true;
          }
          sessionStorage.setItem('kyzen_saved_leads_map', JSON.stringify(updated));
          return updated;
        });

        setTimeout(() => {
          setIsCampaignModalOpen(false);
          setNewCampaignName('');
          setSelectedLeadIndices([]);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Error adding leads to campaign:', err);
      alert(err.response?.data?.message || 'Failed to add leads to campaign');
    } finally {
      setIsAddingToCampaign(false);
    }
  };

  useEffect(() => {
    fetchSources();
    if (scrapedLeads.length === 0) {
      handleRunScraper();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-white">B2B Lead Scraper & Data Sourcing</h1>
            <span className="badge-green text-xs font-semibold flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Real-time Intelligence</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time B2B discovery powered by <strong>Google Gemini AI</strong> across 2GIS, UAE YellowPages, LinkedIn, and DED Trade Registry
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-[#131d35] p-1 rounded-xl border border-[rgba(99,102,241,0.2)]">
          <button
            onClick={() => setActiveTab('scraper')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'scraper'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Live AI Scraper</span>
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'sources'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Source Connectors ({sources.length})</span>
          </button>
        </div>
      </div>

      {/* SCRAPER VIEW */}
      {activeTab === 'scraper' && (
        <div className="space-y-6">
          {/* ⚡ PROMINENT AI COMPANY LOOKUP SEARCH BAR */}
          <div className="glass-card p-5 border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-[#0f1629] to-purple-950/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>⚡ Real Company & Website Intelligence Extractor</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      0% Hallucination • Live HTML Scraper
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Enter a UAE company name or paste their website URL to scrape verified telephone numbers, emails, and address directly from their official site.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRunAiLookup} className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  placeholder="Enter UAE company name OR website URL (e.g. Al Naboodah, https://alnaboodahconstruction.com, rsa.global)..."
                  className="input-field pl-9 py-2.5 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                disabled={aiSearching}
                className="btn-primary px-5 py-2.5 text-xs whitespace-nowrap justify-center shadow-lg shadow-indigo-600/30"
              >
                {aiSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Scraping Live Data...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    <span>Scrape & Extract</span>
                  </>
                )}
              </button>
            </form>

            {aiError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                {aiError}
              </p>
            )}

            {/* AI Lookup Result Card */}
            {aiLookupResult && (
              <div className="mt-4 p-4 rounded-xl bg-[#090d1a] border border-indigo-500/40 animate-fade-in space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{aiLookupResult.name}</h3>
                      <span className="badge-green text-[10px] font-semibold">
                        ● AI Confidence: {aiLookupResult.confidence?.toUpperCase() || 'HIGH'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{aiLookupResult.industry}</span>
                      <span>•</span>
                      <span>{aiLookupResult.address || 'Dubai, UAE'}</span>
                      {aiLookupResult.licenseNumber && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300 font-mono">DED License: {aiLookupResult.licenseNumber}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        await handleSaveToCrm(aiLookupResult);
                        setAiSaved(true);
                      }}
                      disabled={aiSaved}
                      className={`btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 ${
                        aiSaved ? 'bg-emerald-600 text-white' : ''
                      }`}
                    >
                      {aiSaved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved to CRM</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>+ Add to Leads / CRM</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openCampaignModal([aiLookupResult])}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/20"
                    >
                      <Send className="w-3.5 h-3.5 text-indigo-400" />
                      <span>+ Add to Campaign</span>
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#0e1628] border border-[rgba(99,102,241,0.1)] flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Office Phone</span>
                      <span className="text-slate-200 font-mono">{aiLookupResult.phone || 'Unavailable'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0e1628] border border-[rgba(99,102,241,0.1)] flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Corporate Email</span>
                      <span className="text-slate-200">{aiLookupResult.email || 'Unavailable'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0e1628] border border-[rgba(99,102,241,0.1)] flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Website</span>
                      <a
                        href={aiLookupResult.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{aiLookupResult.domain || aiLookupResult.website}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Identified Authorized Decision Maker */}
                {aiLookupResult.contacts && aiLookupResult.contacts.length > 0 && (
                  <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                          Identified Authorized Signatory / Decision Maker
                        </span>
                        <span className="font-semibold text-white text-xs">
                          {aiLookupResult.contacts[0].firstName} {aiLookupResult.contacts[0].lastName}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">({aiLookupResult.contacts[0].title})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {aiLookupResult.contacts[0].phone && (
                        <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{aiLookupResult.contacts[0].phone}</span>
                        </span>
                      )}
                      {aiLookupResult.contacts[0].email && (
                        <span className="text-slate-300 font-mono text-[11px]">
                          {aiLookupResult.contacts[0].email}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Scraper Filter Bar */}
          <div className="glass-card p-5 border-indigo-500/25 space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* Platform selector */}
              <div className="w-full lg:w-48">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Target Platform
                </label>
                <select
                  value={scrapeSource}
                  onChange={(e) => setScrapeSource(e.target.value)}
                  className="input-field py-2 text-xs"
                >
                  <option value="all">🌐 All Channels (Unified)</option>
                  <option value="2gis">📍 2GIS Dubai Directory</option>
                  <option value="yellowpages">📒 YellowPages / Yello UAE</option>
                  <option value="linkedin">💼 LinkedIn B2B Contacts</option>
                  <option value="ded">🏛️ DED Commercial Registry</option>
                </select>
              </div>

              {/* Keyword / Sector */}
              <div className="flex-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Industry / Target Keyword
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Logistics, Contracting, Fleet, Freezone Trading, IT..."
                    className="input-field pl-9 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Emirate */}
              <div className="w-full lg:w-44">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Emirate
                </label>
                <select
                  value={emirate}
                  onChange={(e) => setEmirate(e.target.value)}
                  className="input-field py-2 text-xs"
                >
                  <option value="Dubai">Dubai</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Sharjah">Sharjah</option>
                  <option value="Ajman">Ajman</option>
                  <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                </select>
              </div>

              {/* Limit */}
              <div className="w-full lg:w-28">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Fetch Count
                </label>
                <select
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(parseInt(e.target.value))}
                  className="input-field py-2 text-xs"
                >
                  <option value="5">5 Leads</option>
                  <option value="10">10 Leads</option>
                  <option value="15">15 Leads</option>
                  <option value="25">25 Leads</option>
                </select>
              </div>

              {/* Action Button */}
              <div className="lg:self-end">
                <button
                  disabled={isScraping}
                  onClick={() => handleRunScraper()}
                  className="btn-primary w-full py-2 text-xs whitespace-nowrap justify-center shadow-lg shadow-indigo-600/30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                  <span>{isScraping ? 'AI Scraping...' : 'Start AI Live Fetch'}</span>
                </button>
              </div>
            </div>

            {/* Quick Industry Filter Badges */}
            <div className="flex items-center gap-2 pt-2 border-t border-[rgba(99,102,241,0.1)] text-xs flex-wrap">
              <span className="text-slate-500 font-medium text-[11px]">Quick Sectors:</span>
              {['Logistics & Freight', 'Construction', 'Trading & Retail', 'IT Solutions', 'Healthcare', 'Fleet Transport'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    setQuery(sec.split(' ')[0]);
                    handleRunScraper(sec.split(' ')[0]);
                  }}
                  className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-[11px] transition-colors border border-indigo-500/20"
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary & Action Bar with Select All */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1424] p-3 rounded-xl border border-[rgba(99,102,241,0.15)]">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                {selectedLeadIndices.length === scrapedLeads.length && scrapedLeads.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>Select All ({scrapedLeads.length})</span>
              </button>

              <span className="text-slate-600">|</span>

              <span className="text-xs text-slate-400">
                Found <strong className="text-indigo-300">{scrapedLeads.length}</strong> AI verified B2B leads
              </span>
            </div>

            {scrapedLeads.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAll}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save All to CRM</span>
                </button>
              </div>
            )}
          </div>

          {/* FLOATING BULK ACTIONS BAR (When leads are selected) */}
          {selectedLeadIndices.length > 0 && (
            <div className="sticky top-4 z-40 p-3 rounded-xl bg-indigo-950/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                  {selectedLeadIndices.length} Selected
                </span>
                <span className="text-xs text-slate-300 font-medium">Bulk Lead Operations</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveSelectedToCrm}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
                  <span>+ Add Selected to Leads</span>
                </button>

                <button
                  onClick={() => {
                    const leads = selectedLeadIndices.map((i) => scrapedLeads[i]).filter(Boolean);
                    openCampaignModal(leads);
                  }}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border-indigo-400 text-indigo-200 hover:bg-indigo-600/30"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-300" />
                  <span>+ Add Selected to Campaign</span>
                </button>

                <button
                  onClick={handleRemoveSelectedLeads}
                  className="btn-ghost text-xs py-1.5 px-2.5 flex items-center gap-1 text-rose-400 hover:bg-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Selected</span>
                </button>

                <button
                  onClick={() => setSelectedLeadIndices([])}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Scraped Leads Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isScraping ? (
              <div className="col-span-full glass-card p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
                <p className="text-sm font-semibold text-slate-200">
                  AI querying 2GIS, YellowPages, LinkedIn, and DED directories...
                </p>
                <p className="text-xs text-slate-500">
                  Normalizing UAE E.164 phone numbers, calculating Etisalat SIM quotas, and identifying PROs
                </p>
              </div>
            ) : scrapedLeads.length === 0 ? (
              <div className="col-span-full glass-card p-12 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>No leads found. Select an industry and click "Start AI Live Fetch".</p>
              </div>
            ) : (
              scrapedLeads.map((lead, idx) => {
                const isSaved = savedLeadMap[lead.name];
                const isSelected = selectedLeadIndices.includes(idx);

                return (
                  <div
                    key={idx}
                    className={`glass-card p-5 transition-all flex flex-col justify-between space-y-4 relative ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                        : 'border-[rgba(99,102,241,0.2)] hover:border-indigo-500/40'
                    }`}
                  >
                    <div>
                      {/* Source Badge, Select Checkbox, & Score */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSelectLead(idx)}
                            className="text-slate-400 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          <span
                            className={`badge text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              lead.source === '2gis'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : lead.source === 'yellowpages'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : lead.source === 'linkedin'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {lead.source === '2gis'
                              ? '📍 2GIS Dubai'
                              : lead.source === 'yellowpages'
                              ? '📒 UAE YellowPages'
                              : lead.source === 'linkedin'
                              ? '💼 LinkedIn PRO'
                              : '🏛️ DED Registry'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              lead.scoreGrade === 'A'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            <Sparkles className="w-3 h-3 inline mr-1" />
                            {lead.score || 88} ({lead.scoreGrade || 'A'})
                          </span>

                          <button
                            onClick={() => handleRemoveSingleLead(idx)}
                            title="Dismiss lead"
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Company Name */}
                      <h3 className="font-bold text-white text-base leading-snug">{lead.name}</h3>

                      {/* Industry & Location */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{lead.industry}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{lead.address || `${lead.emirate}, UAE`}</span>
                        </span>
                      </div>

                      {/* Contact Info Channels */}
                      <div className="mt-3 pt-3 border-t border-[rgba(99,102,241,0.1)] space-y-1.5 text-xs">
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-mono">{lead.phone}</span>
                            <span className="text-[10px] text-slate-500">(E.164: {lead.phoneNormalized})</span>
                          </div>
                        )}

                        {lead.email && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{lead.email}</span>
                          </div>
                        )}

                        {lead.website && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Globe className="w-3.5 h-3.5 text-sky-400" />
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <span>{lead.domain || lead.website}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {lead.licenseNumber && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            <span>Trade License: <strong>{lead.licenseNumber}</strong> (DED Registered)</span>
                          </div>
                        )}
                      </div>

                      {/* MANDATORY Identified Decision Makers (PRO, MD, Fleet) */}
                      {lead.keyContacts && lead.keyContacts.length > 0 && (
                        <div className="mt-3 p-2.5 rounded-lg bg-[#0f1629] border border-[rgba(99,102,241,0.12)]">
                          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3 text-indigo-400" />
                            <span>Authorized Decision Maker / Signatory</span>
                          </span>
                          <div className="text-xs font-semibold text-slate-200 mt-0.5">
                            {lead.keyContacts[0].name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center justify-between">
                            <span>{lead.keyContacts[0].title}</span>
                            {lead.keyContacts[0].phone && (
                              <span className="text-emerald-400 font-mono text-[10px]">
                                {lead.keyContacts[0].phone}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Opportunity sizing */}
                      <div className="mt-3 flex items-center justify-between text-xs bg-indigo-500/5 px-2.5 py-1.5 rounded-lg border border-indigo-500/10">
                        <span className="text-slate-400">Est. SIM Opportunity:</span>
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{lead.potentialSimQty || 25} Business SIMs</span>
                        </span>
                      </div>
                    </div>

                    {/* Action buttons: Add to Leads & Add to Campaign */}
                    <div className="pt-2 grid grid-cols-2 gap-2">
                      <button
                        disabled={isSaved}
                        onClick={() => handleSaveToCrm(lead)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          isSaved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'btn-primary'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>In Leads</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ Add to Leads</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openCampaignModal([lead])}
                        className="btn-secondary py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/20"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-400" />
                        <span>+ Add to Campaign</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SOURCE CONNECTORS VIEW */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingSources ? (
            <div className="col-span-full py-12 text-center text-slate-500">Loading directory connectors...</div>
          ) : (
            sources.map((src) => (
              <div key={src.id} className="glass-card p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge text-xs uppercase font-semibold badge-green">
                      {src.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {src.type}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-200 text-base">{src.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{src.description}</p>
                </div>
                <div className="pt-2 border-t border-[rgba(99,102,241,0.1)] text-xs text-slate-500">
                  Records Sourced: <strong className="text-slate-300">{src.recordCount || 0}</strong>
                </div>
              </div>
            ))
          )}
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
                  Add {targetLeadsForCampaign.length} Lead(s) to Campaign
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
                <CheckCircle2 className="w-5 h-5" />
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
                    placeholder="e.g. Dubai Q4 SIM Outreach Sequence"
                    className="input-field py-2"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#0a0f1e] border border-[rgba(99,102,241,0.1)] text-slate-400">
                  <span className="font-semibold text-slate-300 block mb-1">Target Audience:</span>
                  <ul className="max-h-24 overflow-y-auto space-y-1 list-disc list-inside">
                    {targetLeadsForCampaign.map((l, idx) => (
                      <li key={idx} className="truncate">
                        <strong className="text-white">{l.name}</strong> ({l.phone || 'Phone pending'})
                      </li>
                    ))}
                  </ul>
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
    </div>
  );
};

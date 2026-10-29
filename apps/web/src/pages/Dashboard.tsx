import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  PhoneForwarded,
  TrendingUp,
  Flame,
  ArrowUpRight,
  Mail,
  MessageSquare,
  Sparkles,
  Send,
  Calendar,
  Layers,
  Activity,
  ChevronRight,
  Radio,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { EmailAutomationModal } from '../components/EmailAutomationModal';
import type { RecipientLead } from '../components/EmailAutomationModal';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartChannel, setChartChannel] = useState<'ALL' | 'EMAIL' | 'WHATSAPP'>('ALL');

  // Email Automation Modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [modalRecipients, setModalRecipients] = useState<RecipientLead[]>([]);
  const [modalMode, setModalMode] = useState<'BULK' | 'SINGLE'>('BULK');

  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const openEmailModalForLead = (lead: any) => {
    const r: RecipientLead = {
      companyId: lead.id,
      id: lead.id,
      name: lead.contactName || 'Managing Director',
      companyName: lead.name,
      email: lead.email || `contact@${lead.domain || 'enterprise.ae'}`,
      phone: lead.phone || '+971501234567',
      industry: lead.industry,
      emirate: lead.emirate,
      potentialSimQty: lead.potentialSimQty || 20,
    };
    setModalRecipients([r]);
    setModalMode('SINGLE');
    setIsEmailModalOpen(true);
  };

  const openBulkEmailModal = () => {
    const hotLeadsList = (data?.hotLeads || []).map((l: any) => ({
      companyId: l.id,
      id: l.id,
      name: l.contactName || 'Managing Director',
      companyName: l.name,
      email: l.email || `contact@${l.domain || 'enterprise.ae'}`,
      phone: l.phone || '+971501234567',
      industry: l.industry,
      emirate: l.emirate,
      potentialSimQty: l.potentialSimQty || 20,
    }));
    setModalRecipients(hotLeadsList);
    setModalMode('BULK');
    setIsEmailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-800/60 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#111827] rounded-2xl border border-white/5"></div>
          ))}
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const pipeline = data?.pipeline || [];
  const emirateData = data?.emirates || [];
  const hotLeads = data?.hotLeads || [];
  const pendingFollowUps = data?.pendingFollowUps || [];

  // Monthly trends mock with realistic Etisalat channel distribution
  const trendData = [
    { month: 'Jun', email: 420, whatsapp: 310, meetings: 14 },
    { month: 'Jul', email: 580, whatsapp: 420, meetings: 22 },
    { month: 'Aug', email: 710, whatsapp: 530, meetings: 29 },
    { month: 'Sep', email: 890, whatsapp: 640, meetings: 38 },
    { month: 'Oct', email: 1240, whatsapp: 820, meetings: 54 },
  ];

  return (
    <div className="space-y-7">
      
      {/* Ronas IT Top Bar: Welcome + Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold font-display text-white tracking-tight">
              Etisalat Enterprise CRM
            </h1>
            <span className="metric-chip metric-chip-green">
              <ShieldCheck className="w-3 h-3" />
              <span>Etisalat B2B Partner</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            UAE Corporate SIM Sales, 5G National Data Pooling & Multi-Channel Campaign Automation
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={openBulkEmailModal}
            className="btn-primary text-xs py-2 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-600/25 font-bold"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>+ Quick Mail Campaign</span>
          </button>

          <button
            onClick={() => {
              openBulkEmailModal();
            }}
            className="btn-secondary text-xs py-2 px-3.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-semibold"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp Blast</span>
          </button>

          <button
            onClick={() => navigate('/companies')}
            className="btn-ghost text-xs py-2 px-3 border border-slate-700/60 text-slate-300 hover:text-white"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>View All Accounts</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Ronas IT Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Accounts */}
        <div className="ronas-card p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Target Accounts
              </span>
              <div className="text-3xl font-bold text-white mt-1.5 font-display tracking-tight">
                {kpis.totalCompanies || 128}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="metric-chip metric-chip-green">
              <TrendingUp className="w-3 h-3" />
              <span>+14.2% mo</span>
            </span>
            <span className="text-slate-400 text-[11px]">Dubai & Northern Emirates</span>
          </div>
        </div>

        {/* Card 2: SIM Opportunity */}
        <div className="ronas-card p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Potential SIM Cards
              </span>
              <div className="text-3xl font-bold text-amber-400 mt-1.5 font-display tracking-tight flex items-center gap-1.5">
                <span>{kpis.totalSimPotential || '3,450'}</span>
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="metric-chip metric-chip-amber">
              <span>AED 860K Deal Value</span>
            </span>
            <span className="text-slate-400 text-[11px]">CUG & 5G Fleet Pools</span>
          </div>
        </div>

        {/* Card 3: Outreach & Deliverability */}
        <div className="ronas-card p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Campaign Outreach
              </span>
              <div className="text-3xl font-bold text-emerald-400 mt-1.5 font-display tracking-tight">
                98.2%
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="metric-chip metric-chip-green">
              <span>1,240 Sent</span>
            </span>
            <span className="text-slate-400 text-[11px]">42% Open • 0 Bounced</span>
          </div>
        </div>

        {/* Card 4: Decision Makers & Tasks */}
        <div className="ronas-card p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Pending Follow-Ups
              </span>
              <div className="text-3xl font-bold text-cyan-400 mt-1.5 font-display tracking-tight">
                {kpis.pendingFollowUpsCount || 18}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <PhoneForwarded className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="metric-chip metric-chip-blue">
              <span>{kpis.totalContacts || 84} Decision Makers</span>
            </span>
            <span className="text-slate-400 text-[11px]">Tasks Due</span>
          </div>
        </div>

      </div>

      {/* Visual Pipeline Funnel Cards */}
      <div className="ronas-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              B2B Sales Pipeline Stages
            </h2>
          </div>
          <span className="text-xs text-slate-400">Conversion Progression</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'New Leads', count: 42, color: 'text-indigo-400', bg: 'border-indigo-500/30' },
            { label: 'Qualified', count: 28, color: 'text-cyan-400', bg: 'border-cyan-500/30' },
            { label: 'Contacted', count: 34, color: 'text-amber-400', bg: 'border-amber-500/30' },
            { label: 'Meeting Booked', count: 16, color: 'text-purple-400', bg: 'border-purple-500/30' },
            { label: 'Won / Active', count: 8, color: 'text-emerald-400', bg: 'border-emerald-500/30' },
          ].map((stage, idx) => (
            <div
              key={stage.label}
              className={`p-3.5 rounded-xl bg-[#0b101d] border ${stage.bg} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Step {idx + 1}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              </div>
              <div className={`text-xl font-bold ${stage.color} tracking-tight`}>
                {stage.count}
              </div>
              <div className="text-[11px] font-semibold text-slate-300 mt-1 truncate">
                {stage.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section: Outreach Performance & Emirates Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Outreach Area Chart (8 cols) */}
        <div className="ronas-card p-5 lg:col-span-8 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Outreach & Meeting Conversion Trends</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly multi-channel email campaigns vs. WhatsApp engagement
              </p>
            </div>

            {/* Channel filter switcher */}
            <div className="flex bg-[#0b101d] p-1 rounded-xl border border-white/5 text-xs">
              {(['ALL', 'EMAIL', 'WHATSAPP'] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChartChannel(ch)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    chartChannel === ch
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="emailGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="waGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                {(chartChannel === 'ALL' || chartChannel === 'EMAIL') && (
                  <Area
                    type="monotone"
                    dataKey="email"
                    name="Emails Sent"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#emailGrad)"
                  />
                )}
                {(chartChannel === 'ALL' || chartChannel === 'WHATSAPP') && (
                  <Area
                    type="monotone"
                    dataKey="whatsapp"
                    name="WhatsApp Messages"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#waGrad)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emirates Donut Chart (4 cols) */}
        <div className="ronas-card p-5 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Emirates Lead Share</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Geographic distribution of targeted accounts</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emirateData.length > 0 ? emirateData : [
                    { emirate: 'Dubai', count: 68 },
                    { emirate: 'Abu Dhabi', count: 32 },
                    { emirate: 'Sharjah', count: 18 },
                    { emirate: 'Ajman', count: 10 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="emirate"
                >
                  {emirateData.map((_entry: unknown, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-white font-display">62%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Dubai Core</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2 text-[11px] justify-center">
            {['Dubai', 'Abu Dhabi', 'Sharjah'].map((e, idx) => (
              <span key={e} className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                <span>{e}</span>
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Two Columns: Hot Leads Requiring Outreach + Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Priority Hot Leads (7 cols) */}
        <div className="ronas-card p-5 lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                High-Value Priority Leads
              </h2>
            </div>
            <button
              onClick={() => navigate('/companies')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5">Company Account</th>
                  <th className="pb-2.5">Est. SIMs</th>
                  <th className="pb-2.5 text-center">Score</th>
                  <th className="pb-2.5 text-right">Quick Outreach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(hotLeads.length > 0
                  ? hotLeads.slice(0, 5)
                  : [
                      {
                        id: 'hl-1',
                        name: 'Al Naboodah Construction Group',
                        emirate: 'Dubai',
                        industry: 'CONSTRUCTION',
                        potentialSimQty: 250,
                        score: 94,
                        email: 'procurement@alnaboodah.ae',
                        contactName: 'Rashid Al Nuaimi',
                      },
                      {
                        id: 'hl-2',
                        name: 'Apex Global Logistics FZE',
                        emirate: 'Dubai',
                        industry: 'LOGISTICS',
                        potentialSimQty: 85,
                        score: 89,
                        email: 'v.menon@apexlogistics-me.com',
                        contactName: 'Vikram Menon',
                      },
                      {
                        id: 'hl-3',
                        name: 'CloudCore Technologies FZ-LLC',
                        emirate: 'Dubai',
                        industry: 'IT_TECHNOLOGY',
                        potentialSimQty: 45,
                        score: 84,
                        email: 'ops@cloudcore.ae',
                        contactName: 'David Chen',
                      },
                      {
                        id: 'hl-4',
                        name: 'Gulf Horizon General Trading LLC',
                        emirate: 'Dubai',
                        industry: 'TRADING',
                        potentialSimQty: 30,
                        score: 78,
                        email: 'procurement@gulfhorizon-trading.ae',
                        contactName: 'Omar Farooq',
                      },
                    ]
                ).map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-slate-200">{lead.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{lead.emirate || 'Dubai'}</span>
                        <span>•</span>
                        <span className="text-slate-500">{lead.industry || 'Enterprise'}</span>
                      </div>
                    </td>

                    <td className="py-3">
                      <span className="font-bold text-amber-400 flex items-center gap-1 font-mono">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>{lead.potentialSimQty || 25} lines</span>
                      </span>
                    </td>

                    <td className="py-3 text-center">
                      <span className="metric-chip metric-chip-green">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{lead.score || 85}</span>
                      </span>
                    </td>

                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEmailModalForLead(lead)}
                          title="Send Email with Template"
                          className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEmailModalForLead(lead)}
                          title="Send WhatsApp Outreach"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Outreach Automation Feed (5 cols) */}
        <div className="ronas-card p-5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Dispatch Activity
                </h2>
              </div>
              <span className="metric-chip metric-chip-green">Active Queue</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  channel: 'EMAIL',
                  company: 'Al Naboodah Construction',
                  status: 'DELIVERED',
                  template: 'Etisalat 5G Business Plans & CUG Pool',
                  time: '5m ago',
                },
                {
                  channel: 'WHATSAPP',
                  company: 'Apex Global Logistics',
                  status: 'READ',
                  template: 'cug_fleet_sim_pitch',
                  time: '24m ago',
                },
                {
                  channel: 'EMAIL',
                  company: 'CloudCore Technologies',
                  status: 'SENT',
                  template: 'Corporate SIM Contract Renewal',
                  time: '1h ago',
                },
                {
                  channel: 'EMAIL',
                  company: 'Gulf Horizon General Trading',
                  status: 'OPENED',
                  template: 'High-Volume Fleet SIM Pool',
                  time: '2h ago',
                },
              ].map((act, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#0b101d] border border-white/5 flex items-start gap-3 text-xs"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      act.channel === 'EMAIL'
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {act.channel === 'EMAIL' ? (
                      <Mail className="w-4 h-4" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 truncate">{act.company}</span>
                      <span className="text-[10px] text-slate-500">{act.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{act.template}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="text-[10px] text-emerald-400 font-medium uppercase">
                        {act.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-4">
            <button
              onClick={() => navigate('/campaigns')}
              className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              Go to Campaigns Management →
            </button>
          </div>
        </div>

      </div>

      {/* Global Email Automation Modal */}
      <EmailAutomationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialRecipients={modalRecipients}
        initialMode={modalMode}
        onSuccess={() => {
          fetchDashboard();
        }}
      />

    </div>
  );
};
export default Dashboard;

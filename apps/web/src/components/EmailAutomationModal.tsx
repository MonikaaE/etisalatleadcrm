import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  MessageSquare,
  Sparkles,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Building2,
  Calendar,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  Eye,
  Edit3,
  Flame,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import api from '../lib/api';

export interface RecipientLead {
  companyId?: string;
  contactId?: string;
  id?: string;
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  industry?: string;
  emirate?: string;
  potentialSimQty?: number | string;
}

interface EmailAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipients?: RecipientLead[];
  initialMode?: 'BULK' | 'SINGLE';
  onSuccess?: (result: any) => void;
}

const DEFAULT_EMAIL_TEMPLATES = [
  {
    id: 'etisalat-5g-intro',
    name: 'Etisalat 5G Business Plans & CUG Pool',
    category: 'OUTREACH',
    subject: 'Exclusive Etisalat Business 5G & Corporate SIM proposal for {{company_name}}',
    bodyText: `Dear {{contact_name}},

As an authorized Etisalat Channel Partner in the UAE, Kyzen Telecom works closely with leading enterprises in {{emirate}} to modernize their corporate mobile infrastructure.

Based on our market analysis of {{company_name}} in the {{industry}} sector, your team could benefit significantly from:
• Closed User Group (CUG): 100% free unlimited calling between all company employees
• Pooled 5G National Data: Shareable corporate data bucket (optimizes unused data across staff)
• Roaming & GCC Travel Packs: Zero bill-shock for executive business travel
• Subsidized 5G Handsets: Special enterprise hardware discounts with zero upfront payment

We have prepared an estimated allocation for approximately {{potential_sims}} corporate SIM connections tailored for {{company_name}}.

Would you be open for a brief 10-minute discovery call this week to review your current tariff sheet?

Best regards,
B2B Enterprise Accounts Team
Kyzen Telecom — Authorized Etisalat Channel Partner
Dubai Internet City, Dubai, UAE`,
    htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b; background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #005a36; padding-bottom: 12px; margin-bottom: 20px;">
    <div>
      <span style="font-size: 20px; font-weight: 800; color: #005a36; letter-spacing: -0.5px;">KYZEN</span>
      <span style="font-size: 11px; background: #e6f4ea; color: #005a36; padding: 3px 8px; border-radius: 4px; margin-left: 8px; font-weight: 600;">Authorized Etisalat Partner</span>
    </div>
    <span style="font-size: 11px; color: #64748b;">Enterprise B2B Division</span>
  </div>

  <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">Dear <strong>{{contact_name}}</strong>,</p>

  <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
    As an authorized Etisalat Channel Partner in the UAE, Kyzen Telecom assists established enterprises across <strong>{{emirate}}</strong> in reducing corporate telecom expenditure while upgrading to high-speed 5G network coverage.
  </p>

  <div style="background: #f8fafc; border-left: 4px solid #008751; padding: 14px 16px; margin: 18px 0; border-radius: 0 6px 6px 0;">
    <p style="font-weight: 700; margin: 0 0 8px 0; color: #0f172a; font-size: 14px;">Key Benefits for {{company_name}} ({{industry}}):</p>
    <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.7;">
      <li><strong>Closed User Group (CUG):</strong> Free 0-rated internal communication between all employees.</li>
      <li><strong>Shared Data Pool:</strong> Flexible 5G national data allocated for ~{{potential_sims}} lines.</li>
      <li><strong>Etisalat Business Priority:</strong> Dedicated corporate account manager and SLA-backed support.</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 24px 0;">
    <a href="#" style="background: #008751; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
      Schedule Tariff Comparison Call
    </a>
  </div>

  <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    Warm regards,<br>
    <strong>B2B Enterprise Solutions</strong><br>
    Kyzen Telecom — Authorized Etisalat Partner, Dubai, UAE<br>
    <span style="font-size: 11px; color: #94a3b8;">To opt-out or manage telecom communication preferences, please reply "UNSUBSCRIBE".</span>
  </p>
</div>`,
  },
  {
    id: 'cug-contract-renewal',
    name: 'Corporate SIM Contract Renewal & Bill Audit',
    category: 'RENEWAL',
    subject: 'Expiring Telecom Contract Review for {{company_name}} — Up to 35% Savings',
    bodyText: `Dear {{contact_name}},

Are your corporate telecom contracts at {{company_name}} approaching renewal this quarter?

Through our special 2026 Etisalat Partner Enterprise Incentive, we are conducting complimentary telecom bill audits for companies in {{industry}}. On average, companies in {{emirate}} reduce their monthly SIM spend by 25% to 35% by migrating legacy plans to our latest Etisalat Business bundles.

Key upgrade highlights:
• Free intra-company CUG voice calling
• Subsidized devices & latest 5G business routers
• Seamless number portability with zero operational downtime

Would you be available for a 5-minute call tomorrow?

Best regards,
Etisalat Enterprise Partner Team
Kyzen Telecom`,
    htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b; background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
  <div style="border-bottom: 2px solid #005a36; padding-bottom: 12px; margin-bottom: 20px;">
    <span style="font-size: 18px; font-weight: 800; color: #005a36;">KYZEN TELECOM</span>
    <span style="font-size: 11px; background: #e6f4ea; color: #005a36; padding: 3px 8px; border-radius: 4px; margin-left: 8px;">Etisalat Channel Partner</span>
  </div>
  <p>Dear <strong>{{contact_name}}</strong>,</p>
  <p>Are your corporate telecom contracts at <strong>{{company_name}}</strong> approaching renewal?</p>
  <p>We are offering complimentary telecom bill audits for <strong>{{industry}}</strong> enterprises in <strong>{{emirate}}</strong>, helping teams save up to 35% while retaining current numbers.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="#" style="background: #008751; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Request Tariff Audit</a>
  </div>
</div>`,
  },
  {
    id: 'fleet-sim-bundle',
    name: 'High-Volume Fleet / Driver SIM Pool (Logistics)',
    category: 'FLEET',
    subject: 'Special Fleet & Operational SIM rates for {{company_name}} (~{{potential_sims}} lines)',
    bodyText: `Dear {{contact_name}},

If {{company_name}} operates mobile teams, delivery drivers, or field staff across {{emirate}}, mobile connectivity can represent a substantial recurring cost.

Kyzen Telecom offers custom Etisalat Machine-to-Machine (M2M) and Fleet Driver SIM tariffs designed specifically for high-density operations:
• Ultra-low monthly rates per line
• National GPS tracking data bundles with speed caps to prevent bill shocks
• Centralized billing portal & real-time SIM management

We have modeled a package for {{potential_sims}} SIM lines. Can we share the pricing matrix?

Best regards,
Kyzen Telecom`,
    htmlBody: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #ffffff; color: #1e293b; border-radius: 8px; border: 1px solid #e2e8f0;">
  <h3 style="color: #005a36; margin-top: 0;">High-Volume Fleet SIM Solutions</h3>
  <p>Dear <strong>{{contact_name}}</strong>,</p>
  <p>Special Etisalat M2M & Fleet rates designed for <strong>{{company_name}}</strong> with ~{{potential_sims}} active operational lines.</p>
</div>`,
  },
];

const DEFAULT_WHATSAPP_TEMPLATES = [
  {
    id: 'wa-etisalat-intro',
    name: 'etisalat_b2b_intro_v1',
    category: 'MARKETING',
    previewText:
      'Marhaba {{1}}, this is Rashid from Kyzen Telecom, authorized Etisalat Channel Partner in Dubai. We assist companies in {{2}} to optimize mobile expenses with our 2026 Business SIM bundles. Would you be open for a quick 5-minute comparison?',
  },
  {
    id: 'wa-cug-pitch',
    name: 'cug_fleet_sim_pitch',
    category: 'MARKETING',
    previewText:
      'Hello {{1}}, noticed that {{2}} manages operations in the UAE. Etisalat offers zero-rated intra-company calls (CUG) + 15GB pooled national data per SIM. Would you like to review the tariff sheet?',
  },
];

export const EmailAutomationModal: React.FC<EmailAutomationModalProps> = ({
  isOpen,
  onClose,
  initialRecipients = [],
  initialMode = 'BULK',
  onSuccess,
}) => {
  // Channel: EMAIL vs WHATSAPP
  const [activeChannel, setActiveChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');

  // Mode: BULK vs SINGLE (sequential review)
  const [sendMode, setSendMode] = useState<'BULK' | 'SINGLE'>(initialMode);

  // Recipients
  const [recipients, setRecipients] = useState<RecipientLead[]>([]);
  const [activeRecipientIndex, setActiveRecipientIndex] = useState(0);

  // Template state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templates, setTemplates] = useState<any[]>(DEFAULT_EMAIL_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_EMAIL_TEMPLATES[0].id);

  // WhatsApp Templates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [waTemplates, setWaTemplates] = useState<any[]>(DEFAULT_WHATSAPP_TEMPLATES);
  const [selectedWaTemplateId, setSelectedWaTemplateId] = useState<string>(DEFAULT_WHATSAPP_TEMPLATES[0].id);

  // Email Fields
  const [subject, setSubject] = useState(DEFAULT_EMAIL_TEMPLATES[0].subject);
  const [bodyText, setBodyText] = useState(DEFAULT_EMAIL_TEMPLATES[0].bodyText);
  const [htmlBody, setHtmlBody] = useState(DEFAULT_EMAIL_TEMPLATES[0].htmlBody);
  const [previewTab, setPreviewTab] = useState<'PREVIEW' | 'EDITOR'>('PREVIEW');

  // Automation flags
  const [campaignName, setCampaignName] = useState('');
  const [updateLeadStatus, setUpdateLeadStatus] = useState(true);
  const [createFollowUpTask, setCreateFollowUpTask] = useState(true);

  // Dispatch progress
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });
  const [sendSuccessResult, setSendSuccessResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync initial recipients on open
  useEffect(() => {
    if (isOpen) {
      const validRecipients = (initialRecipients || []).map((r) => ({
        companyId: r.companyId || r.id,
        contactId: r.contactId,
        name: r.name || 'Decision Maker',
        companyName: r.companyName || 'Enterprise Partner',
        email: r.email || (r.companyName ? `info@${r.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.ae` : 'contact@enterprise.ae'),
        phone: r.phone || '+971501234567',
        industry: r.industry || 'Business Services',
        emirate: r.emirate || 'Dubai',
        potentialSimQty: r.potentialSimQty || 20,
      }));

      // Fallback sample if empty
      if (validRecipients.length === 0) {
        validRecipients.push({
          companyId: 'sample-1',
          name: 'Managing Director',
          companyName: 'Al Naboodah Enterprise LLC',
          email: 'procurement@alnaboodah.ae',
          phone: '+97142948888',
          industry: 'CONSTRUCTION',
          emirate: 'Dubai',
          potentialSimQty: 150,
          contactId: ''
        });
      }

      setRecipients(validRecipients);
      setActiveRecipientIndex(0);
      setSendMode(validRecipients.length > 1 ? 'BULK' : 'SINGLE');
      setCampaignName(`Etisalat Outreach - ${new Date().toLocaleDateString('en-GB')}`);
      setSendSuccessResult(null);
      setErrorMessage('');
    }
  }, [isOpen, initialRecipients]);

  // Load server templates if available
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await api.get('/templates');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const emailList = res.data.data.filter((t: any) => t.channel === 'EMAIL' || !t.channel);
          const waList = res.data.data.filter((t: any) => t.channel === 'WHATSAPP');

          if (emailList.length > 0) {
            setTemplates([...DEFAULT_EMAIL_TEMPLATES, ...emailList]);
          }
          if (waList.length > 0) {
            setWaTemplates([...DEFAULT_WHATSAPP_TEMPLATES, ...waList]);
          }
        }
      } catch (err) {
        // Fallback to defaults
      }
    };
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // Current active recipient for preview & single send
  const currentRecipient = useMemo(() => {
    return recipients[activeRecipientIndex] || recipients[0] || {};
  }, [recipients, activeRecipientIndex]);

  // When email template changes, update subject & body
  const handleSelectEmailTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const found = templates.find((t) => t.id === templateId);
    if (found) {
      setSubject(found.subject || '');
      setBodyText(found.bodyText || found.textBody || '');
      setHtmlBody(found.htmlBody || `<p>${(found.bodyText || found.subject || '').replace(/\n/g, '<br/>')}</p>`);
    }
  };

  // Replace variable placeholders helper
  const interpolate = (text: string, r: RecipientLead) => {
    if (!text) return '';
    const contactName = r.name || 'Business Executive';
    const compName = r.companyName || 'Enterprise Partner';
    const firstName = contactName.split(' ')[0] || contactName;
    const simQty = String(r.potentialSimQty || '25');
    const ind = r.industry || 'Corporate';
    const emi = r.emirate || 'Dubai';

    return text
      .replace(/\{\{company_name\}\}/gi, compName)
      .replace(/\{\{contact_name\}\}/gi, contactName)
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{industry\}\}/gi, ind)
      .replace(/\{\{potential_sims\}\}/gi, simQty)
      .replace(/\{\{emirate\}\}/gi, emi)
      .replace(/\{\{1\}\}/g, contactName)
      .replace(/\{\{2\}\}/g, compName);
  };

  // Live preview values
  const previewSubject = useMemo(() => interpolate(subject, currentRecipient), [subject, currentRecipient]);
  const previewBodyText = useMemo(() => interpolate(bodyText, currentRecipient), [bodyText, currentRecipient]);
  const previewHtml = useMemo(() => interpolate(htmlBody, currentRecipient), [htmlBody, currentRecipient]);

  // Insert variable into subject or body
  const insertToken = (token: string, field: 'subject' | 'body') => {
    if (field === 'subject') {
      setSubject((prev) => prev + ` {{${token}}}`);
    } else {
      setBodyText((prev) => prev + ` {{${token}}}`);
    }
  };

  // Remove recipient from batch
  const handleRemoveRecipient = (idx: number) => {
    setRecipients((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (activeRecipientIndex >= next.length && next.length > 0) {
        setActiveRecipientIndex(next.length - 1);
      }
      return next;
    });
  };

  // Dispatch Email Sending (Bulk or Single)
  const handleSendEmails = async () => {
    if (recipients.length === 0) {
      setErrorMessage('No recipients selected');
      return;
    }
    setErrorMessage('');
    setIsSending(true);

    const targetRecipients = sendMode === 'SINGLE' ? [currentRecipient] : recipients;
    setSendingProgress({ current: 0, total: targetRecipients.length });

    try {
      const payload = {
        mode: sendMode,
        templateId: selectedTemplateId,
        subject,
        body: bodyText,
        campaignName: campaignName.trim() || undefined,
        createFollowUpTask,
        updateLeadStatus,
        recipients: targetRecipients.map((r) => ({
          companyId: r.companyId,
          contactId: r.contactId,
          name: r.name,
          email: r.email,
          companyName: r.companyName,
          industry: r.industry,
          emirate: r.emirate,
          potentialSimQty: Number(r.potentialSimQty) || 10,
          phone: r.phone,
        })),
      };

      const res = await api.post('/campaigns/send-mail', payload);
      if (res.data?.success) {
        setSendSuccessResult(res.data);
        if (onSuccess) onSuccess(res.data);
      } else {
        throw new Error(res.data?.message || 'Failed to dispatch email');
      }
    } catch (err: any) {
      console.error('Email send failed:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Error dispatching emails');
    } finally {
      setIsSending(false);
    }
  };

  // Dispatch WhatsApp Automation
  const handleSendWhatsApp = async () => {
    if (recipients.length === 0) {
      setErrorMessage('No recipients selected');
      return;
    }
    setErrorMessage('');
    setIsSending(true);

    const activeWaTemplate = waTemplates.find((t) => t.id === selectedWaTemplateId) || waTemplates[0];
    const targetRecipients = sendMode === 'SINGLE' ? [currentRecipient] : recipients;

    try {
      const payload = {
        mode: sendMode,
        templateId: selectedWaTemplateId,
        messageText: activeWaTemplate.previewText || activeWaTemplate.bodyText || '',
        recipients: targetRecipients.map((r) => ({
          companyId: r.companyId,
          contactId: r.contactId,
          phone: r.phone || '+971501234567',
          name: r.name,
          companyName: r.companyName,
        })),
      };

      const res = await api.post('/campaigns/send-whatsapp', payload);
      if (res.data?.success) {
        setSendSuccessResult({
          success: true,
          message: `WhatsApp automation executed for ${targetRecipients.length} company lead(s)`,
          sentCount: targetRecipients.length,
          mode: sendMode,
        });
        if (onSuccess) onSuccess(res.data);
      } else {
        throw new Error(res.data?.message || 'Failed to send WhatsApp messages');
      }
    } catch (err: any) {
      console.error('WhatsApp outreach error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'WhatsApp automation failed');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0e1424] border border-[rgba(99,102,241,0.25)] rounded-2xl w-full max-w-5xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh] animate-fade-in text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[rgba(99,102,241,0.15)] bg-gradient-to-r from-[#121b33] via-[#0f172a] to-[#121b33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              {activeChannel === 'EMAIL' ? (
                <Mail className="w-5 h-5 text-white" />
              ) : (
                <MessageSquare className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display text-white">
                  {activeChannel === 'EMAIL' ? 'Etisalat B2B Email Outreach' : 'Meta WhatsApp Cloud Outreach'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {sendMode === 'BULK' ? '⚡ Bulk Blast Mode' : '🎯 Separate / 1-by-1 Review'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Personalized template automation with Etisalat Channel Partner compliance
              </p>
            </div>
          </div>

          {/* Close & Channel Switchers */}
          <div className="flex items-center gap-3">
            <div className="flex bg-[#090d16] p-1 rounded-xl border border-[rgba(99,102,241,0.2)]">
              <button
                onClick={() => setActiveChannel('EMAIL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChannel === 'EMAIL'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Outreach</span>
              </button>
              <button
                onClick={() => setActiveChannel('WHATSAPP')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChannel === 'WHATSAPP'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Automation</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {sendSuccessResult ? (
          /* Success Screen */
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Outreach Dispatched Successfully!</h3>
            <p className="text-sm text-slate-300 max-w-md">
              {sendSuccessResult.message || `Dispatched to ${sendSuccessResult.sentCount || recipients.length} recipients.`}
            </p>
            <div className="bg-[#131b2e] p-4 rounded-xl border border-indigo-500/20 max-w-lg w-full text-xs text-left space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Campaign Channel:</span>
                <span className="font-semibold text-white">{activeChannel}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Recipients:</span>
                <span className="font-semibold text-emerald-400">{sendSuccessResult.sentCount || recipients.length} Enterprise Leads</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Lead Status:</span>
                <span className="font-semibold text-indigo-300">Updated to "CONTACTED"</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Follow-up Task:</span>
                <span className="font-semibold text-amber-400">Scheduled in 3 days</span>
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <button
                onClick={onClose}
                className="btn-primary px-6"
              >
                Done & Return to CRM
              </button>
            </div>
          </div>
        ) : (
          /* Composer View */
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
            
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 p-5 border-r border-[rgba(99,102,241,0.15)] bg-[#0c1220] space-y-4 overflow-y-auto">
              
              {/* Mode Toggle: Bulk vs Single */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Delivery Mode
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#080d17] p-1 rounded-xl border border-[rgba(99,102,241,0.2)]">
                  <button
                    type="button"
                    onClick={() => setSendMode('BULK')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      sendMode === 'BULK'
                        ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Bulk Send ({recipients.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendMode('SINGLE')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      sendMode === 'SINGLE'
                        ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Separately</span>
                  </button>
                </div>
              </div>

              {/* Template Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select Outreach Template</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified UAE B2B</span>
                  </span>
                </div>

                {activeChannel === 'EMAIL' ? (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectEmailTemplate(e.target.value)}
                    className="input-field text-xs bg-[#131b2e] cursor-pointer"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.category || 'EMAIL'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedWaTemplateId}
                    onChange={(e) => setSelectedWaTemplateId(e.target.value)}
                    className="input-field text-xs bg-[#131b2e] cursor-pointer"
                  >
                    {waTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} (Meta Approved)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dynamic Tokens Palette */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Insert Variable Tokens</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Company Name', token: 'company_name' },
                    { label: 'Contact Person', token: 'contact_name' },
                    { label: 'First Name', token: 'first_name' },
                    { label: 'Industry', token: 'industry' },
                    { label: 'Est. SIMs', token: 'potential_sims' },
                    { label: 'Emirate', token: 'emirate' },
                  ].map((t) => (
                    <button
                      key={t.token}
                      type="button"
                      onClick={() => insertToken(t.token, 'body')}
                      className="text-[11px] font-mono px-2 py-1 rounded-md bg-[#162138] hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/50 transition-all flex items-center gap-1"
                      title={`Click to append {{${t.token}}} to message`}
                    >
                      <span>+{`{{${t.token}}}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipients Review & Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Selected Leads ({recipients.length})
                  </label>
                  {sendMode === 'SINGLE' && recipients.length > 1 && (
                    <div className="flex items-center gap-1 text-[11px] text-indigo-300 font-medium">
                      <span>Lead {activeRecipientIndex + 1} of {recipients.length}</span>
                      <button
                        onClick={() => setActiveRecipientIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeRecipientIndex === 0}
                        className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setActiveRecipientIndex((prev) => Math.min(recipients.length - 1, prev + 1))}
                        disabled={activeRecipientIndex === recipients.length - 1}
                        className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {recipients.map((r, i) => {
                    const isCurrent = sendMode === 'SINGLE' && activeRecipientIndex === i;
                    return (
                      <div
                        key={r.companyId || i}
                        onClick={() => {
                          if (sendMode === 'SINGLE') setActiveRecipientIndex(i);
                        }}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-600/30 border border-indigo-500/60 shadow-sm'
                            : 'bg-[#131b2e] border border-[rgba(99,102,241,0.1)] hover:bg-[#18233c]'
                        }`}
                      >
                        <div className="truncate flex-1 pr-2">
                          <p className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                            <span>{r.companyName}</span>
                            {Number(r.potentialSimQty) > 0 && (
                              <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1 rounded flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                {r.potentialSimQty} SIMs
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {r.name} • {activeChannel === 'EMAIL' ? r.email : r.phone}
                          </p>
                        </div>
                        {recipients.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRecipient(i);
                            }}
                            className="text-slate-500 hover:text-red-400 p-1"
                            title="Remove lead"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automation Settings */}
              <div className="p-3 rounded-xl bg-[#090e18] border border-[rgba(99,102,241,0.15)] space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Outreach Automation Actions
                </p>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Campaign Group Tag</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Q4 Dubai B2B Outreach"
                    className="input-field text-xs py-1.5"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateLeadStatus}
                    onChange={(e) => setUpdateLeadStatus(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Auto-update status to "CONTACTED"</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createFollowUpTask}
                    onChange={(e) => setCreateFollowUpTask(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Create 3-day Follow-up Call task in CRM</span>
                </label>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Right Interactive Preview & Editor (7 cols) */}
            <div className="lg:col-span-7 p-5 bg-[#0f1629] flex flex-col justify-between space-y-4 overflow-y-auto">
              
              {/* Active Channel Content */}
              {activeChannel === 'EMAIL' ? (
                <div className="space-y-4">
                  {/* Subject Line */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                      <span>Email Subject Line</span>
                      <span className="text-[10px] text-indigo-400 font-mono">Dynamic Tokens Active</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="input-field text-xs py-2 bg-[#131d35] font-medium"
                    />
                  </div>

                  {/* Body Preview / Code Tabs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {previewTab === 'PREVIEW'
                          ? `Personalized Preview for: ${currentRecipient.companyName || 'Enterprise'}`
                          : 'Template Message Editor'}
                      </span>
                      <div className="flex bg-[#090d16] p-0.5 rounded-lg border border-[rgba(99,102,241,0.2)]">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('PREVIEW')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all ${
                            previewTab === 'PREVIEW'
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>Branded Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('EDITOR')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all ${
                            previewTab === 'EDITOR'
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Text</span>
                        </button>
                      </div>
                    </div>

                    {previewTab === 'PREVIEW' ? (
                      /* Rendered Personalized View */
                      <div className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#11182c] overflow-hidden">
                        {/* Fake email client header */}
                        <div className="bg-[#0b1021] p-3 border-b border-[rgba(99,102,241,0.15)] text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-semibold w-14">From:</span>
                            <span className="text-indigo-300 font-medium">Kyzen Telecom &lt;outreach@kyzen.ae&gt;</span>
                            <span className="badge-green text-[10px] ml-auto">Etisalat Authorized Partner</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-semibold w-14">To:</span>
                            <span className="text-slate-200 font-medium">
                              {currentRecipient.name} &lt;{currentRecipient.email}&gt;
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-semibold w-14">Subject:</span>
                            <span className="text-white font-semibold truncate">{previewSubject}</span>
                          </div>
                        </div>

                        {/* Rendered HTML or styled body */}
                        <div className="p-4 bg-white text-slate-800 rounded-b-xl max-h-72 overflow-y-auto text-xs">
                          {htmlBody && htmlBody.includes('<') ? (
                            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                          ) : (
                            <div className="whitespace-pre-line font-sans leading-relaxed text-slate-800">
                              {previewBodyText}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Text Editor */
                      <textarea
                        rows={10}
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        className="input-field text-xs font-mono leading-relaxed bg-[#131d35] p-3"
                        placeholder="Enter email content with {{company_name}}, {{contact_name}}, etc."
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* WhatsApp Interactive Simulation */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Meta WhatsApp Cloud API Automation</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Official pre-approved template message with dynamic parameters
                      </p>
                    </div>
                    <span className="badge-green text-[10px]">Cloud API Active</span>
                  </div>

                  {/* WhatsApp Phone Mockup */}
                  <div className="max-w-md mx-auto bg-[#0b141a] rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden">
                    {/* WhatsApp Chat Header */}
                    <div className="bg-[#1f2c34] p-3 flex items-center gap-3 border-b border-slate-700/50">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                        ET
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white flex items-center gap-1">
                          <span>Kyzen Etisalat Partner</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                        </p>
                        <p className="text-[10px] text-slate-400">Verified Business Account</p>
                      </div>
                    </div>

                    {/* WhatsApp Chat Body */}
                    <div className="p-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] min-h-[220px] flex flex-col justify-end">
                      <div className="bg-[#005c4b] text-white p-3.5 rounded-xl rounded-tr-none text-xs leading-relaxed max-w-[90%] self-end shadow-md">
                        <p className="whitespace-pre-line">
                          {interpolate(
                            waTemplates.find((t) => t.id === selectedWaTemplateId)?.previewText ||
                              waTemplates[0].previewText,
                            currentRecipient
                          )}
                        </p>
                        <div className="text-[10px] text-emerald-200/60 text-right mt-1.5 flex items-center justify-end gap-1">
                          <span>11:42 AM</span>
                          <span>✓✓</span>
                        </div>
                      </div>

                      {/* Quick Reply CTA */}
                      <div className="mt-2 self-end w-[90%]">
                        <div className="bg-[#1f2c34] hover:bg-[#2a3942] text-cyan-400 font-semibold p-2 text-center rounded-lg text-xs cursor-pointer border border-slate-700 transition-colors">
                          📞 Request Etisalat Tariff Sheet
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons & Execution Bar */}
              <div className="pt-4 border-t border-[rgba(99,102,241,0.15)] flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>
                    Ready to send to{' '}
                    <strong className="text-white">
                      {sendMode === 'BULK' ? recipients.length : 1}
                    </strong>{' '}
                    lead(s)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSending}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={activeChannel === 'EMAIL' ? handleSendEmails : handleSendWhatsApp}
                    disabled={isSending || recipients.length === 0}
                    className={`text-xs px-5 py-2.5 font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                      activeChannel === 'EMAIL'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/30'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30'
                    }`}
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>
                          {sendMode === 'BULK'
                            ? `Blast ${activeChannel === 'EMAIL' ? 'Bulk Email' : 'WhatsApp'} (${recipients.length})`
                            : `Send Email to ${currentRecipient.companyName || 'Lead'}`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default EmailAutomationModal;

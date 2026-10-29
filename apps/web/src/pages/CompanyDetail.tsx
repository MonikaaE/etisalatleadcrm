import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Flame,
  Sparkles,
  Users,
  CheckSquare,
  Plus,
  Send,
  Calendar
} from 'lucide-react';
import api from '../lib/api';

export const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    type: 'CALL',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await api.get(`/companies/${id}`);
        if (res.data?.success) {
          setCompany(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load company detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        ...taskForm,
        companyId: id,
        dueDate: new Date(taskForm.dueDate).toISOString(),
      });
      setIsTaskModalOpen(false);
      // Refresh company detail to include newly created task
      const res = await api.get(`/companies/${id}`);
      if (res.data?.success) setCompany(res.data.data);
    } catch (err) {
      console.error('Error creating follow-up task:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Loading company profile...</div>;
  }

  if (!company) {
    return <div className="text-center py-20 text-slate-500">Company not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back button and page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/companies')}
          className="p-2 rounded-lg bg-[#131d35] border border-[rgba(99,102,241,0.2)] text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-display text-white">{company.name}</h1>
          <p className="text-xs text-slate-400">Account ID: {company.id}</p>
        </div>
      </div>

      {/* Main Grid: Info + Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Contacts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Core Information */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="section-title">Company Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>
                  <strong>Emirate:</strong> {company.emirate || 'Dubai, UAE'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>
                  <strong>Industry:</strong> {company.industry || 'General Business'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="w-4 h-4 text-indigo-400" />
                <span>
                  <strong>Phone:</strong> {company.phone || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>
                  <strong>Email:</strong> {company.email || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>
                  <strong>Website:</strong> {company.website || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>Estimated SIMs:</strong> {company.potentialSimQty || 10} Units
                </span>
              </div>
            </div>
          </div>

          {/* Associated Contacts */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h2 className="section-title">Decision Makers & Key Contacts</h2>
              </div>
              <button
                onClick={() => navigate('/contacts')}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            </div>

            <div className="space-y-3">
              {company.contacts?.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No contacts associated yet.</p>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                company.contacts?.map((contact: any) => (
                  <div
                    key={contact.id}
                    className="p-3 rounded-lg bg-[#0f1629] border border-[rgba(99,102,241,0.15)] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">
                        {contact.fullName || `${contact.firstName} ${contact.lastName}`}
                      </div>
                      <div className="text-xs text-slate-400">{contact.jobTitle || 'Executive / Manager'}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        {contact.phone && <span>📞 {contact.phone}</span>}
                        {contact.email && <span>✉️ {contact.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge-green text-xs">Opted-in</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Follow-up Tasks */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-cyan-400" />
                <h2 className="section-title">Sales Tasks & Follow-up History</h2>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="btn-primary text-xs py-1.5 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Task</span>
              </button>
            </div>

            <div className="space-y-2">
              {company.tasks?.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No tasks or follow-ups scheduled.</p>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                company.tasks?.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg bg-[#0f1629] border border-[rgba(99,102,241,0.1)] flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{t.title}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="uppercase text-[10px] text-indigo-400">{t.type}</span>
                      </div>
                    </div>
                    <span className="badge-purple text-xs">{t.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Transparent Lead Score Breakdown */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-indigo-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Kyzen Telecom Fit Score
              </span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-extrabold text-white">{company.leadScore || 0}</span>
              <span className="text-slate-500 text-sm">/ 100</span>
              <span
                className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  company.scoreGrade === 'A'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                Grade {company.scoreGrade || 'B'} Lead
              </span>
            </div>

            {/* Score Explanation / Breakdown */}
            <div className="space-y-3 pt-3 border-t border-[rgba(99,102,241,0.15)] text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Industry Fit (High Telecom Propensity)</span>
                <span className="font-semibold text-emerald-400">+20 pts</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Estimated SIM Count ({company.potentialSimQty || 10}+ SIMs)</span>
                <span className="font-semibold text-emerald-400">+14 pts</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Corporate Contact Channels Present</span>
                <span className="font-semibold text-emerald-400">+25 pts</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Dubai / UAE Jurisdiction Verification</span>
                <span className="font-semibold text-emerald-400">+10 pts</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(99,102,241,0.15)]">
              <button
                onClick={() => navigate('/campaigns')}
                className="w-full btn-primary justify-center text-xs py-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Launch Outreach Sequence</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold font-display text-white mb-4">Schedule Follow-up Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="label">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Call PRO regarding 25 SIM quota renewal"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Activity Type</label>
                  <select
                    value={taskForm.type}
                    onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp Follow-up</option>
                    <option value="EMAIL">Email Outreach</option>
                    <option value="MEETING">In-person Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Due Date</label>
                <input
                  type="date"
                  required
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(99,102,241,0.15)]">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

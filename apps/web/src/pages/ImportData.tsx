import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
  RefreshCw
} from 'lucide-react';
import api from '../lib/api';

export const ImportData: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [recordType, setRecordType] = useState<'COMPANY' | 'CONTACT'>('COMPANY');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const companyTargetFields = [
    { key: 'name', label: 'Company Name (Required)' },
    { key: 'emirate', label: 'Emirate (Dubai, Abu Dhabi, etc.)' },
    { key: 'industry', label: 'Industry' },
    { key: 'potentialSimQty', label: 'Potential SIM Count' },
    { key: 'phone', label: 'Company Phone' },
    { key: 'email', label: 'Company Email' },
    { key: 'website', label: 'Website' },
    { key: 'employeeSizeBand', label: 'Company Size' },
  ];

  const contactTargetFields = [
    { key: 'firstName', label: 'First Name (Required)' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone / WhatsApp' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'roleGroup', label: 'Role Group (PRO, HR, IT, Management)' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('recordType', recordType);

    try {
      const res = await api.post('/imports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        setImportJobId(res.data.data.jobId);
        setHeaders(res.data.data.headers);

        // Auto-match headers if names match
        const initialMap: Record<string, string> = {};
        const availableTargets = recordType === 'COMPANY' ? companyTargetFields : contactTargetFields;
        res.data.data.headers.forEach((h: string) => {
          const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = availableTargets.find((t) => t.key.toLowerCase() === cleanH);
          if (match) initialMap[h] = match.key;
        });
        setMapping(initialMap);
        setStep(2);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message || 'File upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!importJobId) return;
    setLoading(true);
    try {
      await api.post(`/imports/${importJobId}/execute`, {
        mapping,
        options: { duplicateAction: 'skip', skipInvalid: true },
      });
      setStep(3);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message || 'Failed to start import job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Import Business Leads</h1>
        <p className="text-sm text-slate-400">Bulk upload UAE corporate prospects via CSV or Excel with column mapping & deduplication</p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={`glass-card p-3 text-center border-l-4 ${
            step === 1 ? 'border-l-indigo-500 bg-indigo-500/5' : 'border-l-transparent'
          }`}
        >
          <span className="text-xs font-semibold text-slate-400 block">Step 1</span>
          <span className="text-sm font-medium text-slate-200">Upload CSV / XLSX</span>
        </div>
        <div
          className={`glass-card p-3 text-center border-l-4 ${
            step === 2 ? 'border-l-indigo-500 bg-indigo-500/5' : 'border-l-transparent'
          }`}
        >
          <span className="text-xs font-semibold text-slate-400 block">Step 2</span>
          <span className="text-sm font-medium text-slate-200">Map Columns</span>
        </div>
        <div
          className={`glass-card p-3 text-center border-l-4 ${
            step === 3 ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-transparent'
          }`}
        >
          <span className="text-xs font-semibold text-slate-400 block">Step 3</span>
          <span className="text-sm font-medium text-slate-200">Processing & Status</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="glass-card p-8 space-y-6">
          <div>
            <label className="label">Select Target Entity</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRecordType('COMPANY')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  recordType === 'COMPANY'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-[rgba(99,102,241,0.15)] bg-[#0f1629] text-slate-400'
                }`}
              >
                <div className="font-semibold text-sm">Companies & Accounts</div>
                <div className="text-xs text-slate-400 mt-1">UAE firms, trade licenses, SIM quota requirements</div>
              </button>

              <button
                type="button"
                onClick={() => setRecordType('CONTACT')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  recordType === 'CONTACT'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-[rgba(99,102,241,0.15)] bg-[#0f1629] text-slate-400'
                }`}
              >
                <div className="font-semibold text-sm">Decision Maker Contacts</div>
                <div className="text-xs text-slate-400 mt-1">PROs, HR Directors, IT Managers, C-Suite</div>
              </button>
            </div>
          </div>

          <div>
            <label className="label">Choose File (.csv, .xlsx)</label>
            <div className="border-2 border-dashed border-[rgba(99,102,241,0.25)] rounded-2xl p-8 text-center bg-[#0f1629]/40 hover:bg-[#0f1629]/70 transition-colors">
              <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-sm font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Browse your computer
              </label>
              <p className="text-xs text-slate-500 mt-1">Supports CSV, XLSX up to 25MB</p>
              {file && (
                <div className="mt-4 p-2 bg-[#131d35] rounded-lg inline-flex items-center gap-2 text-xs text-slate-200">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[rgba(99,102,241,0.15)]">
            <button
              disabled={!file || loading}
              onClick={handleUpload}
              className="btn-primary"
            >
              <span>{loading ? 'Uploading File...' : 'Continue to Column Mapping'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Mapping */}
      {step === 2 && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Map File Columns to CRM Fields</h2>
            <span className="badge-blue text-xs">{headers.length} Columns Detected</span>
          </div>

          <div className="space-y-3">
            {headers.map((hdr) => {
              const targets = recordType === 'COMPANY' ? companyTargetFields : contactTargetFields;
              return (
                <div
                  key={hdr}
                  className="p-3 rounded-lg bg-[#0f1629] border border-[rgba(99,102,241,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                >
                  <div className="font-medium text-slate-200">{hdr}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Maps to:</span>
                    <select
                      value={mapping[hdr] || ''}
                      onChange={(e) => setMapping({ ...mapping, [hdr]: e.target.value })}
                      className="input-field text-xs py-1.5 w-56"
                    >
                      <option value="">-- Ignore Column --</option>
                      {targets.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[rgba(99,102,241,0.15)]">
            <button
              onClick={() => setStep(1)}
              className="btn-ghost text-xs"
            >
              Back
            </button>
            <button
              disabled={loading}
              onClick={handleExecuteImport}
              className="btn-primary"
            >
              <span>{loading ? 'Submitting to Queue...' : 'Execute Import Job'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success / Queued */}
      {step === 3 && (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display text-white">Import Job Queued Successfully</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Your dataset is now being processed in the background by the BullMQ worker engine.
            Rows are automatically validated, normalized to UAE E.164 phone formats, and deduplicated.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
              }}
              className="btn-secondary text-xs"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

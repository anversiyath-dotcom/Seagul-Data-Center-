import React, { useState } from 'react';
import { VisaFollowup, VisaStatus } from '../types';
import { ExternalLink, Copy, Check, Sparkles, RefreshCw, ShieldCheck, AlertCircle, FileText, X, Globe, Calendar, User, Clock } from 'lucide-react';

interface IcpTrackerModalProps {
  visa: VisaFollowup;
  isOpen: boolean;
  onClose: () => void;
  onUpdateVisaStatus: (
    visaId: string,
    newStatus: VisaStatus,
    icpFileNo?: string,
    lastCheckedAt?: string,
    expiryDate?: string,
    entryDate?: string
  ) => void;
}

export const IcpTrackerModal: React.FC<IcpTrackerModalProps> = ({
  visa,
  isOpen,
  onClose,
  onUpdateVisaStatus,
}) => {
  const [icpFileNo, setIcpFileNo] = useState(visa.icpFileNo || '');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    recommendedStatus: VisaStatus;
    calculatedExpiryDate?: string;
    calculatedEntryDate?: string;
    isValid: boolean;
    daysRemaining: number;
    notes: string;
    checkedAt: string;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  if (!isOpen) return null;

  const icpPortalUrl = "https://smartservices.icp.gov.ae/echannels/web/client/default.html#/fileValidity";

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRunAutoSync = async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch('/api/check-visa-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passportNo: visa.passportNo,
          passportExpiry: visa.passportExpiry,
          nationality: visa.nationality,
          dob: visa.dob,
          unifiedNumber: visa.unifiedNumber,
          visaCategory: visa.visaCategory,
          entryDate: visa.entryDate,
          expiryDate: visa.expiryDate,
          currentStatus: visa.status,
          icpFileNo: icpFileNo || visa.icpFileNo,
        }),
      });

      const res = await response.json();
      if (res.success && res.data) {
        setSyncResult({
          recommendedStatus: (res.data.recommendedStatus as VisaStatus) || visa.status,
          calculatedExpiryDate: res.data.calculatedExpiryDate || visa.expiryDate,
          calculatedEntryDate: res.data.calculatedEntryDate || visa.entryDate,
          isValid: res.data.isValid,
          daysRemaining: res.data.daysRemaining,
          notes: res.data.notes,
          checkedAt: res.checkedAt,
        });
      } else if (res.isQuotaExceeded || response.status === 429) {
        setSyncError('⚠️ AI Daily Quota Limit Reached (20 requests/day limit). You can use the fast-copy buttons below to check directly on ICP Smart Services Portal or update status manually.');
      } else {
        setSyncError(res.error || 'Failed to auto-sync status.');
      }
    } catch (err: any) {
      setSyncError('Network error connecting to verification service. You can use the fast-copy buttons below to check directly on ICP Smart Services Portal.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyStatus = () => {
    if (!syncResult) return;
    const nowStr = syncResult.checkedAt || new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    onUpdateVisaStatus(
      visa.id,
      syncResult.recommendedStatus,
      icpFileNo,
      nowStr,
      syncResult.calculatedExpiryDate,
      syncResult.calculatedEntryDate
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-[#0088CC] text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <span>UAE ICP Live Visa Status Tracking</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 px-2 py-0.5 rounded-full font-semibold">
                  ICP Smart Services
                </span>
              </h3>
              <p className="text-[11px] text-blue-100">
                {visa.firstName} {visa.lastName} • Passport: {visa.passportNo}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs text-slate-800">

          {/* Quick External Link Portal Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 font-bold text-blue-900 text-sm">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>ICP Smart Services Immigration Portal</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Official Federal Authority for Identity & Citizenship (UAE File Validity Portal)
              </p>
            </div>

            <a
              href={icpPortalUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center space-x-2 shrink-0 transition-all hover:scale-102"
            >
              <span>Open ICP Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* ICP File Validity 2 Official Portal Query Options */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>ICP Portal Search Methods (Select Visa - Not Residency)</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Fast-copy required fields for ICP Portal</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option 1: Search by Visa / UID Number */}
              <div className="bg-white border border-purple-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-purple-100 pb-1.5">
                  <span className="font-bold text-purple-900 text-[11px] flex items-center space-x-1">
                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-mono">1</span>
                    <span>Option 1: Search by Visa (UID)</span>
                  </span>
                  <span className="text-[9px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded">UID Method</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">1. Unified No. (UID)</span>
                      <span className="font-mono font-bold text-slate-800">{visa.unifiedNumber || 'Not Set'}</span>
                    </div>
                    {visa.unifiedNumber && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(visa.unifiedNumber || '', 'UID')}
                        className="px-2 py-0.5 bg-white hover:bg-purple-50 text-purple-700 border border-slate-200 rounded font-semibold text-[10px] flex items-center space-x-1"
                      >
                        {copiedField === 'UID' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'UID' ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">2. Person Date of Birth (DOB)</span>
                      <span className="font-mono font-bold text-slate-800">{visa.dob || 'Not Set'}</span>
                    </div>
                    {visa.dob && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(visa.dob || '', 'DOB')}
                        className="px-2 py-0.5 bg-white hover:bg-purple-50 text-purple-700 border border-slate-200 rounded font-semibold text-[10px] flex items-center space-x-1"
                      >
                        {copiedField === 'DOB' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'DOB' ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">3. Nationality</span>
                      <span className="font-bold text-slate-800 uppercase">{visa.nationality || 'SRI LANKAN'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(visa.nationality || 'SRI LANKAN', 'Nat1')}
                      className="px-2 py-0.5 bg-white hover:bg-purple-50 text-purple-700 border border-slate-200 rounded font-semibold text-[10px] flex items-center space-x-1"
                    >
                      {copiedField === 'Nat1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'Nat1' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Option 2: Search by Passport Information */}
              <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                  <span className="font-bold text-blue-900 text-[11px] flex items-center space-x-1">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-mono">2</span>
                    <span>Option 2: Search by Passport Info</span>
                  </span>
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">Passport Method</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">1. Passport Number</span>
                      <span className="font-mono font-bold text-slate-800">{visa.passportNo}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(visa.passportNo, 'Passport')}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded font-semibold text-[10px] flex items-center space-x-1"
                    >
                      {copiedField === 'Passport' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'Passport' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">2. Passport Expiry Date</span>
                      <span className="font-mono font-bold text-slate-800">{visa.passportExpiry}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(visa.passportExpiry, 'Expiry')}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded font-semibold text-[10px] flex items-center space-x-1"
                    >
                      {copiedField === 'Expiry' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'Expiry' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">3. Nationality</span>
                      <span className="font-bold text-slate-800 uppercase">{visa.nationality || 'SRI LANKAN'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(visa.nationality || 'SRI LANKAN', 'Nat2')}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded font-semibold text-[10px] flex items-center space-x-1"
                    >
                      {copiedField === 'Nat2' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'Nat2' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ICP Visa File Number Input */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex-1 max-w-sm">
                <span className="text-[10px] text-slate-400 font-bold block">ICP Visa Application / File No.</span>
                <input
                  type="text"
                  value={icpFileNo}
                  onChange={(e) => setIcpFileNo(e.target.value)}
                  placeholder="e.g. 201/2025/1/1234567"
                  className="font-mono font-bold text-slate-800 border-b border-dashed border-slate-300 w-full focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
              {icpFileNo && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(icpFileNo, 'FileNo')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded font-semibold text-[10px] flex items-center space-x-1 ml-2"
                >
                  {copiedField === 'FileNo' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'FileNo' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {/* Attached Documents Preview */}
            {(visa.passportAttachment || visa.visaAttachment) && (
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attached Copies:</span>
                {visa.passportAttachment && (
                  <a
                    href={visa.passportAttachment}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-semibold text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Passport Copy</span>
                  </a>
                )}
                {visa.visaAttachment && (
                  <a
                    href={visa.visaAttachment}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md font-semibold text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>Visa Document Copy</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* AI Automated Sync & Compliance Verification */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h4 className="font-bold text-slate-800">Auto-Sync & Compliance Engine</h4>
              </div>
              <button
                type="button"
                onClick={handleRunAutoSync}
                disabled={isSyncing}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Verifying Status & Expiry...' : 'Run Auto Sync & Verify'}</span>
              </button>
            </div>

            {syncError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{syncError}</span>
              </div>
            )}

            {syncResult && (
              <div className="bg-white border border-purple-200 rounded-lg p-3.5 space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div>
                      <span className="text-slate-500 font-semibold block text-[10px]">Verified Status:</span>
                      <span className="px-2.5 py-0.5 rounded font-bold text-white bg-blue-600 text-xs inline-block">
                        {syncResult.recommendedStatus}
                      </span>
                    </div>

                    {syncResult.calculatedExpiryDate && (
                      <div>
                        <span className="text-slate-500 font-semibold block text-[10px]">Exact Visa Expiry:</span>
                        <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block">
                          {syncResult.calculatedExpiryDate}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Checked: {syncResult.checkedAt}</span>
                  </div>
                </div>

                <div className="text-slate-700 text-xs leading-relaxed space-y-1">
                  <p><strong className="text-slate-900">Compliance Analysis:</strong> {syncResult.notes}</p>
                  <p className="text-[11px] text-slate-500">
                    Days Remaining: <strong className={syncResult.daysRemaining >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                      {syncResult.daysRemaining} days
                    </strong>
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleApplyStatus}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Update Visa Record (Status: "{syncResult.recommendedStatus}" & Expiry: "{syncResult.calculatedExpiryDate || visa.expiryDate || 'N/A'}")</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step by step guide to ICP */}
          <div className="border-t border-slate-200 pt-3 space-y-1.5 text-[11px] text-slate-600">
            <span className="font-bold text-slate-800 block">Instructions for ICP UAE Portal Query:</span>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Click <strong>Open ICP Portal</strong> above to navigate to official website.</li>
              <li>Select <strong>File Validity</strong> &gt; <strong>Passport Information</strong>.</li>
              <li>Select Visa type (Residency/Visa), input Passport Number and Expiry Date.</li>
              <li>Select Nationality and click <strong>Search</strong> to review live immigration status.</li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Status: <strong className="text-slate-800">{visa.status}</strong>
            {visa.lastCheckedAt && ` • Last Checked: ${visa.lastCheckedAt}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

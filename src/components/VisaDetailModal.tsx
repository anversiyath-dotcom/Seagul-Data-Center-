import React, { useState, useRef } from 'react';
import { VisaFollowup, VisaStatus, CompanyProfile, ActivityComment, VisaPaymentStatus } from '../types';
import {
  X, User, Calendar, FileText, Globe, Clock, CheckCircle2,
  AlertCircle, Paperclip, Download, Eye, ExternalLink, Edit3, Trash2,
  Printer, ShieldCheck, Tag, RefreshCw, MessageSquare, ChevronRight,
  Send, Sparkles, Building2, CreditCard, Hash, Copy, Check, DollarSign,
  Wallet, TrendingUp, Coins, Percent, Camera, Upload
} from 'lucide-react';
import { getVisaStatusBadgeClass, computeValidityText } from '../utils/helpers';
import { normalizeToFullDate } from '../utils/imageUrlHelpers';
import { getNationalityFlag } from '../data/nationalities';
import { IcpTrackerModal } from './IcpTrackerModal';
import { VisaRecordingReceiptPrint } from './VisaRecordingReceiptPrint';

interface VisaDetailModalProps {
  visa: VisaFollowup | null;
  onClose: () => void;
  onUpdateVisa: (updated: VisaFollowup) => void;
  onEditVisa?: (visa: VisaFollowup) => void;
  onDeleteVisa?: (id: string) => void;
  onUpdateStatus: (
    id: string,
    newStatus: VisaStatus,
    icpFileNo?: string,
    lastCheckedAt?: string,
    expiryDate?: string,
    entryDate?: string
  ) => void;
  onUpdatePaymentStatus?: (id: string, paymentStatus: VisaPaymentStatus) => void;
  comments?: ActivityComment[];
  onAddComment?: (text: string, author: string) => void;
  companyProfile?: CompanyProfile;
}

export const VisaDetailModal: React.FC<VisaDetailModalProps> = ({
  visa,
  onClose,
  onUpdateVisa,
  onEditVisa,
  onDeleteVisa,
  onUpdateStatus,
  onUpdatePaymentStatus,
  comments = [],
  onAddComment,
  companyProfile
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'comments' | 'summary' | 'receipt'>('overview');
  const [isIcpModalOpen, setIsIcpModalOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('Staff');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; src: string; isPdf?: boolean } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!visa) return null;

  const validity = computeValidityText(visa.expiryDate || visa.passportExpiry);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onUpdateVisa({
        ...visa,
        photoAttachment: base64,
        photoFileName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (confirm('Remove applicant photograph from this visa file?')) {
      onUpdateVisa({
        ...visa,
        photoAttachment: undefined,
        photoFileName: undefined
      });
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !onAddComment) return;
    onAddComment(newCommentText.trim(), commentAuthor);
    setNewCommentText('');
  };

  const relatedComments = comments.filter(
    (c) => c.targetType === 'visa' && c.targetId === visa.id
  );

  const handlePrint = () => {
    window.print();
  };

  const handleOpenPrintWindow = () => {
    const receiptEl = document.getElementById('printable-visa-receipt');
    if (!receiptEl) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=1100');
    if (printWin) {
      const cleanHtml = receiptEl.outerHTML.replace(/\bhidden\b/g, '').replace(/\bprint:block\b/g, '');

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>SEAGULL GLOBAL - Visa Receipt ${visa.passportNo || ''}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                @page { size: A4 portrait; margin: 6mm 8mm 6mm 8mm; }
                html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; }
                .no-print { display: none !important; }
                #printable-visa-receipt { page-break-inside: avoid !important; break-inside: avoid !important; box-shadow: none !important; border: none !important; }
              }
              body { 
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
                background: #f1f5f9; 
                padding: 10px; 
                margin: 0; 
                display: flex; 
                justify-content: center; 
              }
            </style>
          </head>
          <body>
            <div style="width: 100%; max-width: 880px;">
              ${cleanHtml}
            </div>
            <script>
              setTimeout(() => {
                window.print();
              }, 700);
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    } else {
      window.print();
    }
  };

  const purchasing = visa.purchasingPrice || 0;
  const selling = visa.sellingPrice || 0;
  const profit = selling - purchasing;
  const curr = visa.currency || 'AED';
  const marginPct = purchasing > 0 ? ((profit / purchasing) * 100).toFixed(1) : (selling > 0 ? '100' : '0');

  const handlePaymentStatusChange = (newPayStatus: VisaPaymentStatus) => {
    if (onUpdatePaymentStatus) {
      onUpdatePaymentStatus(visa.id, newPayStatus);
    } else {
      onUpdateVisa({ ...visa, paymentStatus: newPayStatus });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 font-bold text-lg">
              {visa.lastName ? visa.lastName.charAt(0).toUpperCase() : 'V'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {`${visa.lastName || ''} ${visa.firstName || ''}`.trim() || 'Visa Record'}
                </h2>
                <span className="bg-blue-500/20 text-blue-300 text-[11px] font-mono px-2 py-0.5 rounded border border-blue-400/30">
                  {visa.passportNo}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{visa.destinationCountry || 'United Arab Emirates (UAE)'}</span>
                <span>•</span>
                <span className="text-blue-300 font-semibold">{visa.visaCategory}</span>
                <span>•</span>
                <span className="text-slate-300">{visa.customer || 'Direct Customer'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onEditVisa && (
              <button
                onClick={() => {
                  onClose();
                  onEditVisa(visa);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer"
                title="Edit Visa Application Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Visa</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status & Quick Action Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-600">Status:</span>
              <select
                value={visa.status}
                onChange={(e) => onUpdateStatus(visa.id, e.target.value as VisaStatus)}
                className={`px-3 py-1 text-xs rounded-lg font-bold shadow-2xs border-none cursor-pointer ${getVisaStatusBadgeClass(visa.status)}`}
              >
                <option value="In Process" className="bg-white text-slate-800 font-normal">⏳ In Process</option>
                <option value="Posted" className="bg-white text-slate-800 font-normal">📩 Posted</option>
                <option value="Documents Required" className="bg-white text-slate-800 font-normal">📄 Documents Required</option>
                <option value="Approved" className="bg-white text-slate-800 font-normal">✅ Approved</option>
                <option value="Extended" className="bg-white text-slate-800 font-normal">🔄 Extended</option>
                <option value="Used" className="bg-white text-slate-800 font-normal">🛬 Used</option>
                <option value="Not Confirmed" className="bg-white text-slate-800 font-normal">❓ Not Confirmed</option>
                <option value="Rejected" className="bg-white text-slate-800 font-normal">❌ Rejected</option>
                <option value="Cancelled" className="bg-white text-slate-800 font-normal">🚫 Cancelled</option>
                <option value="Refund" className="bg-white text-slate-800 font-normal">💰 Refund</option>
                <option value="Closed" className="bg-white text-slate-800 font-normal">🔒 Closed</option>
                <option value="OutPass" className="bg-white text-slate-800 font-normal">🎫 OutPass</option>
              </select>
            </div>

            {/* Payment Status Quick Pill & Toggle */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-600">Payment:</span>
              <select
                value={visa.paymentStatus || 'Pending'}
                onChange={(e) => handlePaymentStatusChange(e.target.value as VisaPaymentStatus)}
                className={`px-2.5 py-1 text-xs rounded-lg font-extrabold border shadow-2xs cursor-pointer ${
                  (visa.paymentStatus || 'Pending') === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : (visa.paymentStatus || 'Pending') === 'Partially Paid'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                <option value="Paid" className="bg-white text-emerald-800 font-bold">✓ Paid</option>
                <option value="Pending" className="bg-white text-amber-800 font-bold">⏳ Pending</option>
                <option value="Partially Paid" className="bg-white text-blue-800 font-bold">💳 Partially Paid</option>
              </select>
            </div>

            {/* Validity alert pill */}
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 ${
              validity.isExpired
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{validity.mainText}{validity.fullDate && validity.fullDate !== 'N/A' ? ` (${validity.fullDate})` : ''}</span>
            </div>

            {/* Country Badge */}
            <div className="bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{visa.destinationCountry || 'United Arab Emirates (UAE)'}</span>
            </div>

            {/* Branch Office Badge & Reassign */}
            <div className="flex items-center space-x-1">
              <select
                value={visa.branch === 'Dubai' ? 'Dubai' : 'Negombo'}
                onChange={(e) => {
                  if (onUpdateVisa) {
                    onUpdateVisa({ ...visa, branch: e.target.value as any });
                  }
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-extrabold border cursor-pointer ${
                  visa.branch === 'Dubai'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
                title="Issuing Branch Office"
              >
                <option value="Dubai">🇦🇪 Dubai Branch</option>
                <option value="Negombo">🇱🇰 Negombo Branch</option>
              </select>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsIcpModalOpen(true)}
              className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ICP Live Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('receipt')}
              className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
              title="View and print customer recording receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Customer Receipt</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Complete Details</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attachments & Scans</span>
            {(visa.passportAttachment || visa.visaAttachment) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'comments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Activity Notes</span>
            {relatedComments.length > 0 && (
              <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {relatedComments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'receipt' || activeTab === 'summary'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>Customer Receipt</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
              Print
            </span>
          </button>
        </div>

        {/* HIDDEN PRINT CONTAINER (ALWAYS RENDERED FOR WINDOW.PRINT) */}
        <div className="hidden print:block">
          <VisaRecordingReceiptPrint 
            visa={visa} 
            companyProfile={companyProfile}
            onUpdateVisa={onUpdateVisa} 
          />
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              
              {/* Section 1: Passenger & Identification Details */}
              <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Passenger & Identification
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Surname / Last Name</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{visa.lastName || '—'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Given / First Names</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{visa.firstName || '—'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Nationality / Citizenship</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 flex items-center space-x-1.5">
                      <span>{getNationalityFlag(visa.nationality)}</span>
                      <span>{visa.nationality || 'SRI LANKAN'}</span>
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Passport Number</span>
                      <button
                        onClick={() => handleCopy(visa.passportNo, 'passport')}
                        className="text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Copy Passport"
                      >
                        {copiedField === 'passport' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-sm font-mono font-extrabold text-blue-900 mt-0.5 block">{visa.passportNo}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Passport Expiry Date</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{normalizeToFullDate(visa.passportExpiry) || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Date of Birth (DOB)</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{normalizeToFullDate(visa.dob) || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Visa Application & Government Tracking */}
              <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Visa Application & Government Tracking Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Processing Visa Country</span>
                    <span className="text-sm font-bold text-blue-900 mt-0.5 block">
                      {visa.destinationCountry || 'United Arab Emirates (UAE)'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {visa.branch === 'Dubai' ? 'Corporate Service / Visa Category' : 'Visa Category / Type'}
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{visa.visaCategory}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Application Status</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{visa.status}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Submission / Issue Date</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{normalizeToFullDate(visa.submissionDate) || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Country Entry Date</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{normalizeToFullDate(visa.entryDate) || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs ring-1 ring-amber-300">
                    <span className="text-[10px] text-amber-700 font-bold uppercase block">Visa Expiry Date (Strict)</span>
                    <span className="text-sm font-extrabold text-amber-900 mt-0.5 block">
                      {normalizeToFullDate(visa.expiryDate || visa.passportExpiry)}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 block mt-0.5">{validity.mainText}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">UAE Unified Number (UID)</span>
                      {visa.unifiedNumber && (
                        <button
                          onClick={() => handleCopy(visa.unifiedNumber || '', 'uid')}
                          className="text-slate-400 hover:text-blue-600 cursor-pointer"
                        >
                          {copiedField === 'uid' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    <span className="text-sm font-mono font-bold text-slate-900 mt-0.5 block">
                      {visa.unifiedNumber || 'Not assigned'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">ICP / Entry Permit File No</span>
                      {visa.icpFileNo && (
                        <button
                          onClick={() => handleCopy(visa.icpFileNo || '', 'icp')}
                          className="text-slate-400 hover:text-blue-600 cursor-pointer"
                        >
                          {copiedField === 'icp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    <span className="text-sm font-mono font-bold text-slate-900 mt-0.5 block">
                      {visa.icpFileNo || 'Not entered'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Last ICP Live Check</span>
                    <span className="text-xs font-semibold text-slate-700 mt-0.5 block">
                      {visa.lastCheckedAt || 'Not verified online yet'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Supplier & Financial Billing Details */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl border border-blue-200/80 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Supplier & Financial Accounting
                    </h3>
                  </div>
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                    (visa.paymentStatus || 'Pending') === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : (visa.paymentStatus || 'Pending') === 'Partially Paid'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    Payment: {visa.paymentStatus || 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Visa Supplier / Provider</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 inline shrink-0" />
                      <span>{visa.supplier || 'Musafir B2B'}</span>
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Purchasing Price (Cost)</span>
                    <span className="text-sm font-mono font-bold text-slate-700 mt-0.5 block">
                      {visa.purchasingPrice !== undefined
                        ? `${curr} ${visa.purchasingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '0.00'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Selling Price (Invoiced)</span>
                    <span className="text-sm font-mono font-extrabold text-blue-900 mt-0.5 block">
                      {visa.sellingPrice !== undefined
                        ? `${curr} ${visa.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '0.00'}
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg border shadow-2xs ${
                    profit >= 0 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50/60 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-600">Net Profit / Margin</span>
                      {purchasing > 0 && selling > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          profit >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                        }`}>
                          {marginPct}%
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-mono font-black mt-0.5 block ${
                      profit >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {curr} {profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Quick Payment Status Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-slate-600 flex items-center space-x-1">
                    <Wallet className="w-3.5 h-3.5 text-blue-600" />
                    <span>Quick Update Payment Status:</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handlePaymentStatusChange('Paid')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                        (visa.paymentStatus || 'Pending') === 'Paid'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-200'
                          : 'bg-white text-slate-700 hover:bg-emerald-50 border-slate-300'
                      }`}
                    >
                      ✓ Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaymentStatusChange('Pending')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                        (visa.paymentStatus || 'Pending') === 'Pending'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
                          : 'bg-white text-slate-700 hover:bg-amber-50 border-slate-300'
                      }`}
                    >
                      ⏳ Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaymentStatusChange('Partially Paid')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                        (visa.paymentStatus || 'Pending') === 'Partially Paid'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-200'
                          : 'bg-white text-slate-700 hover:bg-blue-50 border-slate-300'
                      }`}
                    >
                      💳 Partially Paid
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Agency & Billing Info */}
              <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Agency & Client Relationship
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Client / Agency Name</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{visa.customer || 'Direct Customer'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Classification</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{visa.customerType || 'Agency'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">System ID / Record Created</span>
                    <span className="text-xs font-mono text-slate-600 mt-0.5 block truncate">{visa.id}</span>
                  </div>
                </div>

                {visa.remarks && (
                  <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 text-xs">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Special Notes & Remarks</span>
                    <p className="text-slate-800 font-medium mt-0.5 whitespace-pre-wrap">{visa.remarks}</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* DOCUMENTS & ATTACHMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Applicant Photograph (Passport Size for Visa Receipt) */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-4 h-4 text-purple-600" />
                        <span className="font-extrabold text-xs text-slate-800 uppercase">Applicant Photo (Receipt)</span>
                      </div>
                      {visa.photoAttachment && (
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Uploaded
                        </span>
                      )}
                    </div>

                    {visa.photoAttachment ? (
                      <div className="space-y-3">
                        <div
                          onClick={() => setPreviewDoc({ title: `Applicant Photo - ${visa.lastName} ${visa.firstName}`, src: visa.photoAttachment! })}
                          className="h-56 bg-slate-100 rounded-lg overflow-hidden border border-slate-300 relative group cursor-pointer flex items-center justify-center"
                        >
                          <img
                            src={visa.photoAttachment}
                            alt="Applicant Photograph"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 text-white text-xs font-bold">
                            <Eye className="w-4 h-4" />
                            <span>Click to Expand</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => photoInputRef.current?.click()}
                        className="h-56 bg-white rounded-lg border-2 border-dashed border-purple-200 hover:border-purple-400 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2 cursor-pointer transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
                          <Camera className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">No Photo Uploaded</p>
                        <p className="text-[11px] text-purple-700 font-semibold">Click here to upload applicant photo for official visa recording receipt</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{visa.photoAttachment ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    {visa.photoAttachment && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Passport Attachment */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-extrabold text-xs text-slate-800 uppercase">Passport Copy</span>
                      </div>
                      {visa.passportAttachment && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Attached
                        </span>
                      )}
                    </div>

                    {visa.passportAttachment ? (
                      <div className="space-y-3">
                        {visa.passportAttachment.startsWith('data:image') || visa.passportAttachment.startsWith('http') ? (
                          <div
                            onClick={() => setPreviewDoc({ title: `Passport - ${visa.passportNo}`, src: visa.passportAttachment! })}
                            className="h-56 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 relative group cursor-pointer"
                          >
                            <img
                              src={visa.passportAttachment}
                              alt="Passport Document"
                              className="w-full h-full object-contain bg-slate-900"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 text-white text-xs font-bold">
                              <Eye className="w-4 h-4" />
                              <span>Click to Expand</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-56 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center p-4 text-center space-y-2">
                            <FileText className="w-12 h-12 text-slate-400" />
                            <p className="text-xs font-bold text-slate-700">{visa.passportFileName || 'Passport PDF Document'}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-56 bg-slate-100 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2">
                        <Paperclip className="w-8 h-8 text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">No Passport Document Attached</p>
                        <p className="text-[11px]">Edit application to upload a passport scan or PDF.</p>
                      </div>
                    )}
                  </div>

                  {visa.passportAttachment && (
                    <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
                      <a
                        href={visa.passportAttachment}
                        download={`Passport_${visa.passportNo}.jpg`}
                        className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Passport</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* E-Visa Attachment */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <span className="font-extrabold text-xs text-slate-800 uppercase">E-Visa / Permit Copy</span>
                      </div>
                      {visa.visaAttachment && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Attached
                        </span>
                      )}
                    </div>

                    {visa.visaAttachment ? (
                      <div className="space-y-3">
                        {visa.visaAttachment.startsWith('data:image') || visa.visaAttachment.startsWith('http') ? (
                          <div
                            onClick={() => setPreviewDoc({ title: `E-Visa - ${visa.passportNo}`, src: visa.visaAttachment! })}
                            className="h-56 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 relative group cursor-pointer"
                          >
                            <img
                              src={visa.visaAttachment}
                              alt="E-Visa Document"
                              className="w-full h-full object-contain bg-slate-900"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 text-white text-xs font-bold">
                              <Eye className="w-4 h-4" />
                              <span>Click to Expand</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-56 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center p-4 text-center space-y-2">
                            <FileText className="w-12 h-12 text-slate-400" />
                            <p className="text-xs font-bold text-slate-700">{visa.visaFileName || 'E-Visa PDF Document'}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-56 bg-slate-100 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2">
                        <Paperclip className="w-8 h-8 text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">No E-Visa Document Attached</p>
                        <p className="text-[11px]">Upload the issued visa approval to store here.</p>
                      </div>
                    )}
                  </div>

                  {visa.visaAttachment && (
                    <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
                      <a
                        href={visa.visaAttachment}
                        download={`Visa_${visa.passportNo}.jpg`}
                        className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download E-Visa</span>
                      </a>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* COMMENTS & ACTIVITY TAB */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <form onSubmit={handleAddCommentSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Post New Activity / Internal Note</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type follow-up note, embassy response, or client update..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Activity History</span>
                {relatedComments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    No comments recorded for this visa yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {relatedComments.map((c) => (
                      <div key={c.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">{c.author}</span>
                          <span className="text-slate-400 font-mono">{c.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-700">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CUSTOMER RECORDING RECEIPT TAB (OFFICIAL LETTERHEAD PRINT) */}
          {(activeTab === 'receipt' || activeTab === 'summary') && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Official Customer Recording Receipt:</strong> Formatted on <strong>Seagull Global</strong> letterhead with verified QR code, applicant data, ICP tracking, and customer billing record.
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenPrintWindow}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Print Tab</span>
                  </button>
                </div>
              </div>

              {/* Receipt Visual Preview on Screen */}
              <div className="bg-slate-200 p-3 sm:p-6 rounded-2xl overflow-x-auto shadow-inner flex justify-center">
                <VisaRecordingReceiptPrint 
                  visa={visa} 
                  companyProfile={companyProfile}
                  onUpdateVisa={onUpdateVisa} 
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Passport: <strong className="text-slate-800">{visa.passportNo}</strong> • Validity: <strong className="text-blue-700">{validity.mainText}{validity.fullDate && validity.fullDate !== 'N/A' ? ` (${validity.fullDate})` : ''}</strong>
          </div>

          <div className="flex items-center space-x-2">
            {onEditVisa && (
              <button
                onClick={() => {
                  onClose();
                  onEditVisa(visa);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Record</span>
              </button>
            )}

            {onDeleteVisa && (
              <button
                onClick={() => {
                  onClose();
                  onDeleteVisa(visa.id);
                }}
                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Delete Record
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* ICP Tracker Submodal */}
      {isIcpModalOpen && (
        <IcpTrackerModal
          visa={visa}
          isOpen={isIcpModalOpen}
          onClose={() => setIsIcpModalOpen(false)}
          onUpdateVisaStatus={onUpdateStatus}
        />
      )}

      {/* Expanded Document Viewer */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-bold">{previewDoc.title}</span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex-1 overflow-auto bg-slate-950 flex items-center justify-center">
              <img
                src={previewDoc.src}
                alt="Expanded preview"
                className="max-w-full max-h-[80vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

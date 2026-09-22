import React, { useState } from 'react';
import { GroupApplicantItem } from './BulkPasteVisaModal';
import { Users, Plus, Trash2, ClipboardList, ScanLine, DollarSign, Wallet, Percent, TrendingUp, Check, AlertCircle } from 'lucide-react';
import { parsePassportMRZ } from '../utils/imageUrlHelpers';
import { VisaPaymentStatus } from '../types';

interface GroupVisaApplicantsSectionProps {
  groupApplicants: GroupApplicantItem[];
  onAddApplicant: () => void;
  onRemoveApplicant: (id: string) => void;
  onUpdateApplicant: (id: string, field: keyof GroupApplicantItem, value: string) => void;
  onOpenBulkPaste: () => void;
  defaultNationality: string;

  // Financial props
  pricingMode: 'total' | 'per_pax';
  onChangePricingMode: (mode: 'total' | 'per_pax') => void;
  costPerPax: string;
  onChangeCostPerPax: (val: string) => void;
  sellingPerPax: string;
  onChangeSellingPerPax: (val: string) => void;
  purchasingPrice: string;
  onChangePurchasingPrice: (val: string) => void;
  sellingPrice: string;
  onChangeSellingPrice: (val: string) => void;
  currency: string;
  onChangeCurrency: (cur: string) => void;
  paymentStatus: VisaPaymentStatus;
  onChangePaymentStatus: (status: VisaPaymentStatus) => void;
}

export const GroupVisaApplicantsSection: React.FC<GroupVisaApplicantsSectionProps> = ({
  groupApplicants,
  onAddApplicant,
  onRemoveApplicant,
  onUpdateApplicant,
  onOpenBulkPaste,
  defaultNationality,

  pricingMode,
  onChangePricingMode,
  costPerPax,
  onChangeCostPerPax,
  sellingPerPax,
  onChangeSellingPerPax,
  purchasingPrice,
  onChangePurchasingPrice,
  sellingPrice,
  onChangeSellingPrice,
  currency,
  onChangeCurrency,
  paymentStatus,
  onChangePaymentStatus,
}) => {
  const [activeMrzId, setActiveMrzId] = useState<string | null>(null);
  const [mrzInputText, setMrzInputText] = useState<string>('');

  const paxCount = Math.max(groupApplicants.length, 1);

  // Financial calculations
  const totalCost = pricingMode === 'per_pax'
    ? (parseFloat(costPerPax) || 0) * paxCount
    : (parseFloat(purchasingPrice) || 0);

  const totalSelling = pricingMode === 'per_pax'
    ? (parseFloat(sellingPerPax) || 0) * paxCount
    : (parseFloat(sellingPrice) || 0);

  const effectiveCostPerPax = pricingMode === 'per_pax'
    ? (parseFloat(costPerPax) || 0)
    : (paxCount > 0 ? totalCost / paxCount : 0);

  const effectiveSellingPerPax = pricingMode === 'per_pax'
    ? (parseFloat(sellingPerPax) || 0)
    : (paxCount > 0 ? totalSelling / paxCount : 0);

  const totalProfit = totalSelling - totalCost;
  const marginPct = totalSelling > 0 ? ((totalProfit / totalSelling) * 100).toFixed(1) : '0';
  const profitPerPax = effectiveSellingPerPax - effectiveCostPerPax;

  const handleApplyMrzToApplicant = (applicantId: string) => {
    if (!mrzInputText.trim()) return;
    const parsed = parsePassportMRZ(mrzInputText);
    if (parsed) {
      if (parsed.lastName) onUpdateApplicant(applicantId, 'lastName', parsed.lastName.toUpperCase());
      if (parsed.firstName) onUpdateApplicant(applicantId, 'firstName', parsed.firstName.toUpperCase());
      if (parsed.passportNo) onUpdateApplicant(applicantId, 'passportNo', parsed.passportNo.toUpperCase());
      if (parsed.expiryDate) onUpdateApplicant(applicantId, 'passportExpiry', parsed.expiryDate);
      if (parsed.nationality) onUpdateApplicant(applicantId, 'nationality', parsed.nationality.toUpperCase());
      if (parsed.dateOfBirth) onUpdateApplicant(applicantId, 'dob', parsed.dateOfBirth);
    }
    setActiveMrzId(null);
    setMrzInputText('');
  };

  return (
    <div className="space-y-5">
      {/* 1. Group Pricing & Financial Structure */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-800">
              Group Visa Pricing & Financials ({paxCount} {paxCount === 1 ? 'Pax' : 'Pax'})
            </h4>
          </div>

          {/* Pricing Mode Toggle */}
          <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-300 shadow-2xs">
            <button
              type="button"
              onClick={() => onChangePricingMode('per_pax')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                pricingMode === 'per_pax'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Person (Pax)
            </button>
            <button
              type="button"
              onClick={() => onChangePricingMode('total')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                pricingMode === 'total'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total Group Lump Sum
            </button>
          </div>
        </div>

        {/* Financial Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {pricingMode === 'per_pax' ? (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Cost per Pax ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">{currency}</span>
                  <input
                    type="number"
                    step="any"
                    value={costPerPax}
                    onChange={(e) => onChangeCostPerPax(e.target.value)}
                    placeholder="e.g. 350"
                    className="w-full pl-11 p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Total Cost: <strong className="text-slate-700 font-mono">{currency} {totalCost.toLocaleString()}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Selling per Pax ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">{currency}</span>
                  <input
                    type="number"
                    step="any"
                    value={sellingPerPax}
                    onChange={(e) => onChangeSellingPerPax(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full pl-11 p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-blue-700 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Total Sell: <strong className="text-blue-700 font-mono">{currency} {totalSelling.toLocaleString()}</strong>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Total Group Cost ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">{currency}</span>
                  <input
                    type="number"
                    step="any"
                    value={purchasingPrice}
                    onChange={(e) => onChangePurchasingPrice(e.target.value)}
                    placeholder="e.g. 1050"
                    className="w-full pl-11 p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Per Pax Cost: <strong className="text-slate-700 font-mono">{currency} {effectiveCostPerPax.toFixed(0)}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Total Group Selling ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">{currency}</span>
                  <input
                    type="number"
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => onChangeSellingPrice(e.target.value)}
                    placeholder="e.g. 1350"
                    className="w-full pl-11 p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-blue-700 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Per Pax Sell: <strong className="text-blue-700 font-mono">{currency} {effectiveSellingPerPax.toFixed(0)}</strong>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 cursor-pointer"
            >
              <option value="AED">AED - UAE Dirham</option>
              <option value="LKR">LKR - Sri Lankan Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="QAR">QAR - Qatari Riyal</option>
              <option value="OMR">OMR - Omani Rial</option>
              <option value="MYR">MYR - Malaysian Ringgit</option>
              <option value="IDR">IDR - Indonesian Rupiah</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => onChangePaymentStatus(e.target.value as VisaPaymentStatus)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold cursor-pointer"
            >
              <option value="Pending">🔴 Pending</option>
              <option value="Paid">🟢 Paid</option>
              <option value="Partially Paid">🟡 Partially Paid</option>
            </select>
          </div>
        </div>

        {/* Live Financial Profit Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-slate-700">
              Total Invoiced: <strong className="font-mono text-blue-800">{currency} {totalSelling.toLocaleString()}</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-bold text-slate-700">
              Total Cost: <strong className="font-mono text-slate-800">{currency} {totalCost.toLocaleString()}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-600">Expected Net Profit:</span>
            <span
              className={`font-mono font-extrabold px-2.5 py-0.5 rounded-full ${
                totalProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {currency} {totalProfit.toLocaleString()} ({marginPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Group Applicants Roster List */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-700" />
            <h4 className="font-extrabold text-sm text-slate-900">
              Applicants Roster ({groupApplicants.length} Registered)
            </h4>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenBulkPaste}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <ClipboardList className="w-3.5 h-3.5 text-purple-700" />
              <span>Bulk Paste from Excel / Text</span>
            </button>

            <button
              type="button"
              onClick={onAddApplicant}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Applicant</span>
            </button>
          </div>
        </div>

        {/* Applicant Cards */}
        <div className="space-y-3">
          {groupApplicants.map((app, index) => {
            const isLead = index === 0;
            const isMrzOpen = activeMrzId === app.id;

            return (
              <div
                key={app.id}
                className={`bg-white border rounded-xl p-3.5 transition-all shadow-2xs ${
                  isLead ? 'border-purple-300 ring-1 ring-purple-100' : 'border-slate-200'
                }`}
              >
                {/* Header row of Applicant Card */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] flex items-center space-x-1 ${
                        isLead
                          ? 'bg-purple-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>#{index + 1}</span>
                      <span>{isLead ? 'Lead Applicant' : 'Applicant'}</span>
                    </span>

                    {app.passportNo && (
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {app.passportNo}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isMrzOpen) {
                          setActiveMrzId(null);
                        } else {
                          setActiveMrzId(app.id);
                          setMrzInputText('');
                        }
                      }}
                      className="px-2 py-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded flex items-center space-x-1 cursor-pointer"
                      title="Paste Passport MRZ Code for fast entry"
                    >
                      <ScanLine className="w-3 h-3 text-blue-600" />
                      <span>{isMrzOpen ? 'Close MRZ' : 'Quick MRZ'}</span>
                    </button>

                    {groupApplicants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveApplicant(app.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Remove Applicant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline MRZ Box (Collapsible) */}
                {isMrzOpen && (
                  <div className="mb-3 p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-900 flex items-center space-x-1">
                        <ScanLine className="w-3.5 h-3.5 text-blue-600" />
                        <span>Paste 2-line Passport MRZ (P&lt;LKA...):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyMrzToApplicant(app.id)}
                        disabled={!mrzInputText.trim()}
                        className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-[11px] font-bold rounded cursor-pointer"
                      >
                        Extract Data
                      </button>
                    </div>
                    <textarea
                      value={mrzInputText}
                      onChange={(e) => setMrzInputText(e.target.value)}
                      placeholder="P<LKASURNAME<<GIVEN<NAME<<<<<<<<<<<<<<<<<<&#10;N1234567<8LKA9001015M3005126<<<<<<<<<<<<<<02"
                      rows={2}
                      className="w-full font-mono text-[11px] p-2 bg-white border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Input Fields Grid for Applicant */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">
                      Surname / Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={app.lastName}
                      onChange={(e) => onUpdateApplicant(app.id, 'lastName', e.target.value.toUpperCase())}
                      placeholder="e.g. PERERA"
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg uppercase font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">
                      Given Name / First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={app.firstName}
                      onChange={(e) => onUpdateApplicant(app.id, 'firstName', e.target.value.toUpperCase())}
                      placeholder="e.g. SUNIL"
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg uppercase font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">
                      Passport Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={app.passportNo}
                      onChange={(e) => onUpdateApplicant(app.id, 'passportNo', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="e.g. N1234567"
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg uppercase font-mono font-bold text-blue-700 focus:bg-white focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">
                      Passport Expiry (DD/MM/YYYY)
                    </label>
                    <input
                      type="text"
                      value={app.passportExpiry}
                      onChange={(e) => onUpdateApplicant(app.id, 'passportExpiry', e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:bg-white focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">
                      Nationality
                    </label>
                    <select
                      value={app.nationality || defaultNationality}
                      onChange={(e) => onUpdateApplicant(app.id, 'nationality', e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white cursor-pointer"
                    >
                      <option value="SRI LANKAN">🇱🇰 Sri Lankan</option>
                      <option value="INDIAN">🇮🇳 Indian</option>
                      <option value="PAKISTANI">🇵🇰 Pakistani</option>
                      <option value="BANGLADESHI">🇧🇩 Bangladeshi</option>
                      <option value="FILIPINO">🇵🇭 Filipino</option>
                      <option value="NEPALESE">🇳🇵 Nepalese</option>
                      <option value="INDONESIAN">🇮🇩 Indonesian</option>
                      <option value="MALAYSIAN">🇲🇾 Malaysian</option>
                      <option value="EMIRATI">🇦🇪 Emirati</option>
                      <option value="SAUDI">🇸🇦 Saudi</option>
                    </select>
                  </div>
                </div>

                {/* Optional UID / DOB Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <input
                      type="text"
                      value={app.dob || ''}
                      onChange={(e) => onUpdateApplicant(app.id, 'dob', e.target.value)}
                      placeholder="DOB (DD/MM/YYYY) - Optional"
                      className="w-full p-1.5 bg-slate-50/50 border border-slate-200 rounded text-slate-700 focus:bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={app.unifiedNumber || ''}
                      onChange={(e) => onUpdateApplicant(app.id, 'unifiedNumber', e.target.value)}
                      placeholder="Unified No. (UID) - Optional"
                      className="w-full p-1.5 bg-slate-50/50 border border-slate-200 rounded font-mono text-purple-800 focus:bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={app.icpFileNo || ''}
                      onChange={(e) => onUpdateApplicant(app.id, 'icpFileNo', e.target.value)}
                      placeholder="ICP File No. - Optional"
                      className="w-full p-1.5 bg-slate-50/50 border border-slate-200 rounded font-mono text-slate-700 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

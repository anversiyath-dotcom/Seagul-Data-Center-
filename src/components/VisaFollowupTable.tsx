import React, { useState, useMemo } from 'react';
import { VisaFollowup, VisaStatus, VisaPaymentStatus, VISA_CATEGORIES } from '../types';
import { 
  ArrowUpDown, MessageSquare, Download, Plus, Filter, Edit2, Trash2, CheckCircle, 
  Paperclip, Eye, X, FileText, Sparkles, Building2, Globe, ShieldCheck, Layers, 
  DollarSign, CreditCard, TrendingUp, AlertCircle 
} from 'lucide-react';
import { getVisaStatusBadgeClass, computeValidityText } from '../utils/helpers';
import { IcpTrackerModal } from './IcpTrackerModal';

interface VisaFollowupTableProps {
  visas: VisaFollowup[];
  searchTerm: string;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (status: string) => void;
  selectedCategoryFilter?: string;
  setSelectedCategoryFilter?: (category: string) => void;
  onOpenDetails?: (visa: VisaFollowup) => void;
  onOpenComments: (visa: VisaFollowup) => void;
  onAddNewVisa: () => void;
  onEditVisa: (visa: VisaFollowup) => void;
  onDeleteVisa: (id: string) => void;
  onUpdateStatus: (
    id: string,
    newStatus: VisaStatus,
    icpFileNo?: string,
    lastCheckedAt?: string,
    expiryDate?: string,
    entryDate?: string
  ) => void;
  onUpdatePaymentStatus?: (id: string, paymentStatus: VisaPaymentStatus) => void;
  commentsCountMap: Record<string, number>;
}

type SortField = 
  | 'submissionDate' 
  | 'customer' 
  | 'lastName' 
  | 'firstName' 
  | 'passportNo' 
  | 'passportExpiry' 
  | 'visaCategory' 
  | 'supplier'
  | 'purchasingPrice'
  | 'sellingPrice'
  | 'paymentStatus'
  | 'entryDate' 
  | 'status';

export const VisaFollowupTable: React.FC<VisaFollowupTableProps> = ({
  visas,
  searchTerm,
  selectedStatusFilter,
  setSelectedStatusFilter,
  selectedCategoryFilter: controlledCategoryFilter,
  setSelectedCategoryFilter: setControlledCategoryFilter,
  onOpenDetails,
  onOpenComments,
  onAddNewVisa,
  onEditVisa,
  onDeleteVisa,
  onUpdateStatus,
  onUpdatePaymentStatus,
  commentsCountMap
}) => {
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('ALL');
  const [internalCategoryFilter, setInternalCategoryFilter] = useState<string>('ALL');
  const selectedCategoryFilter = controlledCategoryFilter !== undefined ? controlledCategoryFilter : internalCategoryFilter;
  const setSelectedCategoryFilter = setControlledCategoryFilter || setInternalCategoryFilter;

  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>('ALL');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState<string>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState<'ALL' | 'Agency' | 'Customer'>('ALL');
  const [isGroupedByAgency, setIsGroupedByAgency] = useState<boolean>(false);
  const [showFinancialsBar, setShowFinancialsBar] = useState<boolean>(true);
  const [sortField, setSortField] = useState<SortField>('submissionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeDocTab, setActiveDocTab] = useState<'passport' | 'visa'>('passport');
  const [viewingPassport, setViewingPassport] = useState<VisaFollowup | null>(null);
  const [trackingVisa, setTrackingVisa] = useState<VisaFollowup | null>(null);

  const statusList: (VisaStatus | 'ALL')[] = [
    'ALL',
    'In Process',
    'Posted',
    'Documents Required',
    'Approved',
    'Extended',
    'Used',
    'Not Confirmed',
    'Rejected',
    'Cancelled',
    'Closed',
    'Refund',
    'OutPass'
  ];

  const categoryList = ['ALL', ...VISA_CATEGORIES];

  // Dynamic Agency list with counts
  const agencyList = React.useMemo(() => {
    const counts: Record<string, number> = {};
    visas.forEach((v) => {
      const agencyName = (v.customer || 'Direct Customer').trim();
      counts[agencyName] = (counts[agencyName] || 0) + 1;
    });
    const sortedAgencies = Object.keys(counts).sort().map((name) => ({
      name,
      count: counts[name],
    }));
    return [{ name: 'ALL', count: visas.length }, ...sortedAgencies];
  }, [visas]);

  // Dynamic Supplier list
  const supplierList = React.useMemo(() => {
    const set = new Set<string>();
    visas.forEach((v) => {
      if (v.supplier && v.supplier.trim()) set.add(v.supplier.trim());
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [visas]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter logic
  const filteredVisas = (visas || []).filter((v) => {
    if (!v) return false;
    const matchesSearch =
      searchTerm === '' ||
      `${v.firstName || ''} ${v.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.passportNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.submissionDate || '').includes(searchTerm) ||
      (v.nationality && v.nationality.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.destinationCountry && v.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.unifiedNumber && v.unifiedNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.dob && v.dob.includes(searchTerm)) ||
      (v.icpFileNo && v.icpFileNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.customer && v.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.supplier && v.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.remarks && v.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      selectedStatusFilter === 'ALL' || v.status === selectedStatusFilter;

    const matchesCategory =
      selectedCategoryFilter === 'ALL' ||
      (v.visaCategory || '').toLowerCase() === selectedCategoryFilter.toLowerCase() ||
      (v.visaCategory || '').toLowerCase().includes(selectedCategoryFilter.toLowerCase());

    const matchesCountry =
      selectedCountryFilter === 'ALL' ||
      (v.destinationCountry || 'United Arab Emirates (UAE)').toLowerCase().includes(selectedCountryFilter.toLowerCase());

    const matchesAgency =
      selectedAgencyFilter === 'ALL' ||
      (v.customer || 'Direct Customer').trim().toLowerCase() === selectedAgencyFilter.toLowerCase();

    const matchesSupplier =
      selectedSupplierFilter === 'ALL' ||
      (v.supplier || '').trim().toLowerCase() === selectedSupplierFilter.toLowerCase();

    const matchesPaymentStatus =
      selectedPaymentStatusFilter === 'ALL' ||
      (v.paymentStatus || 'Pending') === selectedPaymentStatusFilter;

    const matchesEntityType =
      entityTypeFilter === 'ALL' ||
      (entityTypeFilter === 'Customer' ? v.customerType === 'Customer' : (v.customerType || 'Agency') === 'Agency');

    return (
      matchesSearch && 
      matchesStatus && 
      matchesCategory && 
      matchesCountry && 
      matchesAgency && 
      matchesSupplier &&
      matchesPaymentStatus &&
      matchesEntityType
    );
  });

  // Sort logic
  const sortedVisas = [...filteredVisas].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    if (sortField === 'purchasingPrice' || sortField === 'sellingPrice') {
      aVal = aVal || 0;
      bVal = bVal || 0;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    aVal = aVal || '';
    bVal = bVal || '';
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Grouping logic when isGroupedByAgency is true
  const groupedVisas = React.useMemo(() => {
    const groups: Record<string, VisaFollowup[]> = {};
    sortedVisas.forEach((v) => {
      const agencyName = (v.customer || 'Direct Customer').trim();
      if (!groups[agencyName]) {
        groups[agencyName] = [];
      }
      groups[agencyName].push(v);
    });
    return groups;
  }, [sortedVisas]);

  // Financial aggregates for visible filtered visas
  const financialTotals = useMemo(() => {
    let totalPurchasing = 0;
    let totalSelling = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;

    filteredVisas.forEach((v) => {
      const pPrice = Number(v.purchasingPrice) || 0;
      const sPrice = Number(v.sellingPrice) || 0;
      totalPurchasing += pPrice;
      totalSelling += sPrice;

      const pStatus = v.paymentStatus || 'Pending';
      if (pStatus === 'Paid') {
        paidAmount += sPrice;
        paidCount += 1;
      } else {
        pendingAmount += sPrice;
        pendingCount += 1;
      }
    });

    const netProfit = totalSelling - totalPurchasing;
    const profitMargin = totalSelling > 0 ? ((netProfit / totalSelling) * 100).toFixed(1) : '0.0';

    return {
      totalPurchasing,
      totalSelling,
      netProfit,
      profitMargin,
      paidAmount,
      pendingAmount,
      paidCount,
      pendingCount
    };
  }, [filteredVisas]);

  const exportCSV = () => {
    const headers = [
      'Submission Date',
      'Customer / Agency',
      'Last Name',
      'First Name',
      'Nationality',
      'Date of Birth',
      'Unified No. (UID)',
      'Passport No.',
      'Passport Expiry',
      'ICP File No.',
      'Visa Country',
      'Visa Category',
      'Supplier',
      'Purchasing Price',
      'Selling Price',
      'Profit Margin',
      'Payment Status',
      'Currency',
      'Entry Date',
      'Validity',
      'Status'
    ];
    const rows = sortedVisas.map((v) => [
      `"${v.submissionDate}"`,
      `"${v.customer || 'N/A'}"`,
      `"${v.lastName}"`,
      `"${v.firstName}"`,
      `"${v.nationality || 'SRI LANKAN'}"`,
      `"${v.dob || 'N/A'}"`,
      `"${v.unifiedNumber || 'N/A'}"`,
      `"${v.passportNo}"`,
      `"${v.passportExpiry}"`,
      `"${v.icpFileNo || 'N/A'}"`,
      `"${v.destinationCountry || 'United Arab Emirates (UAE)'}"`,
      `"${v.visaCategory}"`,
      `"${v.supplier || 'N/A'}"`,
      `"${v.purchasingPrice || 0}"`,
      `"${v.sellingPrice || 0}"`,
      `"${(v.sellingPrice || 0) - (v.purchasingPrice || 0)}"`,
      `"${v.paymentStatus || 'Pending'}"`,
      `"${v.currency || 'AED'}"`,
      `"${v.entryDate}"`,
      `"${computeValidityText(v.expiryDate || v.passportExpiry).mainText}"`,
      `"${v.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Visa_Applications_Financial_Accounting_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Agency / Customer Filter & Separation Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3.5 rounded-xl shadow-md space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100 flex items-center space-x-1.5">
                <span>Agency / Customer Separation</span>
                <span className="bg-blue-500/30 text-blue-300 text-[10px] px-2 py-0.5 rounded font-normal">
                  {agencyList.length - 1} Agencies Active
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Filter or group application records by specific Agency / Travel Partner
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Entity Type Selector */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setEntityTypeFilter('ALL')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                  entityTypeFilter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setEntityTypeFilter('Agency')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                  entityTypeFilter === 'Agency' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏢 Agencies
              </button>
              <button
                type="button"
                onClick={() => setEntityTypeFilter('Customer')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                  entityTypeFilter === 'Customer' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                👤 Customers
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsGroupedByAgency(!isGroupedByAgency)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
                isGroupedByAgency
                  ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isGroupedByAgency ? 'Grouped by Agency (ON)' : 'Group by Agency'}</span>
            </button>
          </div>
        </div>

        {/* Agency Filter Pills / Quick Select */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {agencyList.map((ag) => (
            <button
              key={ag.name}
              type="button"
              onClick={() => setSelectedAgencyFilter(ag.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                selectedAgencyFilter === ag.name
                  ? 'bg-blue-600 text-white shadow-sm font-bold ring-2 ring-blue-400/40'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
              <span>{ag.name === 'ALL' ? 'All Agencies / Customers' : ag.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedAgencyFilter === ag.name ? 'bg-white text-blue-700' : 'bg-slate-700 text-slate-300'
              }`}>
                {ag.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Agency Banner when specific agency selected */}
      {selectedAgencyFilter !== 'ALL' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-blue-900">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <span className="text-xs font-bold block">
                Showing Records for Agency: <span className="text-blue-700 underline">{selectedAgencyFilter}</span>
              </span>
              <span className="text-[10px] text-blue-600">
                Found {filteredVisas.length} visa applications associated with {selectedAgencyFilter}.
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedAgencyFilter('ALL')}
            className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-300 rounded-lg transition-colors cursor-pointer"
          >
            Show All Agencies
          </button>
        </div>
      )}

      {/* Financial Analytics Summary KPI Bar */}
      {showFinancialsBar && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center space-x-1.5">
                  <span>Visa Financial Accounting & Profit Summary</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    ({filteredVisas.length} {filteredVisas.length === 1 ? 'record' : 'records'})
                  </span>
                </h4>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-500">Payment Status:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Paid: {financialTotals.paidCount}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                Pending: {financialTotals.pendingCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Purchasing Total */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Total Purchasing Cost
              </div>
              <div className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">
                AED {financialTotals.totalPurchasing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Selling Total */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5">
              <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                Total Selling / Invoiced
              </div>
              <div className="text-sm font-extrabold text-blue-900 font-mono mt-0.5">
                AED {financialTotals.totalSelling.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Net Profit & Margin */}
            <div className={`rounded-lg p-2.5 border ${
              financialTotals.netProfit >= 0 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Net Gross Profit</span>
                <span className="font-bold font-mono">({financialTotals.profitMargin}%)</span>
              </div>
              <div className="text-sm font-extrabold font-mono mt-0.5">
                {financialTotals.netProfit >= 0 ? '+' : ''}
                AED {financialTotals.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Collected vs Outstanding */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-2.5">
              <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
                Paid Collected / Due
              </div>
              <div className="text-xs font-bold text-purple-900 font-mono mt-0.5 flex items-center justify-between">
                <span className="text-emerald-700">Paid: AED {financialTotals.paidAmount.toLocaleString()}</span>
                <span className="text-amber-700">Due: AED {financialTotals.pendingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Status & Category Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {statusList.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Country, Category, Supplier, Payment & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Supplier Filter */}
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="bg-slate-100 border border-slate-200 text-purple-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
            title="Filter by Visa Supplier"
          >
            <option value="ALL">Supplier: All</option>
            {supplierList.filter(s => s !== 'ALL').map((sup) => (
              <option key={sup} value={sup}>
                {sup}
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={selectedPaymentStatusFilter}
            onChange={(e) => setSelectedPaymentStatusFilter(e.target.value)}
            className="bg-slate-100 border border-slate-200 text-emerald-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            title="Filter by Payment Status"
          >
            <option value="ALL">Payment: All</option>
            <option value="Paid">🟢 Paid</option>
            <option value="Pending">🔴 Pending</option>
            <option value="Partially Paid">🟡 Partially Paid</option>
          </select>

          <select
            value={selectedCountryFilter}
            onChange={(e) => setSelectedCountryFilter(e.target.value)}
            className="bg-slate-100 border border-slate-200 text-blue-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Country: All</option>
            <option value="United Arab Emirates (UAE)">🇦🇪 UAE</option>
            <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
            <option value="Qatar">🇶🇦 Qatar</option>
            <option value="Oman">🇴🇲 Oman</option>
            <option value="Kuwait">🇰🇼 Kuwait</option>
            <option value="Bahrain">🇧🇭 Bahrain</option>
            <option value="Malaysia">🇲🇾 Malaysia</option>
            <option value="Singapore">🇸🇬 Singapore</option>
            <option value="Thailand">🇹🇭 Thailand</option>
            <option value="Turkey">🇹🇷 Turkey</option>
            <option value="Schengen / Europe">🇪🇺 Schengen</option>
            <option value="United Kingdom (UK)">🇬🇧 UK</option>
            <option value="United States (USA)">🇺🇸 USA</option>
          </select>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {categoryList.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            title="Export full visa and financial registry as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <a
            href="https://smartservices.icp.gov.ae/echannels/web/client/default.html#/fileValidity"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
            title="Open Official UAE ICP File Validity Portal"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">ICP Smart Portal</span>
          </a>

          <button
            onClick={onAddNewVisa}
            className="flex items-center space-x-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Visa Application</span>
          </button>
        </div>

      </div>

      {/* Visa Application Table (Matching Images 5, 6, 7 exact blue header & cell typography) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            
            {/* Header matching vivid blue bar from Images 5, 6, 7 */}
            <thead>
              <tr className="bg-[#0088CC] text-white font-extrabold uppercase text-[11px] tracking-wide divide-x divide-white/20">
                
                <th
                  onClick={() => handleSort('submissionDate')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Submission Date</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('customer')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Customer / Agency</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('lastName')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>Last Name</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('firstName')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>First Name</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('passportNo')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-between">
                    <span>Passport No.</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('passportExpiry')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-between">
                    <span>Passport Expiry</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('visaCategory')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-between">
                    <span>Visa Category</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                {/* Supplier Column */}
                <th
                  onClick={() => handleSort('supplier')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Supplier</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                {/* Pricing & Profit Column */}
                <th
                  onClick={() => handleSort('sellingPrice')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Pricing / Margin</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                {/* Payment Status Column */}
                <th
                  onClick={() => handleSort('paymentStatus')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Payment</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('entryDate')}
                  className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-between">
                    <span>Entry Date</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                <th className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center justify-between">
                    <span>Validity</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>

                <th className="py-3 px-3 text-center whitespace-nowrap">
                  <span>Status</span>
                </th>

                <th className="py-3 px-3 text-center whitespace-nowrap">
                  <span>Actions</span>
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {sortedVisas.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    No visa entries found matching filter criteria.
                  </td>
                </tr>
              ) : isGroupedByAgency ? (
                (Object.entries(groupedVisas) as [string, VisaFollowup[]][]).map(([agencyName, agencyVisas]) => (
                  <React.Fragment key={`group-sec-${agencyName}`}>
                    <tr className="bg-slate-100 border-y-2 border-slate-300">
                      <td colSpan={14} className="py-2.5 px-3 bg-slate-100/90">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="font-extrabold text-xs uppercase tracking-wide text-slate-900">{agencyName}</span>
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                              {agencyVisas.length} {agencyVisas.length === 1 ? 'Application' : 'Applications'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-[11px] text-slate-600 font-semibold">
                            <span>Approved: <strong className="text-emerald-700">{agencyVisas.filter(x => x.status === 'Approved').length}</strong></span>
                            <span>Extended: <strong className="text-blue-700">{agencyVisas.filter(x => x.status === 'Extended').length}</strong></span>
                            <span>Pending: <strong className="text-amber-700">{agencyVisas.filter(x => x.status === 'Not Confirmed' || x.status === 'Posted').length}</strong></span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {agencyVisas.map((v) => {
                      const validityInfo = computeValidityText(v.expiryDate || v.passportExpiry);
                      const badgeClass = getVisaStatusBadgeClass(v.status);
                      const commentCount = commentsCountMap[v.id] || 0;
                      const cur = v.currency || 'AED';
                      const pPrice = Number(v.purchasingPrice) || 0;
                      const sPrice = Number(v.sellingPrice) || 0;
                      const netMargin = sPrice - pPrice;

                      return (
                        <tr
                          key={v.id}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          {/* Submission Date */}
                          <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                            {v.submissionDate}
                          </td>

                          {/* Customer / Agency */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200">
                              <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{v.customer || 'Direct Customer'}</span>
                            </div>
                          </td>

                          {/* Last Name */}
                          <td className="py-3 px-3 font-bold text-slate-900 uppercase">
                            {v.lastName}
                          </td>

                          {/* First Name */}
                          <td className="py-3 px-3 font-bold text-slate-900 uppercase">
                            <div>{v.firstName}</div>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px] border border-slate-200 tracking-normal uppercase">
                                <Globe className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                <span>{v.nationality || 'SRI LANKAN'}</span>
                              </div>
                              {v.unifiedNumber && (
                                <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[10px] border border-purple-200 tracking-normal uppercase">
                                  <span className="text-[9px] font-bold text-purple-600">UID:</span>
                                  <span className="font-mono">{v.unifiedNumber}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Passport No. */}
                          <td className="py-3 px-3 font-mono text-slate-800 font-bold uppercase whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <span>{v.passportNo}</span>
                                {v.passportAttachment && (
                                  <button
                                    onClick={() => {
                                      setActiveDocTab('passport');
                                      setViewingPassport(v);
                                    }}
                                    className="px-1.5 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-[10px] font-sans font-semibold flex items-center space-x-1 transition-colors"
                                    title="Click to view attached passport copy"
                                  >
                                    <Paperclip className="w-3 h-3 text-blue-600" />
                                    <span>Passport</span>
                                  </button>
                                )}
                                {v.visaAttachment && (
                                  <button
                                    onClick={() => {
                                      setActiveDocTab('visa');
                                      setViewingPassport(v);
                                    }}
                                    className="px-1.5 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded text-[10px] font-sans font-semibold flex items-center space-x-1 transition-colors"
                                    title="Click to view attached visa copy"
                                  >
                                    <Paperclip className="w-3 h-3 text-purple-600" />
                                    <span>Visa</span>
                                  </button>
                                )}
                              </div>
                              {v.dob && (
                                <div className="text-[10px] font-sans font-normal text-slate-500">
                                  DOB: <span className="font-mono font-bold text-slate-700">{v.dob}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Passport Expiry */}
                          <td className="py-3 px-3 font-mono text-emerald-600 font-bold whitespace-nowrap">
                            {v.passportExpiry}
                          </td>

                          {/* Visa Category & Processing Country */}
                          <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{v.visaCategory}</div>
                            <div className="inline-flex items-center space-x-1 mt-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px] border border-blue-200">
                              <Globe className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                              <span>{v.destinationCountry || 'United Arab Emirates (UAE)'}</span>
                            </div>
                          </td>

                          {/* Supplier Name */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {v.supplier ? (
                              <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-bold text-[11px] border border-purple-200">
                                <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
                                <span className="truncate max-w-[110px]">{v.supplier}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Not Set</span>
                            )}
                          </td>

                          {/* Pricing & Net Profit */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-slate-500 text-[10px]">Cost:</span>
                                <span className="font-bold text-slate-700">{cur} {pPrice.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-slate-500 text-[10px]">Sell:</span>
                                <span className="font-bold text-blue-700">{cur} {sPrice.toLocaleString()}</span>
                              </div>
                              {(sPrice > 0 || pPrice > 0) && (
                                <div className="flex items-center justify-between gap-1 text-[9px] pt-0.5 border-t border-slate-100">
                                  <span className="text-slate-400">Net:</span>
                                  <span className={`font-extrabold ${netMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {netMargin >= 0 ? '+' : ''}{netMargin.toLocaleString()} {cur}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Payment Status Dropdown Selector */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <select
                              value={v.paymentStatus || 'Pending'}
                              onChange={(e) => {
                                const newPStatus = e.target.value as VisaPaymentStatus;
                                if (onUpdatePaymentStatus) {
                                  onUpdatePaymentStatus(v.id, newPStatus);
                                }
                              }}
                              className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md border shadow-2xs cursor-pointer transition-colors ${
                                v.paymentStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                  : v.paymentStatus === 'Partially Paid'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              }`}
                            >
                              <option value="Paid" className="bg-white text-emerald-800 font-bold">Paid</option>
                              <option value="Pending" className="bg-white text-red-700 font-bold">Pending</option>
                              <option value="Partially Paid" className="bg-white text-amber-800 font-bold">Partially Paid</option>
                            </select>
                          </td>

                          {/* Entry Date */}
                          <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                            {v.entryDate}
                          </td>

                          {/* Validity */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {validityInfo.isExpired ? (
                              <div>
                                <span className="text-red-600 font-bold block text-[11px]">
                                  {validityInfo.mainText}
                                </span>
                                <span className="text-slate-400 text-[10px] block font-mono italic">
                                  {validityInfo.subText}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-emerald-700 font-bold block text-[11px]">
                                  {validityInfo.mainText}
                                </span>
                                {validityInfo.subText && (
                                  <span className="text-slate-400 text-[10px] block font-mono">
                                    {validityInfo.subText}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Status Button/Pill */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <select
                              value={v.status}
                              onChange={(e) => onUpdateStatus(v.id, e.target.value as VisaStatus)}
                              className={`px-3 py-1 text-xs rounded-md shadow-xs text-center cursor-pointer font-bold border-none appearance-none ${badgeClass}`}
                            >
                              <option value="In Process" className="bg-white text-slate-800 font-normal">In Process</option>
                              <option value="Posted" className="bg-white text-slate-800 font-normal">Posted</option>
                              <option value="Documents Required" className="bg-white text-slate-800 font-normal">Documents Required</option>
                              <option value="Approved" className="bg-white text-slate-800 font-normal">Approved</option>
                              <option value="Extended" className="bg-white text-slate-800 font-normal">Extended</option>
                              <option value="Used" className="bg-white text-slate-800 font-normal">Used</option>
                              <option value="Not Confirmed" className="bg-white text-slate-800 font-normal">Not Confirmed</option>
                              <option value="Rejected" className="bg-white text-slate-800 font-normal">Rejected</option>
                              <option value="Cancelled" className="bg-white text-slate-800 font-normal">Cancelled</option>
                              <option value="Refund" className="bg-white text-slate-800 font-normal">Refund</option>
                              <option value="Closed" className="bg-white text-slate-800 font-normal">Closed</option>
                              <option value="OutPass" className="bg-white text-slate-800 font-normal">OutPass</option>
                            </select>
                          </td>

                          {/* Action Tools */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              {onOpenDetails && (
                                <button
                                  onClick={() => onOpenDetails(v)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="View complete details & official slip"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => setTrackingVisa(v)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors relative"
                                title="Track live on ICP UAE Smart Services"
                              >
                                <Globe className="w-3.5 h-3.5 text-blue-600" />
                                {v.lastCheckedAt && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                                )}
                              </button>

                              <button
                                onClick={() => onOpenComments(v)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors relative"
                                title="View/Add activity logs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                {commentCount > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                    {commentCount}
                                  </span>
                                )}
                              </button>

                              <button
                                onClick={() => onEditVisa(v)}
                                className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
                                title="Edit visa entry"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onDeleteVisa(v.id)}
                                className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              ) : (
                sortedVisas.map((v) => {
                  const validityInfo = computeValidityText(v.expiryDate || v.passportExpiry);
                  const badgeClass = getVisaStatusBadgeClass(v.status);
                  const commentCount = commentsCountMap[v.id] || 0;
                  const cur = v.currency || 'AED';
                  const pPrice = Number(v.purchasingPrice) || 0;
                  const sPrice = Number(v.sellingPrice) || 0;
                  const netMargin = sPrice - pPrice;

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      {/* Submission Date */}
                      <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                        {v.submissionDate}
                      </td>

                      {/* Customer / Agency */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200">
                          <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{v.customer || 'Direct Customer'}</span>
                        </div>
                      </td>

                      {/* Last Name */}
                      <td className="py-3 px-3 font-bold text-slate-900 uppercase">
                        {v.lastName}
                      </td>

                      {/* First Name */}
                      <td className="py-3 px-3 font-bold text-slate-900 uppercase">
                        <div>{v.firstName}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px] border border-slate-200 tracking-normal uppercase">
                            <Globe className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                            <span>{v.nationality || 'SRI LANKAN'}</span>
                          </div>
                          {v.unifiedNumber && (
                            <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[10px] border border-purple-200 tracking-normal uppercase">
                              <span className="text-[9px] font-bold text-purple-600">UID:</span>
                              <span className="font-mono">{v.unifiedNumber}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Passport No. */}
                      <td className="py-3 px-3 font-mono text-slate-800 font-bold uppercase whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span>{v.passportNo}</span>
                            {v.passportAttachment && (
                              <button
                                onClick={() => {
                                  setActiveDocTab('passport');
                                  setViewingPassport(v);
                                }}
                                className="px-1.5 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-[10px] font-sans font-semibold flex items-center space-x-1 transition-colors"
                                title="Click to view attached passport copy"
                              >
                                <Paperclip className="w-3 h-3 text-blue-600" />
                                <span>Passport</span>
                              </button>
                            )}
                            {v.visaAttachment && (
                              <button
                                onClick={() => {
                                  setActiveDocTab('visa');
                                  setViewingPassport(v);
                                }}
                                className="px-1.5 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded text-[10px] font-sans font-semibold flex items-center space-x-1 transition-colors"
                                title="Click to view attached visa copy"
                              >
                                <Paperclip className="w-3 h-3 text-purple-600" />
                                <span>Visa</span>
                              </button>
                            )}
                          </div>
                          {v.dob && (
                            <div className="text-[10px] font-sans font-normal text-slate-500">
                              DOB: <span className="font-mono font-bold text-slate-700">{v.dob}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Passport Expiry (Green text as shown in images!) */}
                      <td className="py-3 px-3 font-mono text-emerald-600 font-bold whitespace-nowrap">
                        {v.passportExpiry}
                      </td>

                      {/* Visa Category & Processing Country */}
                      <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{v.visaCategory}</div>
                        <div className="inline-flex items-center space-x-1 mt-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px] border border-blue-200">
                          <Globe className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                          <span>{v.destinationCountry || 'United Arab Emirates (UAE)'}</span>
                        </div>
                      </td>

                      {/* Supplier Name */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {v.supplier ? (
                          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-bold text-[11px] border border-purple-200">
                            <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
                            <span className="truncate max-w-[110px]">{v.supplier}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Not Set</span>
                        )}
                      </td>

                      {/* Pricing & Net Profit */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-slate-500 text-[10px]">Cost:</span>
                            <span className="font-bold text-slate-700">{cur} {pPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-slate-500 text-[10px]">Sell:</span>
                            <span className="font-bold text-blue-700">{cur} {sPrice.toLocaleString()}</span>
                          </div>
                          {(sPrice > 0 || pPrice > 0) && (
                            <div className="flex items-center justify-between gap-1 text-[9px] pt-0.5 border-t border-slate-100">
                              <span className="text-slate-400">Net:</span>
                              <span className={`font-extrabold ${netMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {netMargin >= 0 ? '+' : ''}{netMargin.toLocaleString()} {cur}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Payment Status Dropdown Selector */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <select
                          value={v.paymentStatus || 'Pending'}
                          onChange={(e) => {
                            const newPStatus = e.target.value as VisaPaymentStatus;
                            if (onUpdatePaymentStatus) {
                              onUpdatePaymentStatus(v.id, newPStatus);
                            }
                          }}
                          className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md border shadow-2xs cursor-pointer transition-colors ${
                            v.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : v.paymentStatus === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          <option value="Paid" className="bg-white text-emerald-800 font-bold">Paid</option>
                          <option value="Pending" className="bg-white text-red-700 font-bold">Pending</option>
                          <option value="Partially Paid" className="bg-white text-amber-800 font-bold">Partially Paid</option>
                        </select>
                      </td>

                      {/* Entry Date */}
                      <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                        {v.entryDate}
                      </td>

                      {/* Validity (Matching red expired text from screenshots) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {validityInfo.isExpired ? (
                          <div>
                            <span className="text-red-600 font-bold block text-[11px]">
                              {validityInfo.mainText}
                            </span>
                            <span className="text-slate-400 text-[10px] block font-mono italic">
                              {validityInfo.subText}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-emerald-700 font-bold block text-[11px]">
                              {validityInfo.mainText}
                            </span>
                            {validityInfo.subText && (
                              <span className="text-slate-400 text-[10px] block font-mono">
                                {validityInfo.subText}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status Button/Pill (Exact matching image style) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <select
                          value={v.status}
                          onChange={(e) => onUpdateStatus(v.id, e.target.value as VisaStatus)}
                          className={`px-3 py-1 text-xs rounded-md shadow-xs text-center cursor-pointer font-bold border-none appearance-none ${badgeClass}`}
                        >
                          <option value="In Process" className="bg-white text-slate-800 font-normal">In Process</option>
                          <option value="Posted" className="bg-white text-slate-800 font-normal">Posted</option>
                          <option value="Documents Required" className="bg-white text-slate-800 font-normal">Documents Required</option>
                          <option value="Approved" className="bg-white text-slate-800 font-normal">Approved</option>
                          <option value="Extended" className="bg-white text-slate-800 font-normal">Extended</option>
                          <option value="Used" className="bg-white text-slate-800 font-normal">Used</option>
                          <option value="Not Confirmed" className="bg-white text-slate-800 font-normal">Not Confirmed</option>
                          <option value="Rejected" className="bg-white text-slate-800 font-normal">Rejected</option>
                          <option value="Cancelled" className="bg-white text-slate-800 font-normal">Cancelled</option>
                          <option value="Refund" className="bg-white text-slate-800 font-normal">Refund</option>
                          <option value="Closed" className="bg-white text-slate-800 font-normal">Closed</option>
                          <option value="OutPass" className="bg-white text-slate-800 font-normal">OutPass</option>
                        </select>
                      </td>

                      {/* Action Tools */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {onOpenDetails && (
                            <button
                              onClick={() => onOpenDetails(v)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="View complete details & official slip"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setTrackingVisa(v)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors relative"
                            title="Track live on ICP UAE Smart Services"
                          >
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                            {v.lastCheckedAt && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
                            )}
                          </button>

                          {v.passportAttachment && (
                            <button
                              onClick={() => setViewingPassport(v)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="View Passport Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenComments(v)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors relative"
                            title="View / Add Comments"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {commentCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                {commentCount}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => onEditVisa(v)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Visa Application"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteVisa(v.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Footer info bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between font-medium">
          <span>Displaying {sortedVisas.length} of {visas.length} total Visa Applications</span>
          <span>Passport expiration monitoring active</span>
        </div>

      </div>

      {/* Document Preview Modal (Passport / Visa) */}
      {viewingPassport && (viewingPassport.passportAttachment || viewingPassport.visaAttachment) && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0088CC] text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-100" />
                <div>
                  <h3 className="text-sm font-bold uppercase">
                    Document Copy - {viewingPassport.firstName} {viewingPassport.lastName}
                  </h3>
                  <p className="text-[11px] text-blue-100 font-mono">
                    Passport: {viewingPassport.passportNo} {viewingPassport.unifiedNumber ? `| UID: ${viewingPassport.unifiedNumber}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPassport(null)}
                className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switcher if both passport and visa are attached */}
            {viewingPassport.passportAttachment && viewingPassport.visaAttachment && (
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveDocTab('passport')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeDocTab === 'passport'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Passport Copy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDocTab('visa')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeDocTab === 'visa'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Visa Document Copy
                </button>
              </div>
            )}

            {/* Document display */}
            {(() => {
              const currentAttachment = activeDocTab === 'passport' 
                ? (viewingPassport.passportAttachment || viewingPassport.visaAttachment)
                : (viewingPassport.visaAttachment || viewingPassport.passportAttachment);
              const currentFileName = activeDocTab === 'passport'
                ? (viewingPassport.passportFileName || 'Passport_Copy.png')
                : (viewingPassport.visaFileName || 'Visa_Document.png');

              if (!currentAttachment) {
                return (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No document attached for this view.
                  </div>
                );
              }

              return (
                <>
                  <div className="p-4 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center min-h-[300px]">
                    {currentAttachment.startsWith('data:image') ? (
                      <img
                        src={currentAttachment}
                        alt="Attached Document"
                        className="max-w-full max-h-[60vh] object-contain rounded border border-slate-300 shadow-md"
                      />
                    ) : (
                      <div className="text-center p-8 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                        <p className="font-bold text-slate-800 text-sm">PDF Document Attached</p>
                        <p className="text-xs text-slate-500">{currentFileName}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
                    <span className="text-slate-500 font-medium">
                      Customer: <span className="font-bold text-slate-700">{viewingPassport.customer || 'Direct Customer'}</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={currentAttachment}
                        download={currentFileName}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center space-x-1 shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File</span>
                      </a>
                      <button
                        onClick={() => setViewingPassport(null)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ICP UAE Live Tracker Modal */}
      {trackingVisa && (
        <IcpTrackerModal
          visa={trackingVisa}
          isOpen={!!trackingVisa}
          onClose={() => setTrackingVisa(null)}
          onUpdateVisaStatus={(id, newStatus, icpFileNo, lastCheckedAt, expiryDate, entryDate) => {
            onUpdateStatus(id, newStatus, icpFileNo, lastCheckedAt, expiryDate, entryDate);
          }}
        />
      )}

    </div>
  );
};

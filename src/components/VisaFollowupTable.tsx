import React, { useState, useMemo } from 'react';
import { VisaFollowup, VisaStatus, VisaPaymentStatus, VISA_CATEGORIES } from '../types';
import { 
  ArrowUpDown, MessageSquare, Download, Plus, Filter, Edit2, Trash2, CheckCircle, 
  Paperclip, Eye, X, FileText, Sparkles, Building2, Globe, ShieldCheck, Layers, 
  DollarSign, CreditCard, TrendingUp, AlertCircle, LayoutGrid, List, ChevronDown, 
  ChevronUp, Copy, Check, ExternalLink, Clock, User, Calendar, Tag, Shield
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
  // View mode: 'grid' (Comfortable Cards - all data visible at once) vs 'table' (Tabular spreadsheet view)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const toggleRowExpansion = (id: string) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    }

    if (sortField === 'submissionDate' || sortField === 'entryDate') {
      const parseDate = (dStr: string) => {
        if (!dStr) return 0;
        const parts = dStr.split(/[/.-]/);
        if (parts.length === 3) {
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        }
        return new Date(dStr).getTime() || 0;
      };
      const aTime = parseDate(aVal);
      const bTime = parseDate(bVal);
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
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
            {/* View Mode Toggle Button */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer transition-all flex items-center space-x-1.5 ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Comfortable Cards View - All data visible without horizontal scrolling"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Comfort Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer transition-all flex items-center space-x-1.5 ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table View with Sticky Columns & Row Expansion"
              >
                <List className="w-3.5 h-3.5" />
                <span>Smart Table</span>
              </button>
            </div>

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
              <span>{isGroupedByAgency ? 'Grouped (ON)' : 'Group by Agency'}</span>
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
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {statusList.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
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
            className="bg-slate-100 border border-slate-200 text-purple-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
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
            className="bg-slate-100 border border-slate-200 text-emerald-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
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
            className="bg-slate-100 border border-slate-200 text-blue-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
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
            <option value="Indonesia">🇮🇩 Indonesia</option>
            <option value="Thailand">🇹🇭 Thailand</option>
            <option value="Turkey">🇹🇷 Turkey</option>
            <option value="Schengen / Europe">🇪🇺 Schengen</option>
            <option value="United Kingdom (UK)">🇬🇧 UK</option>
            <option value="United States (USA)">🇺🇸 USA</option>
            <option value="Canada">🇨🇦 Canada</option>
            <option value="Australia">🇦🇺 Australia</option>
            <option value="India">🇮🇳 India</option>
            <option value="Sri Lanka">🇱🇰 Sri Lanka</option>
          </select>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {categoryList.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Export full visa and financial registry as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <a
            href="https://smartservices.icp.gov.ae/echannels/web/client/default.html#/fileValidity"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Open Official UAE ICP File Validity Portal"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">ICP Portal</span>
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

      {/* ========================================================================= */}
      {/* 1. COMFORTABLE CARDS & GRID VIEW (ALL DATA VISIBLE, ZERO HORIZONTAL SCROLL) */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {sortedVisas.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No visa application records found matching filter criteria.</p>
              <p className="text-xs text-slate-400 mt-1">Try selecting different status or search terms above.</p>
            </div>
          ) : isGroupedByAgency ? (
            (Object.entries(groupedVisas) as [string, VisaFollowup[]][]).map(([agencyName, agencyVisas]) => (
              <div key={`group-${agencyName}`} className="space-y-3">
                {/* Group Heading */}
                <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="font-extrabold text-sm uppercase tracking-wide text-slate-900">{agencyName}</span>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                      {agencyVisas.length} {agencyVisas.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-600 font-semibold">
                    <span>Approved: <strong className="text-emerald-700">{agencyVisas.filter(x => x.status === 'Approved').length}</strong></span>
                    <span>In Process: <strong className="text-amber-700">{agencyVisas.filter(x => x.status === 'In Process').length}</strong></span>
                    <span>Pending Pay: <strong className="text-red-700">{agencyVisas.filter(x => x.paymentStatus === 'Pending').length}</strong></span>
                  </div>
                </div>

                {/* Cards Grid for Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {agencyVisas.map((v) => renderVisaComfortCard(v))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {sortedVisas.map((v) => renderVisaComfortCard(v))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SMART TABULAR VIEW (STICKY COLUMNS & INLINE ROW EXPANSION)              */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              {/* Header matching vivid blue bar */}
              <thead>
                <tr className="bg-[#0088CC] text-white font-extrabold uppercase text-[11px] tracking-wide divide-x divide-white/20">
                  <th className="py-3 px-2 text-center w-8">
                    <span>#</span>
                  </th>

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
                      <span>Passenger Name</span>
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
                    onClick={() => handleSort('visaCategory')}
                    className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between">
                      <span>Visa Category</span>
                      <ArrowUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('supplier')}
                    className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between space-x-1">
                      <span>Supplier</span>
                      <ArrowUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('sellingPrice')}
                    className="py-3 px-3 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between space-x-1">
                      <span>Pricing / Margin</span>
                      <ArrowUpDown className="w-3 h-3 opacity-80" />
                    </div>
                  </th>

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
                    <td colSpan={13} className="py-12 text-center text-slate-400">
                      No visa entries found matching filter criteria.
                    </td>
                  </tr>
                ) : isGroupedByAgency ? (
                  (Object.entries(groupedVisas) as [string, VisaFollowup[]][]).map(([agencyName, agencyVisas]) => (
                    <React.Fragment key={`group-sec-${agencyName}`}>
                      <tr className="bg-slate-100 border-y-2 border-slate-300">
                        <td colSpan={13} className="py-2.5 px-3 bg-slate-100/90">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-blue-600" />
                              <span className="font-extrabold text-xs uppercase tracking-wide text-slate-900">{agencyName}</span>
                              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                                {agencyVisas.length} Applications
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-[11px] text-slate-600 font-semibold">
                              <span>Approved: <strong className="text-emerald-700">{agencyVisas.filter(x => x.status === 'Approved').length}</strong></span>
                              <span>In Process: <strong className="text-amber-700">{agencyVisas.filter(x => x.status === 'In Process').length}</strong></span>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {agencyVisas.map((v) => renderTableRow(v))}
                    </React.Fragment>
                  ))
                ) : (
                  sortedVisas.map((v) => renderTableRow(v))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document View Modal */}
      {viewingPassport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 space-y-3 relative shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  {activeDocTab === 'passport' ? 'Passport Copy Document' : 'Visa / E-Visa Document'} - {viewingPassport.firstName} {viewingPassport.lastName}
                </h3>
              </div>
              <button
                onClick={() => setViewingPassport(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Tabs */}
            <div className="flex space-x-2 border-b border-slate-100 pb-2">
              {viewingPassport.passportAttachment && (
                <button
                  onClick={() => setActiveDocTab('passport')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    activeDocTab === 'passport' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Passport Document
                </button>
              )}
              {viewingPassport.visaAttachment && (
                <button
                  onClick={() => setActiveDocTab('visa')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    activeDocTab === 'visa' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Visa Document
                </button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-900 rounded-xl p-2">
              {activeDocTab === 'passport' ? (
                viewingPassport.passportAttachment?.startsWith('data:image') ? (
                  <img
                    src={viewingPassport.passportAttachment}
                    alt="Passport Attachment"
                    className="max-h-[65vh] object-contain rounded"
                  />
                ) : (
                  <div className="text-center p-8 text-white space-y-2">
                    <FileText className="w-12 h-12 text-blue-400 mx-auto" />
                    <p className="font-bold text-sm">{viewingPassport.passportFileName || 'Passport_Document.pdf'}</p>
                    <a
                      href={viewingPassport.passportAttachment}
                      download={viewingPassport.passportFileName || 'Passport_Document.pdf'}
                      className="inline-block px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs"
                    >
                      Download File
                    </a>
                  </div>
                )
              ) : (
                viewingPassport.visaAttachment?.startsWith('data:image') ? (
                  <img
                    src={viewingPassport.visaAttachment}
                    alt="Visa Attachment"
                    className="max-h-[65vh] object-contain rounded"
                  />
                ) : (
                  <div className="text-center p-8 text-white space-y-2">
                    <FileText className="w-12 h-12 text-purple-400 mx-auto" />
                    <p className="font-bold text-sm">{viewingPassport.visaFileName || 'Visa_Document.pdf'}</p>
                    <a
                      href={viewingPassport.visaAttachment}
                      download={viewingPassport.visaFileName || 'Visa_Document.pdf'}
                      className="inline-block px-4 py-2 bg-purple-600 text-white font-bold rounded-lg text-xs"
                    >
                      Download File
                    </a>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ICP Tracker Modal */}
      {trackingVisa && (
        <IcpTrackerModal
          visa={trackingVisa}
          isOpen={!!trackingVisa}
          onClose={() => setTrackingVisa(null)}
          onUpdateVisaStatus={onUpdateStatus}
        />
      )}

    </div>
  );

  // ---------------------------------------------------------------------------
  // HELPER: Render Comfortable Card (Zero Horizontal Scroll, Everything Visible)
  // ---------------------------------------------------------------------------
  function renderVisaComfortCard(v: VisaFollowup) {
    const validityInfo = computeValidityText(v.expiryDate || v.passportExpiry);
    const badgeClass = getVisaStatusBadgeClass(v.status);
    const commentCount = commentsCountMap[v.id] || 0;
    const cur = v.currency || 'AED';
    const pPrice = Number(v.purchasingPrice) || 0;
    const sPrice = Number(v.sellingPrice) || 0;
    const netMargin = sPrice - pPrice;
    const isPaid = (v.paymentStatus || 'Pending') === 'Paid';
    const isPartiallyPaid = (v.paymentStatus || 'Pending') === 'Partially Paid';

    return (
      <div 
        key={v.id}
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
      >
        {/* Card Top Banner: Customer / Agency & Live Status Selector */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="p-1 rounded bg-blue-100 text-blue-700 shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <div className="font-extrabold text-xs text-slate-800 truncate" title={v.customer || 'Direct Customer'}>
                {v.customer || 'Direct Customer'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Submitted: <span className="font-mono text-slate-700 font-bold">{v.submissionDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Status Dropdown Selector */}
          <div className="shrink-0">
            <select
              value={v.status}
              onChange={(e) => onUpdateStatus(v.id, e.target.value as VisaStatus)}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold shadow-2xs border-none cursor-pointer ${badgeClass}`}
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
        </div>

        {/* Card Body: Passenger Data, Identifiers, Country & Category */}
        <div className="p-3.5 space-y-3 flex-1">
          {/* Passenger Name & Passport Bar */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <div className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                {v.lastName} {v.firstName}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-flex items-center space-x-1">
                  <span>{v.passportNo}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(v.passportNo, `pass-${v.id}`)}
                    className="hover:text-blue-900 cursor-pointer ml-0.5"
                    title="Copy Passport Number"
                  >
                    {copiedId === `pass-${v.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>
                </span>
                <span className="text-[10px] text-slate-500">Exp: <strong className="font-mono text-emerald-700">{v.passportExpiry || 'N/A'}</strong></span>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                  {v.nationality || 'SRI LANKAN'}
                </span>
              </div>
            </div>

            {/* Country & Category Badge */}
            <div className="text-right shrink-0">
              <span className="inline-block bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                {v.visaCategory}
              </span>
              <div className="text-[10px] font-semibold text-slate-600 mt-1 flex items-center justify-end space-x-1">
                <Globe className="w-3 h-3 text-blue-500" />
                <span>{v.destinationCountry || 'UAE'}</span>
              </div>
            </div>
          </div>

          {/* Extended IDs: UID, DOB, ICP File No */}
          {(v.unifiedNumber || v.icpFileNo || v.dob) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg text-[10px] font-mono border border-slate-200">
              {v.unifiedNumber && (
                <div>
                  <span className="text-slate-400 font-sans block text-[9px]">UID (Unified No.)</span>
                  <span className="font-bold text-purple-700">{v.unifiedNumber}</span>
                </div>
              )}
              {v.icpFileNo && (
                <div>
                  <span className="text-slate-400 font-sans block text-[9px]">ICP File No.</span>
                  <span className="font-bold text-slate-800">{v.icpFileNo}</span>
                </div>
              )}
              {v.dob && (
                <div>
                  <span className="text-slate-400 font-sans block text-[9px]">Date of Birth</span>
                  <span className="font-bold text-slate-700">{v.dob}</span>
                </div>
              )}
            </div>
          )}

          {/* Travel Dates & Validity Timeline */}
          <div className="grid grid-cols-2 gap-2 bg-blue-50/40 p-2.5 rounded-lg border border-blue-100 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block">Entry Date:</span>
              <span className="font-mono font-bold text-slate-800">{v.entryDate || 'Not Entered'}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block">Validity / Expiry:</span>
              <div className="font-bold">
                {validityInfo.isExpired ? (
                  <span className="text-red-600 font-mono">{validityInfo.mainText}</span>
                ) : (
                  <span className="text-emerald-700 font-mono">{validityInfo.mainText}</span>
                )}
              </div>
            </div>
          </div>

          {/* Commercials, Supplier & Payment Status */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <div className="text-[10px] text-slate-500 font-medium">Supplier: <strong className="text-purple-800">{v.supplier || 'Musafir B2B'}</strong></div>
              <div className="font-mono text-[11px] mt-0.5 space-x-2">
                <span className="text-slate-600">Cost: <strong>{cur} {pPrice.toLocaleString()}</strong></span>
                <span className="text-blue-700">Sell: <strong>{cur} {sPrice.toLocaleString()}</strong></span>
                <span className={`font-bold ${netMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  Net: {netMargin >= 0 ? '+' : ''}{netMargin.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Status Switcher Pill */}
            <div>
              <select
                value={v.paymentStatus || 'Pending'}
                onChange={(e) => {
                  const newPStatus = e.target.value as VisaPaymentStatus;
                  if (onUpdatePaymentStatus) onUpdatePaymentStatus(v.id, newPStatus);
                }}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md border shadow-2xs cursor-pointer transition-colors ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : isPartiallyPaid
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                <option value="Paid" className="bg-white text-emerald-800 font-bold">🟢 Paid</option>
                <option value="Pending" className="bg-white text-red-700 font-bold">🔴 Pending</option>
                <option value="Partially Paid" className="bg-white text-amber-800 font-bold">🟡 Partially Paid</option>
              </select>
            </div>
          </div>

          {/* Attached Files & Documents */}
          {(v.passportAttachment || v.visaAttachment) && (
            <div className="flex items-center space-x-2 pt-1">
              {v.passportAttachment && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveDocTab('passport');
                    setViewingPassport(v);
                  }}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Paperclip className="w-3 h-3 text-blue-600" />
                  <span>Passport Copy</span>
                </button>
              )}
              {v.visaAttachment && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveDocTab('visa');
                    setViewingPassport(v);
                  }}
                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Paperclip className="w-3 h-3 text-purple-600" />
                  <span>Visa Document</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Footer: Action Buttons (Edit, Details, Comments, ICP, Delete) */}
        <div className="bg-slate-50 border-t border-slate-200 p-2.5 flex items-center justify-between gap-1.5">
          <div className="flex items-center space-x-1.5">
            {/* Prominent Edit Button */}
            <button
              type="button"
              onClick={() => onEditVisa(v)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer transition-colors"
              title="Edit complete visa application details"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Visa</span>
            </button>

            {onOpenDetails && (
              <button
                type="button"
                onClick={() => onOpenDetails(v)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg shadow-2xs flex items-center space-x-1 cursor-pointer transition-colors"
                title="View full details & official printable slip"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Details</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setTrackingVisa(v)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 bg-white transition-colors cursor-pointer"
              title="Track on UAE ICP Smart Services"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onOpenComments(v)}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 bg-white transition-colors relative cursor-pointer"
              title="View & Add Activity Logs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {commentCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {commentCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onDeleteVisa(v.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 bg-white transition-colors cursor-pointer"
              title="Delete visa record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // HELPER: Render Tabular Row with Inline Details Expansion
  // ---------------------------------------------------------------------------
  function renderTableRow(v: VisaFollowup) {
    const validityInfo = computeValidityText(v.expiryDate || v.passportExpiry);
    const badgeClass = getVisaStatusBadgeClass(v.status);
    const commentCount = commentsCountMap[v.id] || 0;
    const cur = v.currency || 'AED';
    const pPrice = Number(v.purchasingPrice) || 0;
    const sPrice = Number(v.sellingPrice) || 0;
    const netMargin = sPrice - pPrice;
    const isExpanded = expandedRowIds.has(v.id);

    return (
      <React.Fragment key={v.id}>
        <tr className={`hover:bg-blue-50/40 transition-colors group ${isExpanded ? 'bg-blue-50/30' : ''}`}>
          {/* Row expander button */}
          <td className="py-3 px-2 text-center">
            <button
              type="button"
              onClick={() => toggleRowExpansion(v.id)}
              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse row details' : 'Expand all row details'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </td>

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

          {/* Passenger Full Name */}
          <td className="py-3 px-3 font-bold text-slate-900 uppercase">
            <div>{v.lastName} {v.firstName}</div>
            <div className="flex flex-wrap items-center gap-1 mt-0.5 font-normal">
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                {v.nationality || 'SRI LANKAN'}
              </span>
              {v.unifiedNumber && (
                <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200 font-mono font-bold">
                  UID: {v.unifiedNumber}
                </span>
              )}
            </div>
          </td>

          {/* Passport Number */}
          <td className="py-3 px-3 font-mono text-slate-800 font-bold uppercase whitespace-nowrap">
            <div className="flex items-center space-x-1.5">
              <span>{v.passportNo}</span>
              <button
                type="button"
                onClick={() => handleCopyText(v.passportNo, `pass-t-${v.id}`)}
                className="hover:text-blue-900 cursor-pointer"
                title="Copy Passport Number"
              >
                {copiedId === `pass-t-${v.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            </div>
            <div className="text-[10px] text-emerald-600 font-normal">
              Exp: {v.passportExpiry || 'N/A'}
            </div>
          </td>

          {/* Visa Category & Country */}
          <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
            <div className="font-bold text-slate-900">{v.visaCategory}</div>
            <div className="inline-flex items-center space-x-1 mt-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px] border border-blue-200">
              <Globe className="w-2.5 h-2.5 text-blue-600 shrink-0" />
              <span>{v.destinationCountry || 'UAE'}</span>
            </div>
          </td>

          {/* Supplier */}
          <td className="py-3 px-3 whitespace-nowrap">
            <span className="font-bold text-purple-800 text-[11px] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {v.supplier || 'Musafir B2B'}
            </span>
          </td>

          {/* Pricing & Profit Margin */}
          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
            <div className="space-y-0.5">
              <div className="text-slate-500 text-[10px]">Cost: {cur} {pPrice.toLocaleString()}</div>
              <div className="text-blue-700 font-bold">Sell: {cur} {sPrice.toLocaleString()}</div>
              <div className={`font-extrabold text-[10px] ${netMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                Net: {netMargin >= 0 ? '+' : ''}{netMargin.toLocaleString()}
              </div>
            </div>
          </td>

          {/* Payment Status Dropdown Selector */}
          <td className="py-3 px-3 text-center whitespace-nowrap">
            <select
              value={v.paymentStatus || 'Pending'}
              onChange={(e) => {
                const newPStatus = e.target.value as VisaPaymentStatus;
                if (onUpdatePaymentStatus) onUpdatePaymentStatus(v.id, newPStatus);
              }}
              className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md border shadow-2xs cursor-pointer transition-colors ${
                (v.paymentStatus || 'Pending') === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : (v.paymentStatus || 'Pending') === 'Partially Paid'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              <option value="Paid" className="bg-white text-emerald-800 font-bold">Paid</option>
              <option value="Pending" className="bg-white text-red-700 font-bold">Pending</option>
              <option value="Partially Paid" className="bg-white text-amber-800 font-bold">Partially Paid</option>
            </select>
          </td>

          {/* Entry Date */}
          <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
            {v.entryDate || 'N/A'}
          </td>

          {/* Validity */}
          <td className="py-3 px-3 whitespace-nowrap">
            {validityInfo.isExpired ? (
              <span className="text-red-600 font-bold block text-[11px] font-mono">
                {validityInfo.mainText}
              </span>
            ) : (
              <span className="text-emerald-700 font-bold block text-[11px] font-mono">
                {validityInfo.mainText}
              </span>
            )}
          </td>

          {/* Status Dropdown */}
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

          {/* Actions Column */}
          <td className="py-3 px-3 text-center whitespace-nowrap">
            <div className="flex items-center justify-center space-x-1">
              <button
                type="button"
                onClick={() => onEditVisa(v)}
                className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition-colors cursor-pointer font-bold flex items-center space-x-1"
                title="Edit visa application"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="text-[10px]">Edit</span>
              </button>

              {onOpenDetails && (
                <button
                  type="button"
                  onClick={() => onOpenDetails(v)}
                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                  title="View full details & slip"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setTrackingVisa(v)}
                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors relative cursor-pointer"
                title="Track on UAE ICP Smart Portal"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onOpenComments(v)}
                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors relative cursor-pointer"
                title="View/Add Comments"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {commentCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {commentCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onDeleteVisa(v.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                title="Delete Entry"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>

        {/* Expanded Row Detail Drawer */}
        {isExpanded && (
          <tr className="bg-blue-50/50 border-b border-blue-200">
            <td colSpan={13} className="p-4">
              <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      Detailed Application Summary: {v.lastName} {v.firstName}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 font-mono font-bold px-2 py-0.5 rounded">
                      {v.passportNo}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onEditVisa(v)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Application</span>
                    </button>
                    {onOpenDetails && (
                      <button
                        type="button"
                        onClick={() => onOpenDetails(v)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg border border-slate-300 flex items-center space-x-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Print Official Slip</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium block text-[10px]">Unified Number (UID)</span>
                    <span className="font-mono font-bold text-purple-700">{v.unifiedNumber || 'Not Registered'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium block text-[10px]">ICP File Number</span>
                    <span className="font-mono font-bold text-slate-800">{v.icpFileNo || 'Not Assigned'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium block text-[10px]">Date of Birth</span>
                    <span className="font-mono font-bold text-slate-800">{v.dob || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium block text-[10px]">Nationality</span>
                    <span className="font-bold text-slate-800">{v.nationality || 'SRI LANKAN'}</span>
                  </div>
                </div>

                {v.remarks && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900">
                    <span className="font-bold block text-[10px] uppercase text-amber-700">Internal Remarks:</span>
                    <p className="mt-0.5">{v.remarks}</p>
                  </div>
                )}

                {(v.passportAttachment || v.visaAttachment) && (
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-xs font-bold text-slate-600">Attached Documents:</span>
                    {v.passportAttachment && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDocTab('passport');
                          setViewingPassport(v);
                        }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200 text-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>View Passport Attachment</span>
                      </button>
                    )}
                    {v.visaAttachment && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDocTab('visa');
                          setViewingPassport(v);
                        }}
                        className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg border border-purple-200 text-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>View Visa Attachment</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  }
};

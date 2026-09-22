import React, { useState, useMemo } from 'react';
import { 
  TicketFollowup, 
  VisaFollowup, 
  CompanyProfile 
} from '../types';
import { 
  Calculator, DollarSign, TrendingUp, TrendingDown, Calendar, Filter, 
  Search, Download, Printer, ArrowUpRight, CheckCircle2, Clock, 
  Building2, Plane, FileText, Users, ArrowRight, RotateCcw, AlertCircle,
  Briefcase, Percent, ChevronDown, Check, Layers
} from 'lucide-react';
import { 
  DATE_PRESETS, 
  getPresetDateRange, 
  isDateInRange, 
  formatReadableDate, 
  formatDateToYYYYMMDD,
  parseFlexibleDate
} from '../utils/dateUtils';
import {
  isPaidPaymentStatus,
  isPartialPaymentStatus,
  isUnpaidPaymentStatus,
  normalizePaymentStatus,
  getPaymentStatusBadgeClass
} from '../utils/paymentUtils';

interface FinancialAccountingViewProps {
  tickets: TicketFollowup[];
  visas: VisaFollowup[];
  companyProfile?: CompanyProfile;
  onOpenTicketDetails?: (ticket: TicketFollowup) => void;
  onOpenVisaDetails?: (visa: VisaFollowup) => void;
  onNavigateTab?: (tab: 'dashboard' | 'tickets' | 'visas' | 'accounting') => void;
  onUpdateTicketPaymentStatus?: (id: string, paymentStatus: any) => void;
  onUpdateVisaPaymentStatus?: (id: string, paymentStatus: any) => void;
}

export type SectorFilter = 'ALL' | 'TICKETS' | 'VISAS' | 'GROUPS';
export type AccountingTab = 'ledger' | 'pnl' | 'agencies' | 'suppliers';
export type DateBasis = 'booking' | 'service'; // Booking/Submission Date vs Flight/Entry Date

interface UnifiedLedgerItem {
  id: string;
  sourceType: 'ticket' | 'visa';
  date: string;
  dateBasisDisplay: string;
  reference: string; // PNR / Ticket / Passport
  passengerName: string;
  paxCount: number;
  customer: string;
  customerType?: string;
  supplier: string;
  serviceDescription: string;
  costPrice: number;
  sellingPrice: number;
  netProfit: number;
  profitMargin: number;
  paymentStatus: string;
  currency: string;
  isGroup?: boolean;
  groupName?: string;
  rawTicket?: TicketFollowup;
  rawVisa?: VisaFollowup;
}

export const FinancialAccountingView: React.FC<FinancialAccountingViewProps> = ({
  tickets,
  visas,
  companyProfile,
  onOpenTicketDetails,
  onOpenVisaDetails,
  onNavigateTab,
  onUpdateTicketPaymentStatus,
  onUpdateVisaPaymentStatus
}) => {
  // Navigation tabs inside Accounting
  const [activeAccountingTab, setActiveAccountingTab] = useState<AccountingTab>('ledger');

  // Date selection states
  const [selectedPreset, setSelectedPreset] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>(() => {
    return getPresetDateRange('this_month').start;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return getPresetDateRange('this_month').end;
  });
  const [dateBasis, setDateBasis] = useState<DateBasis>('booking');
  const [singleDateInput, setSingleDateInput] = useState<string>('');

  // Additional Filters
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>('ALL');
  const [selectedAgency, setSelectedAgency] = useState<string>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Handle preset clicks
  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    setSingleDateInput('');
    if (presetId === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (presetId === 'custom') {
      // Keep existing custom inputs
    } else {
      const range = getPresetDateRange(presetId);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  // Handle single date pick
  const handleSingleDateSelect = (dateVal: string) => {
    setSingleDateInput(dateVal);
    if (dateVal) {
      setSelectedPreset('custom');
      setStartDate(dateVal);
      setEndDate(dateVal);
    }
  };

  // Reset all date and other filters
  const handleResetFilters = () => {
    setSelectedPreset('all');
    setStartDate('');
    setEndDate('');
    setSingleDateInput('');
    setSectorFilter('ALL');
    setSelectedAgency('ALL');
    setSelectedSupplier('ALL');
    setSelectedPaymentStatus('ALL');
    setSearchTerm('');
  };

  // Unify Tickets and Visas into standard Financial Ledger Items
  const allLedgerItems = useMemo<UnifiedLedgerItem[]>(() => {
    const items: UnifiedLedgerItem[] = [];

    // 1. Process Air Tickets
    tickets.forEach((t) => {
      const selling = t.sellingPrice !== undefined ? t.sellingPrice : (t.totalRefundable || 0);
      const cost = t.costPrice !== undefined ? t.costPrice : 0;
      const profit = t.profit !== undefined ? t.profit : (selling - cost);
      const margin = selling > 0 ? (profit / selling) * 100 : 0;
      const paxCount = t.groupSize || (t.travelers && t.travelers.length > 0 ? t.travelers.length : 1);

      // Date resolution based on basis
      const bookingDateStr = t.requestDate || t.createdAt?.split('T')[0] || '';
      const serviceDateStr = t.flyDate || (t.itinerary && t.itinerary[0]?.dateTime?.split(' ')[0]) || bookingDateStr;
      const effectiveDateStr = dateBasis === 'service' ? serviceDateStr : bookingDateStr;

      const primaryTraveler = t.travelers && t.travelers.length > 0 ? t.travelers[0].name : (t.customer || 'Client');
      const routeStr = t.departureLocation && t.arrivalLocation 
        ? `${t.departureLocation} → ${t.arrivalLocation}` 
        : (t.itinerary && t.itinerary[0]?.route ? t.itinerary[0].route : 'Air Route');

      const desc = t.isGroupBooking 
        ? `Group: ${t.groupName || 'Tour'} • ${routeStr} (${paxCount} Pax)`
        : `${t.airline ? `${t.airline} • ` : ''}${routeStr}${t.flightNo ? ` (${t.flightNo})` : ''}`;

      items.push({
        id: `ticket_${t.id}`,
        sourceType: 'ticket',
        date: effectiveDateStr,
        dateBasisDisplay: dateBasis === 'service' ? `Flight: ${serviceDateStr}` : `Booked: ${bookingDateStr}`,
        reference: t.pnr ? `PNR: ${t.pnr}` : (t.tickets && t.tickets[0] ? t.tickets[0] : 'TKT-PENDING'),
        passengerName: t.isGroupBooking ? `${t.groupName || 'Group'} (${primaryTraveler})` : primaryTraveler,
        paxCount,
        customer: (t.customer || 'Direct Customer').trim(),
        customerType: t.customerType || 'Customer',
        supplier: t.supplier || t.airline || 'GDS / Airline Net',
        serviceDescription: desc,
        costPrice: cost,
        sellingPrice: selling,
        netProfit: profit,
        profitMargin: margin,
        paymentStatus: t.paymentStatus ? (isPaidPaymentStatus(t.paymentStatus) ? 'Paid' : isPartialPaymentStatus(t.paymentStatus) ? 'Partially Paid' : 'Pending') : 'Pending',
        currency: t.currency || 'LKR',
        isGroup: !!t.isGroupBooking,
        groupName: t.groupName,
        rawTicket: t
      });
    });

    // 2. Process Visas
    visas.forEach((v) => {
      const cost = Number(v.purchasingPrice) || 0;
      const selling = Number(v.sellingPrice) || 0;
      const profit = selling - cost;
      const margin = selling > 0 ? (profit / selling) * 100 : 0;

      // Date resolution based on basis
      const submissionDateStr = v.submissionDate || '';
      const entryDateStr = v.entryDate && v.entryDate !== 'N/A' ? v.entryDate : submissionDateStr;
      const effectiveDateStr = dateBasis === 'service' ? entryDateStr : submissionDateStr;

      const fullName = `${v.firstName || ''} ${v.lastName || ''}`.trim() || 'Applicant';
      const desc = `${v.visaCategory || 'Tourist Visa'}${v.destinationCountry ? ` • ${v.destinationCountry}` : ''}`;

      items.push({
        id: `visa_${v.id}`,
        sourceType: 'visa',
        date: effectiveDateStr,
        dateBasisDisplay: dateBasis === 'service' ? `Entry: ${entryDateStr}` : `Submitted: ${submissionDateStr}`,
        reference: v.passportNo ? `PPT: ${v.passportNo}` : 'VISA-APP',
        passengerName: fullName,
        paxCount: 1,
        customer: (v.customer || 'Direct Customer').trim(),
        customerType: v.customerType || 'Customer',
        supplier: v.supplier || 'Visa Partner',
        serviceDescription: desc,
        costPrice: cost,
        sellingPrice: selling,
        netProfit: profit,
        profitMargin: margin,
        paymentStatus: v.paymentStatus ? (isPaidPaymentStatus(v.paymentStatus) ? 'Paid' : isPartialPaymentStatus(v.paymentStatus) ? 'Partially Paid' : 'Pending') : 'Pending',
        currency: v.currency || 'AED',
        rawVisa: v
      });
    });

    // Sort descending by date
    return items.sort((a, b) => {
      const da = parseFlexibleDate(a.date)?.getTime() || 0;
      const db = parseFlexibleDate(b.date)?.getTime() || 0;
      return db - da;
    });
  }, [tickets, visas, dateBasis]);

  // Dynamic Agency list from data
  const agencyOptions = useMemo(() => {
    const set = new Set<string>();
    allLedgerItems.forEach((item) => {
      if (item.customer) set.add(item.customer);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [allLedgerItems]);

  // Dynamic Supplier list from data
  const supplierOptions = useMemo(() => {
    const set = new Set<string>();
    allLedgerItems.forEach((item) => {
      if (item.supplier) set.add(item.supplier);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [allLedgerItems]);

  // Filtered Ledger Items based on Date Range and Filters
  const filteredLedgerItems = useMemo(() => {
    return allLedgerItems.filter((item) => {
      // 1. Date Range Check
      const inRange = isDateInRange(item.date, startDate, endDate);
      if (!inRange) return false;

      // 2. Sector Filter
      if (sectorFilter === 'TICKETS' && item.sourceType !== 'ticket') return false;
      if (sectorFilter === 'VISAS' && item.sourceType !== 'visa') return false;
      if (sectorFilter === 'GROUPS' && !item.isGroup) return false;

      // 3. Agency Filter
      if (selectedAgency !== 'ALL' && item.customer !== selectedAgency) return false;

      // 4. Supplier Filter
      if (selectedSupplier !== 'ALL' && item.supplier !== selectedSupplier) return false;

      // 5. Payment Status Filter
      if (selectedPaymentStatus !== 'ALL') {
        const isPaid = isPaidPaymentStatus(item.paymentStatus);
        const isPartial = isPartialPaymentStatus(item.paymentStatus);
        const isUnpaid = isUnpaidPaymentStatus(item.paymentStatus);

        if (selectedPaymentStatus === 'Paid' && !isPaid) return false;
        if (selectedPaymentStatus === 'Partial' && !isPartial) return false;
        if (selectedPaymentStatus === 'Unpaid' && !isUnpaid) return false;
      }

      // 6. Search Term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matches = 
          item.passengerName.toLowerCase().includes(term) ||
          item.reference.toLowerCase().includes(term) ||
          item.customer.toLowerCase().includes(term) ||
          item.supplier.toLowerCase().includes(term) ||
          item.serviceDescription.toLowerCase().includes(term);
        if (!matches) return false;
      }

      return true;
    });
  }, [allLedgerItems, startDate, endDate, sectorFilter, selectedAgency, selectedSupplier, selectedPaymentStatus, searchTerm]);

  // Aggregate Financial Statistics for Filtered Items
  const financialTotals = useMemo(() => {
    let totalSelling = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let collectedAmount = 0;
    let outstandingAmount = 0;

    let ticketSelling = 0;
    let ticketCost = 0;
    let ticketProfit = 0;
    let ticketPax = 0;

    let groupSelling = 0;
    let groupCost = 0;
    let groupProfit = 0;
    let groupPax = 0;

    let visaSelling = 0;
    let visaCost = 0;
    let visaProfit = 0;
    let visaCount = 0;

    filteredLedgerItems.forEach((item) => {
      totalSelling += item.sellingPrice;
      totalCost += item.costPrice;
      totalProfit += item.netProfit;

      const isPaid = isPaidPaymentStatus(item.paymentStatus);
      const isPartial = isPartialPaymentStatus(item.paymentStatus);

      if (isPaid) {
        collectedAmount += item.sellingPrice;
      } else if (isPartial) {
        collectedAmount += Math.round(item.sellingPrice * 0.5); // estimated partial received
        outstandingAmount += Math.round(item.sellingPrice * 0.5);
      } else {
        outstandingAmount += item.sellingPrice;
      }

      if (item.sourceType === 'ticket') {
        ticketSelling += item.sellingPrice;
        ticketCost += item.costPrice;
        ticketProfit += item.netProfit;
        ticketPax += item.paxCount;

        if (item.isGroup) {
          groupSelling += item.sellingPrice;
          groupCost += item.costPrice;
          groupProfit += item.netProfit;
          groupPax += item.paxCount;
        }
      } else if (item.sourceType === 'visa') {
        visaSelling += item.sellingPrice;
        visaCost += item.costPrice;
        visaProfit += item.netProfit;
        visaCount += 1;
      }
    });

    const profitMargin = totalSelling > 0 ? ((totalProfit / totalSelling) * 100).toFixed(1) : '0.0';
    const collectionRate = totalSelling > 0 ? ((collectedAmount / totalSelling) * 100).toFixed(1) : '0.0';

    return {
      totalSelling,
      totalCost,
      totalProfit,
      profitMargin,
      collectedAmount,
      outstandingAmount,
      collectionRate,
      ticketSelling,
      ticketCost,
      ticketProfit,
      ticketPax,
      groupSelling,
      groupCost,
      groupProfit,
      groupPax,
      visaSelling,
      visaCost,
      visaProfit,
      visaCount,
      itemCount: filteredLedgerItems.length
    };
  }, [filteredLedgerItems]);

  // Agency Profitability Breakdown
  const agencyProfitability = useMemo(() => {
    const map: Record<string, {
      customer: string;
      customerType: string;
      count: number;
      revenue: number;
      cost: number;
      profit: number;
      outstanding: number;
    }> = {};

    filteredLedgerItems.forEach((item) => {
      const key = item.customer || 'Direct Customer';
      if (!map[key]) {
        map[key] = {
          customer: key,
          customerType: item.customerType || 'Customer',
          count: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          outstanding: 0
        };
      }
      map[key].count += 1;
      map[key].revenue += item.sellingPrice;
      map[key].cost += item.costPrice;
      map[key].profit += item.netProfit;

      const isPaid = isPaidPaymentStatus(item.paymentStatus);
      const isPartial = isPartialPaymentStatus(item.paymentStatus);
      if (!isPaid) {
        map[key].outstanding += isPartial ? Math.round(item.sellingPrice * 0.5) : item.sellingPrice;
      }
    });

    return Object.values(map).sort((a, b) => b.profit - a.profit);
  }, [filteredLedgerItems]);

  // Supplier & Airline Volume Breakdown
  const supplierBreakdown = useMemo(() => {
    const map: Record<string, {
      supplier: string;
      count: number;
      totalCost: number;
      totalSelling: number;
      profit: number;
    }> = {};

    filteredLedgerItems.forEach((item) => {
      const key = item.supplier || 'Unassigned Provider';
      if (!map[key]) {
        map[key] = {
          supplier: key,
          count: 0,
          totalCost: 0,
          totalSelling: 0,
          profit: 0
        };
      }
      map[key].count += 1;
      map[key].totalCost += item.costPrice;
      map[key].totalSelling += item.sellingPrice;
      map[key].profit += item.netProfit;
    });

    return Object.values(map).sort((a, b) => b.profit - a.profit);
  }, [filteredLedgerItems]);

  // CSV Export Function
  const handleExportCSV = () => {
    const headers = [
      'Date', 'Date Type', 'Sector', 'Reference', 'Passenger / Group', 'Pax Count', 
      'Agency / Customer', 'Customer Type', 'Supplier / Airline', 'Service Details',
      'Supplier Cost (LKR/AED)', 'Invoiced Selling Price', 'Net Profit', 'Profit Margin %', 'Payment Status'
    ];

    const rows = filteredLedgerItems.map((item) => [
      `"${item.date}"`,
      `"${item.dateBasisDisplay}"`,
      `"${item.sourceType === 'ticket' ? (item.isGroup ? 'Group Ticket' : 'Air Ticket') : 'Visa Service'}"`,
      `"${item.reference}"`,
      `"${item.passengerName.replace(/"/g, '""')}"`,
      `"${item.paxCount}"`,
      `"${item.customer.replace(/"/g, '""')}"`,
      `"${item.customerType || 'Customer'}"`,
      `"${item.supplier.replace(/"/g, '""')}"`,
      `"${item.serviceDescription.replace(/"/g, '""')}"`,
      `"${item.costPrice}"`,
      `"${item.sellingPrice}"`,
      `"${item.netProfit}"`,
      `"${item.profitMargin.toFixed(1)}%"`,
      `"${item.paymentStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_accounting_report_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print View
  const handlePrint = () => {
    window.print();
  };

  // Readable date interval text for banner
  const dateRangeLabel = useMemo(() => {
    if (!startDate && !endDate) return 'All Recorded Dates (All-Time)';
    if (startDate && endDate && startDate === endDate) {
      return `Single Date: ${formatReadableDate(startDate)}`;
    }
    if (startDate && endDate) {
      return `${formatReadableDate(startDate)} → ${formatReadableDate(endDate)}`;
    }
    if (startDate) return `From ${formatReadableDate(startDate)} onwards`;
    if (endDate) return `Up to ${formatReadableDate(endDate)}`;
    return 'Custom Period';
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & FINANCIAL TITLE BAR                                       */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                Financial Accounting & Profit Ledger
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                Real-Time P&L
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive revenue tracking, supplier cost reconciliation, net profit analysis, and date selection
            </p>
          </div>
        </div>

        {/* Action buttons: Export CSV & Print Statement */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Export filtered financial report to CSV"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="Print formal accounting report"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DATE SELECTION CONTROL PANEL (THE CORE REQUIREMENT)                    */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Accounting Period & Date Range
              </span>
              <p className="text-[11px] text-slate-500">
                Filter all financial ledger transactions by exact dates or preset cycles
              </p>
            </div>
          </div>

          {/* Active Period Readout Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-semibold">Active Period:</span>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{dateRangeLabel}</span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {financialTotals.itemCount} Records
              </span>
            </span>

            {(startDate || endDate || selectedPreset !== 'all') && (
              <button
                onClick={() => handlePresetSelect('all')}
                className="text-xs font-medium text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                title="Clear date filter"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Presets Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase mr-1">Presets:</span>
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedPreset === preset.id
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date Input Pickers & Basis Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center justify-between">
              <span>From Date (Start):</span>
              {startDate && <span className="text-[10px] text-blue-600 font-mono">{formatReadableDate(startDate)}</span>}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedPreset('custom');
              }}
              className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center justify-between">
              <span>To Date (End):</span>
              {endDate && <span className="text-[10px] text-blue-600 font-mono">{formatReadableDate(endDate)}</span>}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedPreset('custom');
              }}
              className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Jump to Specific Single Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center justify-between">
              <span>Select Exact Single Day:</span>
              <span className="text-[10px] text-slate-400">1-Day View</span>
            </label>
            <input
              type="date"
              value={singleDateInput}
              onChange={(e) => handleSingleDateSelect(e.target.value)}
              placeholder="Pick a single date"
              className="w-full bg-indigo-50/50 text-slate-900 border border-indigo-200 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date Basis Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center justify-between">
              <span>Filter By Date Field:</span>
            </label>
            <select
              value={dateBasis}
              onChange={(e) => setDateBasis(e.target.value as DateBasis)}
              className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="booking">Transaction / Booking / Issue Date</option>
              <option value="service">Travel Flight Date / Visa Entry Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EXECUTIVE FINANCIAL & PROFIT SUMMARY KPIS                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Gross Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Turnover / Revenue</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
              LKR {financialTotals.totalSelling.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>From {financialTotals.itemCount} Transactions</span>
              <span className="font-semibold text-blue-600">Total Invoiced</span>
            </div>
          </div>
        </div>

        {/* Cost of Sales (COGS) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cost of Sales (COGS)</span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-700 font-mono tracking-tight">
              LKR {financialTotals.totalCost.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Airlines GDS & Visa Suppliers</span>
              <span className="font-semibold text-slate-600">Net Costs</span>
            </div>
          </div>
        </div>

        {/* Net Business Profit & Margin % */}
        <div className={`p-4 rounded-xl border shadow-2xs flex flex-col justify-between ${
          financialTotals.totalProfit >= 0 
            ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-500/20' 
            : 'bg-red-50/80 border-red-300 ring-1 ring-red-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-emerald-900 font-extrabold uppercase tracking-wider">Net Gross Profit</span>
              <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded font-mono">
                {financialTotals.profitMargin}% Margin
              </span>
            </div>
            <div className={`p-2 rounded-lg ${
              financialTotals.totalProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {financialTotals.totalProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl font-black font-mono tracking-tight ${
              financialTotals.totalProfit >= 0 ? 'text-emerald-800' : 'text-red-700'
            }`}>
              {financialTotals.totalProfit >= 0 
                ? `+LKR ${financialTotals.totalProfit.toLocaleString()}` 
                : `LKR ${financialTotals.totalProfit.toLocaleString()}`}
            </div>
            <div className="text-[11px] text-emerald-800/80 mt-0.5 flex items-center justify-between">
              <span>Revenue minus Supplier Cost</span>
              <span className="font-bold">Net Yield</span>
            </div>
          </div>
        </div>

        {/* Collections & Outstanding Receivables */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Collections & Receivables</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Received / Paid:</span>
                <span className="text-sm font-black text-emerald-700 font-mono">
                  LKR {financialTotals.collectedAmount.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Outstanding:</span>
                <span className="text-sm font-black text-amber-700 font-mono">
                  LKR {financialTotals.outstandingAmount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1">
              <span>Collection Progress</span>
              <span className="font-bold text-slate-700 font-mono">{financialTotals.collectionRate}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. SECONDARY FILTERS & NAVIGATION TABS                                     */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Module Sub-Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveAccountingTab('ledger')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeAccountingTab === 'ledger'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transaction Ledger ({filteredLedgerItems.length})
            </button>

            <button
              onClick={() => setActiveAccountingTab('pnl')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeAccountingTab === 'pnl'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profit & Loss Statement (P&L)
            </button>

            <button
              onClick={() => setActiveAccountingTab('agencies')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeAccountingTab === 'agencies'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agency Profitability ({agencyProfitability.length})
            </button>

            <button
              onClick={() => setActiveAccountingTab('suppliers')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeAccountingTab === 'suppliers'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Supplier & Airline Nets
            </button>
          </div>

          {/* Quick Sector Toggle */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Sector:</span>
            {(['ALL', 'TICKETS', 'VISAS', 'GROUPS'] as SectorFilter[]).map((sec) => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  sectorFilter === sec
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {sec === 'ALL' ? 'All' : sec === 'TICKETS' ? 'Air Tickets' : sec === 'VISAS' ? 'Visas' : 'Groups'}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Filters Bar: Search, Agency, Supplier, Payment Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search passenger, PNR, agency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Agency Dropdown */}
          <div>
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Partner Agencies / Clients</option>
              {agencyOptions.filter(a => a !== 'ALL').map((ag) => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
          </div>

          {/* Supplier Dropdown */}
          <div>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Suppliers / Airlines</option>
              {supplierOptions.filter(s => s !== 'ALL').map((sp) => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </div>

          {/* Payment Status Dropdown */}
          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Payment States</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partial">Partial Paid</option>
              <option value="Unpaid">Unpaid / Pending</option>
            </select>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: 1. TRANSACTION LEDGER                                     */}
      {/* ========================================================================= */}
      {activeAccountingTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Financial Ledger Entries for {dateRangeLabel}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Showing {filteredLedgerItems.length} items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-[12%]">Date & Basis</th>
                  <th className="py-3 px-3 w-[18%]">Passenger / Group</th>
                  <th className="py-3 px-3 w-[12%]">Ref / Code</th>
                  <th className="py-3 px-3 w-[15%]">Agency / Client</th>
                  <th className="py-3 px-3 w-[15%]">Supplier / Service</th>
                  <th className="py-3 px-3 text-right w-[9%]">Cost Price</th>
                  <th className="py-3 px-3 text-right w-[9%]">Selling Price</th>
                  <th className="py-3 px-3 text-right w-[10%]">Net Profit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredLedgerItems.length > 0 ? (
                  filteredLedgerItems.map((item) => {
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          if (item.sourceType === 'ticket' && item.rawTicket && onOpenTicketDetails) {
                            onOpenTicketDetails(item.rawTicket);
                          } else if (item.sourceType === 'visa' && item.rawVisa && onOpenVisaDetails) {
                            onOpenVisaDetails(item.rawVisa);
                          }
                        }}
                      >
                        {/* Date */}
                        <td className="py-3 px-3 align-top font-mono">
                          <span className="font-bold text-slate-900 block text-xs">
                            {formatReadableDate(item.date)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-sans">
                            {item.dateBasisDisplay}
                          </span>
                        </td>

                        {/* Passenger / Group */}
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                              item.sourceType === 'ticket' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.sourceType === 'ticket' ? (item.isGroup ? 'Group TKT' : 'Air TKT') : 'Visa'}
                            </span>
                            {item.isGroup && (
                              <span className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                {item.paxCount} Pax
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-900 text-xs mt-0.5 truncate max-w-[200px]" title={item.passengerName}>
                            {item.passengerName}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={item.serviceDescription}>
                            {item.serviceDescription}
                          </div>
                        </td>

                        {/* Reference (PNR / Ticket / Passport) & Payment Status */}
                        <td className="py-3 px-3 align-top font-mono" onClick={(e) => e.stopPropagation()}>
                          <span className="font-bold text-slate-800 text-[11px] block">
                            {item.reference}
                          </span>
                          {(onUpdateTicketPaymentStatus || onUpdateVisaPaymentStatus) ? (
                            <select
                              value={isPaidPaymentStatus(item.paymentStatus) ? 'Paid' : isPartialPaymentStatus(item.paymentStatus) ? 'Partially Paid' : 'Pending'}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                if (item.sourceType === 'ticket' && item.rawTicket && onUpdateTicketPaymentStatus) {
                                  onUpdateTicketPaymentStatus(item.rawTicket.id, newStatus);
                                } else if (item.sourceType === 'visa' && item.rawVisa && onUpdateVisaPaymentStatus) {
                                  onUpdateVisaPaymentStatus(item.rawVisa.id, newStatus);
                                }
                              }}
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase mt-1 border cursor-pointer ${
                                isPaidPaymentStatus(item.paymentStatus)
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : isPartialPaymentStatus(item.paymentStatus)
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-red-50 text-red-800 border-red-300'
                              }`}
                              title="Update Settlement / Payment Status"
                            >
                              <option value="Paid">✓ Paid</option>
                              <option value="Partially Paid">⚡ Partial</option>
                              <option value="Pending">⏳ Pending</option>
                            </select>
                          ) : (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase inline-block mt-0.5 ${
                              isPaidPaymentStatus(item.paymentStatus)
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isPartialPaymentStatus(item.paymentStatus)
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {item.paymentStatus}
                            </span>
                          )}
                        </td>

                        {/* Agency / Customer */}
                        <td className="py-3 px-3 align-top">
                          <span className="font-semibold text-slate-800 block truncate max-w-[150px]">
                            {item.customer}
                          </span>
                          <span className={`text-[8px] font-extrabold px-1 rounded uppercase ${
                            item.customerType === 'Customer' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {item.customerType === 'Customer' ? 'B2C Direct' : 'B2B Agency'}
                          </span>
                        </td>

                        {/* Supplier / Provider */}
                        <td className="py-3 px-3 align-top">
                          <span className="font-medium text-slate-700 block truncate max-w-[150px]">
                            {item.supplier}
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-3 align-top text-right font-mono text-slate-700">
                          {item.currency} {item.costPrice.toLocaleString()}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-3 align-top text-right font-mono font-bold text-slate-900">
                          {item.currency} {item.sellingPrice.toLocaleString()}
                        </td>

                        {/* Net Profit */}
                        <td className="py-3 px-3 align-top text-right font-mono">
                          <span className={`font-black text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                            item.netProfit >= 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.netProfit >= 0 ? `+${item.netProfit.toLocaleString()}` : item.netProfit.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
                            {item.profitMargin.toFixed(1)}% margin
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Calculator className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No transactions match the selected date and filters.</p>
                      <p className="text-xs text-slate-400 mt-1">Try expanding the date range using the presets above or reset filters.</p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Table Footer with Summary Totals */}
              {filteredLedgerItems.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-mono font-bold text-xs">
                    <td colSpan={5} className="py-3 px-4 uppercase font-sans">
                      Period Total Summary ({filteredLedgerItems.length} Transactions)
                    </td>
                    <td className="py-3 px-3 text-right">
                      LKR {financialTotals.totalCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-300 font-black">
                      LKR {financialTotals.totalSelling.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-black text-sm">
                      {financialTotals.totalProfit >= 0 ? `+LKR ${financialTotals.totalProfit.toLocaleString()}` : `LKR ${financialTotals.totalProfit.toLocaleString()}`}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: 2. PROFIT & LOSS (P&L) STATEMENT VIEW                     */}
      {/* ========================================================================= */}
      {activeAccountingTab === 'pnl' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Statement of Profit & Loss (Income Statement)
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Period: {dateRangeLabel} • Prepared for {companyProfile?.companyName || 'Travel Agency Management'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Profit Margin</span>
              <span className="text-xl font-black text-emerald-600 font-mono">
                {financialTotals.profitMargin}%
              </span>
            </div>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* 1. Operating Revenue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-blue-50/80 px-4 py-2.5 rounded-xl border border-blue-200">
                <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
                  1. Operating Gross Revenue
                </span>
                <span className="text-sm font-black font-mono text-blue-900">
                  LKR {financialTotals.totalSelling.toLocaleString()}
                </span>
              </div>

              <div className="pl-4 pr-2 space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-blue-500" />
                    <span>Air Ticket Reissue & Issuance Revenue ({financialTotals.ticketPax} Pax)</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    LKR {financialTotals.ticketSelling.toLocaleString()}
                  </span>
                </div>

                {financialTotals.groupSelling > 0 && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 pl-4 text-slate-500">
                    <span>↳ Of which: Group Bookings ({financialTotals.groupPax} Pax)</span>
                    <span className="font-mono font-semibold text-slate-700">
                      LKR {financialTotals.groupSelling.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Visa Processing Services Revenue ({financialTotals.visaCount} Visas)</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    LKR {financialTotals.visaSelling.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Direct Operating Cost of Sales (COGS) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  2. Cost of Sales (Supplier & GDS Outflows)
                </span>
                <span className="text-sm font-black font-mono text-slate-800">
                  (LKR {financialTotals.totalCost.toLocaleString()})
                </span>
              </div>

              <div className="pl-4 pr-2 space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Airline GDS & Fare Net Costs</span>
                  <span className="font-mono font-bold text-slate-700">
                    LKR {financialTotals.ticketCost.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Visa Supplier & Partner Issuing Fees</span>
                  <span className="font-mono font-bold text-slate-700">
                    LKR {financialTotals.visaCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Gross Operating Profit */}
            <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wider block">
                  3. Net Operating Profit for Selected Period
                </span>
                <span className="text-[11px] text-emerald-700">
                  Gross Revenue minus Direct Operating Supplier Costs
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black font-mono text-emerald-800 block">
                  {financialTotals.totalProfit >= 0 
                    ? `+LKR ${financialTotals.totalProfit.toLocaleString()}` 
                    : `LKR ${financialTotals.totalProfit.toLocaleString()}`}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 font-mono">
                  {financialTotals.profitMargin}% Net Margin
                </span>
              </div>
            </div>

            {/* Sector Contribution Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-blue-600" />
                    <span>Air Ticketing Contribution</span>
                  </span>
                  <span className="text-xs font-mono font-extrabold text-blue-700">
                    +LKR {financialTotals.ticketProfit.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Revenue: LKR {financialTotals.ticketSelling.toLocaleString()}</span>
                  <span>Cost: LKR {financialTotals.ticketCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Visa Services Contribution</span>
                  </span>
                  <span className="text-xs font-mono font-extrabold text-emerald-700">
                    +LKR {financialTotals.visaProfit.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Revenue: LKR {financialTotals.visaSelling.toLocaleString()}</span>
                  <span>Cost: LKR {financialTotals.visaCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: 3. AGENCY & CLIENT PROFITABILITY LEADERBOARD              */}
      {/* ========================================================================= */}
      {activeAccountingTab === 'agencies' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Agency & Client Profitability Ranking
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Sorted by Net Profit Contribution
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-[25%]">Agency / Client Name</th>
                  <th className="py-3 px-3 text-center w-[12%]">Volume</th>
                  <th className="py-3 px-3 text-right w-[15%]">Total Revenue</th>
                  <th className="py-3 px-3 text-right w-[15%]">Supplier Cost</th>
                  <th className="py-3 px-3 text-right w-[18%]">Net Profit Earned</th>
                  <th className="py-3 px-4 text-right w-[15%]">Outstanding</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {agencyProfitability.map((item, idx) => {
                  const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={item.customer} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono text-slate-400 font-bold w-4">
                            #{idx + 1}
                          </span>
                          <span className="truncate max-w-[200px]" title={item.customer}>
                            {item.customer}
                          </span>
                          <span className={`text-[8px] px-1 rounded uppercase font-bold ${
                            item.customerType === 'Customer' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.customerType === 'Customer' ? 'B2C' : 'B2B'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                        {item.count} Items
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        LKR {item.revenue.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        LKR {item.cost.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +LKR {item.profit.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
                          {margin}% margin
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        {item.outstanding > 0 ? (
                          <span className="text-amber-700 font-bold">
                            LKR {item.outstanding.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-[11px]">
                            Cleared
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: 4. SUPPLIER & AIRLINE ANALYSIS                            */}
      {/* ========================================================================= */}
      {activeAccountingTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Supplier & Airline Net Outflow Summary
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Purchasing costs and agency commissions by partner
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-[30%]">Supplier / Airline Partner</th>
                  <th className="py-3 px-3 text-center w-[15%]">Bookings</th>
                  <th className="py-3 px-3 text-right w-[20%]">Supplier Net Cost</th>
                  <th className="py-3 px-3 text-right w-[20%]">Total Invoiced</th>
                  <th className="py-3 px-4 text-right w-[15%]">Agency Profit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {supplierBreakdown.map((item) => (
                  <tr key={item.supplier} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.supplier}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {item.count} Bookings
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                      LKR {item.totalCost.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      LKR {item.totalSelling.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                      +LKR {item.profit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

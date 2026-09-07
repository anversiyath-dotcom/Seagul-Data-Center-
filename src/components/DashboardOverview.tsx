import React, { useState } from 'react';
import { TicketFollowup, VisaFollowup, VisaStatus, VISA_CATEGORIES } from '../types';
import { 
  TrendingUp, Layers, CalendarX, UserCheck, AlertTriangle, ArrowUpRight, CheckCircle2, 
  Clock, Building2, AlertCircle, Plane, Calendar, Copy, Check, ShieldAlert, Eye, 
  ExternalLink, Sparkles, User, Tag, Calculator, DollarSign, Briefcase
} from 'lucide-react';
import { VisaExpirationsChart } from './VisaExpirationsChart';

interface DashboardOverviewProps {
  tickets: TicketFollowup[];
  visas: VisaFollowup[];
  onSelectVisaStatusFilter: (status: VisaStatus) => void;
  onSelectTicketStatusFilter: (status: string) => void;
  onSelectVisaCategoryFilter?: (category: string) => void;
  onNavigateTab: (tab: 'tickets' | 'visas' | 'accounting') => void;
  onOpenTicketDetails?: (ticket: TicketFollowup) => void;
  onOpenVisaDetails?: (visa: VisaFollowup) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tickets,
  visas,
  onSelectVisaStatusFilter,
  onSelectTicketStatusFilter,
  onSelectVisaCategoryFilter,
  onNavigateTab,
  onOpenTicketDetails,
  onOpenVisaDetails
}) => {
  const [selectedExpiringDateFilter, setSelectedExpiringDateFilter] = useState<string>('ALL');
  const [copiedPassportId, setCopiedPassportId] = useState<string | null>(null);

  const handleCopyPassport = (e: React.MouseEvent, passportNo: string, id: string) => {
    e.stopPropagation();
    if (!passportNo) return;
    navigator.clipboard?.writeText(passportNo);
    setCopiedPassportId(id);
    setTimeout(() => setCopiedPassportId(null), 2000);
  };

  // Helper to parse flyDate
  const parseFlyDate = (dateStr?: string): Date | null => {
    if (!dateStr || dateStr === 'N/A' || dateStr === 'Pending') return null;
    const clean = dateStr.trim();
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m, d);
      }
    } else if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m, d);
        } else {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m, d);
        }
      }
    }
    return null;
  };

  // Calculate upcoming / recent flight departures in the next 5 days
  const upcoming5DaysDepartureTickets = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tickets
      .map((t) => {
        const flyDateStr = t.flyDate || (t.itinerary && t.itinerary[0]?.dateTime?.split(' ')[0]);
        const depDate = parseFlyDate(flyDateStr);
        if (!depDate) return null;

        const diffTime = depDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { ticket: t, daysLeft, depDate };
      })
      .filter((item): item is { ticket: TicketFollowup; daysLeft: number; depDate: Date } => {
        return item !== null && item.daysLeft >= -1 && item.daysLeft <= 5; // Within 5 days
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [tickets]);

  // Calculate visas expiring in the next 15 days (or overdue)
  // CRITICAL RULE: For UAE visas, "Approved" visas are unentered entry permits and should NOT show on the dashboard.
  // ONLY status "Used" (or "Extended") visas are inside UAE and mandatory to track for overstay/expiration.
  const expiring15DaysVisas = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return visas
      .map((v) => {
        if (!v.expiryDate || v.expiryDate === 'N/A') return null;

        const dest = (v.destinationCountry || 'United Arab Emirates (UAE)').toLowerCase();
        const isUae =
          dest.includes('uae') ||
          dest.includes('emirates') ||
          dest.includes('dubai') ||
          dest.includes('abu dhabi') ||
          dest.includes('sharjah') ||
          dest.trim() === '';

        // UAE Rule: If destination is UAE, exclude 'Approved' and other non-entered statuses.
        // ONLY 'Used' (and 'Extended') visas are inside UAE and mandatory for overstay follow-up.
        if (isUae) {
          if (v.status !== 'Used' && v.status !== 'Extended') {
            return null;
          }
        } else {
          // For non-UAE destinations, exclude cancelled, refunded, rejected, or closed
          if (v.status === 'Cancelled' || v.status === 'Refund' || v.status === 'Rejected' || v.status === 'Closed') {
            return null;
          }
        }

        let expDate: Date | null = null;
        if (v.expiryDate.includes('/')) {
          const parts = v.expiryDate.split('/');
          if (parts.length === 3) {
            expDate = new Date(
              parseInt(parts[2], 10),
              parseInt(parts[1], 10) - 1,
              parseInt(parts[0], 10)
            );
          }
        } else if (v.expiryDate.includes('-')) {
          const parts = v.expiryDate.split('-');
          if (parts.length === 3) {
            expDate = new Date(
              parseInt(parts[0], 10),
              parseInt(parts[1], 10) - 1,
              parseInt(parts[2], 10)
            );
          }
        }

        if (!expDate || isNaN(expDate.getTime())) return null;

        const diffTime = expDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { visa: v, daysLeft, expDate };
      })
      .filter((item): item is { visa: VisaFollowup; daysLeft: number; expDate: Date } => {
        return item !== null && item.daysLeft <= 15; // Within 15 days or overdue
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [visas]);

  // Breakdown of urgency counts for expiring visas
  const urgencyCounts = React.useMemo(() => {
    let overdue = 0;
    let today = 0;
    let in1to3 = 0;
    let in4to7 = 0;
    let in8to15 = 0;

    expiring15DaysVisas.forEach(({ daysLeft }) => {
      if (daysLeft < 0) overdue++;
      else if (daysLeft === 0) today++;
      else if (daysLeft <= 3) in1to3++;
      else if (daysLeft <= 7) in4to7++;
      else in8to15++;
    });

    return { overdue, today, in1to3, in4to7, in8to15 };
  }, [expiring15DaysVisas]);

  // Group expiring visas by specific expiration date
  const expiringDateGroups = React.useMemo(() => {
    const map: Record<string, { dateStr: string; daysLeft: number; count: number; visas: VisaFollowup[] }> = {};
    expiring15DaysVisas.forEach(({ visa, daysLeft }) => {
      const dateStr = visa.expiryDate || visa.passportExpiry || 'N/A';
      if (!map[dateStr]) {
        map[dateStr] = { dateStr, daysLeft, count: 0, visas: [] };
      }
      map[dateStr].count += 1;
      map[dateStr].visas.push(visa);
    });
    return Object.values(map).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [expiring15DaysVisas]);

  // Filtered expiring visas based on selected date chip
  const displayedExpiringVisas = React.useMemo(() => {
    if (selectedExpiringDateFilter === 'ALL') {
      return expiring15DaysVisas;
    }
    return expiring15DaysVisas.filter(
      (item) => (item.visa.expiryDate || item.visa.passportExpiry) === selectedExpiringDateFilter
    );
  }, [expiring15DaysVisas, selectedExpiringDateFilter]);

  // Group expiring visas by customer / agency
  const expiringByCustomer = React.useMemo(() => {
    const map: Record<string, { count: number; minDays: number }> = {};
    expiring15DaysVisas.forEach(({ visa, daysLeft }) => {
      const customer = (visa.customer || 'Direct Customer').trim();
      if (!map[customer]) {
        map[customer] = { count: 0, minDays: daysLeft };
      }
      map[customer].count += 1;
      if (daysLeft < map[customer].minDays) {
        map[customer].minDays = daysLeft;
      }
    });
    return Object.entries(map).map(([customer, data]) => ({
      customer,
      ...data
    })).sort((a, b) => a.minDays - b.minDays);
  }, [expiring15DaysVisas]);

  // Agency / Customer Data breakdown
  const agencyStatsList = React.useMemo(() => {
    const map: Record<string, { totalVisas: number; approved: number; extended: number; pending: number; totalTickets: number }> = {};

    visas.forEach((v) => {
      const name = (v.customer || 'Direct Customer').trim();
      if (!map[name]) {
        map[name] = { totalVisas: 0, approved: 0, extended: 0, pending: 0, totalTickets: 0 };
      }
      map[name].totalVisas += 1;
      if (v.status === 'Approved') map[name].approved += 1;
      if (v.status === 'Extended') map[name].extended += 1;
      if (v.status === 'Not Confirmed' || v.status === 'Posted') map[name].pending += 1;
    });

    tickets.forEach((t) => {
      const name = (t.customer || 'Direct Customer').trim();
      if (!map[name]) {
        map[name] = { totalVisas: 0, approved: 0, extended: 0, pending: 0, totalTickets: 0 };
      }
      map[name].totalTickets += 1;
    });

    return Object.entries(map).map(([agency, stats]) => ({
      agency,
      ...stats
    })).sort((a, b) => (b.totalVisas + b.totalTickets) - (a.totalVisas + a.totalTickets));
  }, [visas, tickets]);

  // Count statuses matching Image 8
  const getVisaStatusCount = (status: VisaStatus) => {
    return visas.filter(v => v.status === status).length;
  };

  // Count true live status totals
  const statusItems: { label: VisaStatus; count: number; colorClass: string }[] = [
    { label: 'In Process', count: getVisaStatusCount('In Process'), colorClass: 'bg-[#F39C12]' },
    { label: 'Posted', count: getVisaStatusCount('Posted'), colorClass: 'bg-[#42A5F5]' },
    { label: 'Documents Required', count: getVisaStatusCount('Documents Required'), colorClass: 'bg-[#8E44AD]' },
    { label: 'Approved', count: getVisaStatusCount('Approved'), colorClass: 'bg-[#2ECC71]' },
    { label: 'Rejected', count: getVisaStatusCount('Rejected'), colorClass: 'bg-[#E74C3C]' },
    { label: 'Cancelled', count: getVisaStatusCount('Cancelled'), colorClass: 'bg-[#7F8C8D]' },
    { label: 'Refund', count: getVisaStatusCount('Refund'), colorClass: 'bg-[#9B59B6]' },
    { label: 'Used', count: getVisaStatusCount('Used'), colorClass: 'bg-[#16A085]' },
    { label: 'Extended', count: getVisaStatusCount('Extended'), colorClass: 'bg-[#3498DB]' },
    { label: 'Closed', count: getVisaStatusCount('Closed'), colorClass: 'bg-[#2C3E50]' },
    { label: 'OutPass', count: getVisaStatusCount('OutPass'), colorClass: 'bg-[#5D6D7E]' },
    { label: 'Not Confirmed', count: getVisaStatusCount('Not Confirmed'), colorClass: 'bg-[#95A5A6]' }
  ];

  // Category counts based strictly on true data
  const categoryItems = React.useMemo(() => {
    return VISA_CATEGORIES.map((cat) => {
      const count = (visas || []).filter((v) => {
        const catName = (v.visaCategory || '').toLowerCase();
        return catName === cat.toLowerCase() || catName.includes(cat.toLowerCase());
      }).length;
      return { label: cat, count };
    });
  }, [visas]);

  // Pending ticket reissues
  const pendingTickets = tickets.filter(t => t.status === 'In-Progress' || t.status === 'Declined');

  // Overall Financial snapshot
  const financialSummary = React.useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let profit = 0;

    tickets.forEach((t) => {
      const s = t.sellingPrice !== undefined ? t.sellingPrice : (t.totalRefundable || 0);
      const c = t.costPrice !== undefined ? t.costPrice : 0;
      revenue += s;
      cost += c;
      profit += (t.profit !== undefined ? t.profit : (s - c));
    });

    visas.forEach((v) => {
      const s = Number(v.sellingPrice) || 0;
      const c = Number(v.purchasingPrice) || 0;
      revenue += s;
      cost += c;
      profit += (s - c);
    });

    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';
    return { revenue, cost, profit, margin };
  }, [tickets, visas]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Panel */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Dashboard Overview & Operations Center</h2>
            <p className="text-xs text-slate-500">Live operational alerts, visa overstay prevention & air ticket queue tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('tickets')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Air Tickets ({tickets.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('visas')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Visa Registry ({visas.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('accounting')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>Financials & Profit</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Financial Accounting & Profit Quick Banner */}
      <div 
        onClick={() => onNavigateTab('accounting')}
        className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-2xl border border-slate-700 shadow-md cursor-pointer hover:border-indigo-400/60 transition-all group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Financial Accounting & Profit Intelligence
                </span>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono px-2 py-0.2 rounded font-bold">
                  Date Range Filter Available
                </span>
              </div>
              <div className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2 mt-0.5">
                <span>Select Date Range to View P&L, Revenue & Supplier Costs</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 font-mono text-xs shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans block">Total Revenue</span>
              <span className="font-bold text-white">LKR {financialSummary.revenue.toLocaleString()}</span>
            </div>
            <div className="h-6 w-px bg-slate-700"></div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans block">Net Profit</span>
              <span className="font-black text-emerald-400">+LKR {financialSummary.profit.toLocaleString()}</span>
            </div>
            <div className="h-6 w-px bg-slate-700"></div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans block">Margin</span>
              <span className="font-black text-blue-400">{financialSummary.margin}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO EXPIRING NEXT 15 DAYS ALERT (BIGGER, HIGH VISIBILITY & PROMINENT) */}
      {/* ========================================================================= */}
      <div className={`rounded-2xl border transition-all overflow-hidden shadow-md ${
        expiring15DaysVisas.length > 0
          ? 'bg-gradient-to-br from-amber-950 via-slate-900 to-red-950 text-white border-amber-500/60 ring-2 ring-amber-500/30'
          : 'bg-white border-slate-200 p-5'
      }`}>
        {expiring15DaysVisas.length > 0 ? (
          <div className="p-5 md:p-6 space-y-5">
            {/* Top Alert Banner Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 pb-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/40 flex items-center justify-center shrink-0 animate-pulse">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
                      <span>CRITICAL ALERT: Visas Expiring in Next 15 Days</span>
                    </h3>
                    <span className="bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-md animate-pulse flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{expiring15DaysVisas.length} ACTION REQUIRED</span>
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-amber-200/90 mt-1 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Monitoring Inside UAE Travelers (<strong className="text-white">Used / Extended Status</strong>) to prevent overstay fines & absconding violations</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://smartservices.icp.gov.ae/echannels/web/client/default.html#/fileValidity"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Verify file validity on official UAE ICP portal"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">ICP Portal Check</span>
                </a>

                <button
                  onClick={() => onNavigateTab('visas')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
                >
                  <span>Open Full Visa Registry</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Urgency KPI Count Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Overdue */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                urgencyCounts.overdue > 0
                  ? 'bg-red-900/60 border-red-500/60 text-white ring-1 ring-red-400/50'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
              }`}>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-red-300 flex items-center justify-between">
                  <span>🚨 Overdue</span>
                  {urgencyCounts.overdue > 0 && <span className="animate-ping w-2 h-2 rounded-full bg-red-400"></span>}
                </div>
                <div className="text-2xl font-black font-mono mt-1 text-red-200">
                  {urgencyCounts.overdue}
                </div>
                <div className="text-[10px] text-red-300/80">Immediate fine risk</div>
              </div>

              {/* Expires Today */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                urgencyCounts.today > 0
                  ? 'bg-red-950/80 border-red-500/70 text-white ring-1 ring-red-400/50'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
              }`}>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                  ⚡ Expires Today
                </div>
                <div className="text-2xl font-black font-mono mt-1 text-amber-200">
                  {urgencyCounts.today}
                </div>
                <div className="text-[10px] text-amber-300/80">Exit or extend now</div>
              </div>

              {/* 1-3 Days */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                urgencyCounts.in1to3 > 0
                  ? 'bg-amber-900/50 border-amber-500/60 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
              }`}>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                  ⏳ 1 - 3 Days Left
                </div>
                <div className="text-2xl font-black font-mono mt-1 text-amber-100">
                  {urgencyCounts.in1to3}
                </div>
                <div className="text-[10px] text-amber-300/80">Urgent follow-up</div>
              </div>

              {/* 4-7 Days */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                urgencyCounts.in4to7 > 0
                  ? 'bg-amber-950/40 border-amber-600/40 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
              }`}>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  📅 4 - 7 Days Left
                </div>
                <div className="text-2xl font-black font-mono mt-1 text-white">
                  {urgencyCounts.in4to7}
                </div>
                <div className="text-[10px] text-slate-400">Schedule departure/extension</div>
              </div>

              {/* 8-15 Days */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                urgencyCounts.in8to15 > 0
                  ? 'bg-slate-800/80 border-slate-600/60 text-white'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
              }`}>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                  📋 8 - 15 Days Left
                </div>
                <div className="text-2xl font-black font-mono mt-1 text-white">
                  {urgencyCounts.in8to15}
                </div>
                <div className="text-[10px] text-slate-400">Advance notice tracking</div>
              </div>
            </div>

            {/* Quick Date Filter Chips */}
            {expiringDateGroups.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-xs font-bold text-amber-300 shrink-0 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Filter By Date:</span>
                </span>
                <button
                  onClick={() => setSelectedExpiringDateFilter('ALL')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                    selectedExpiringDateFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  All Dates ({expiring15DaysVisas.length})
                </button>
                {expiringDateGroups.map((grp) => (
                  <button
                    key={grp.dateStr}
                    onClick={() => setSelectedExpiringDateFilter(grp.dateStr)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      selectedExpiringDateFilter === grp.dateStr
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'bg-slate-800/80 text-amber-200 border border-amber-500/40 hover:bg-slate-700'
                    }`}
                  >
                    <span>{grp.dateStr}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      selectedExpiringDateFilter === grp.dateStr ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {grp.count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Big Comfortable Alert Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedExpiringVisas.map(({ visa, daysLeft }) => {
                const isOverdue = daysLeft < 0;
                const isToday = daysLeft === 0;
                const isUrgent = daysLeft >= 1 && daysLeft <= 3;
                const isCopied = copiedPassportId === visa.id;

                return (
                  <div
                    key={visa.id}
                    onClick={() => {
                      if (onOpenVisaDetails) {
                        onOpenVisaDetails(visa);
                      } else {
                        onNavigateTab('visas');
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative ${
                      isOverdue
                        ? 'bg-red-950/70 border-red-500 hover:border-red-400 shadow-lg shadow-red-950/50 ring-1 ring-red-500/50'
                        : isToday
                        ? 'bg-amber-950/80 border-amber-500 hover:border-amber-400 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/50'
                        : isUrgent
                        ? 'bg-slate-800/90 border-amber-500/50 hover:border-amber-400 shadow-md'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 shadow-sm'
                    }`}
                  >
                    {/* Top Countdown Pill & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                        isOverdue
                          ? 'bg-red-600 text-white animate-pulse'
                          : isToday
                          ? 'bg-amber-500 text-slate-950 animate-pulse font-black'
                          : isUrgent
                          ? 'bg-amber-600 text-white font-extrabold'
                          : 'bg-slate-700 text-slate-200'
                      }`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {isOverdue
                          ? `🚨 EXPIRED ${Math.abs(daysLeft)} DAYS AGO`
                          : isToday
                          ? '🔥 EXPIRES TODAY!'
                          : `⚠️ ${daysLeft} DAYS REMAINING`}
                      </span>

                      <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {visa.status}
                      </span>
                    </div>

                    {/* Passenger Name & Passport */}
                    <div className="space-y-1 border-b border-slate-700/80 pb-3">
                      <div className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors uppercase tracking-tight flex items-center justify-between">
                        <span className="truncate" title={`${visa.lastName} ${visa.firstName}`}>
                          {visa.lastName} {visa.firstName}
                        </span>
                        <span className="text-[11px] font-normal text-slate-400 ml-2 shrink-0">
                          {visa.nationality || 'SRI LANKAN'}
                        </span>
                      </div>

                      {/* Passport Number with 1-click copy */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Passport:</span>
                          <span className="font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded text-xs">
                            {visa.passportNo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPassport(e, visa.passportNo, visa.id)}
                          className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                          title="Copy Passport Number"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expiry Date Highlight Box */}
                    <div className="bg-slate-900/90 rounded-xl p-2.5 border border-amber-500/40 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Visa Expiry Date (Last Day):
                        </span>
                        <span className="text-sm font-black font-mono text-amber-300 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-amber-400" />
                          <span className="underline decoration-amber-500 decoration-2 underline-offset-2">
                            {visa.expiryDate || visa.passportExpiry}
                          </span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Category:</span>
                        <span className="text-xs font-bold text-slate-200 block truncate max-w-[130px]" title={visa.visaCategory}>
                          {visa.visaCategory}
                        </span>
                      </div>
                    </div>

                    {/* Agency & Actions Footer */}
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="font-bold text-blue-300 truncate max-w-[140px]" title={visa.customer || 'Direct Customer'}>
                          {visa.customer || 'Direct Customer'}
                        </span>
                      </div>

                      <span className="text-amber-400 font-bold group-hover:text-amber-300 group-hover:underline flex items-center gap-1 text-[11px] shrink-0">
                        <span>Open Details</span>
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Expiring Visas Alert (Next 15 Days)</h3>
                <p className="text-xs text-slate-500">All travelers inside the UAE are safe and within valid duration limits.</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-extrabold text-xs">
              0 Expiring (Safe)
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. AIR TICKET DEPARTURES WITHIN 5 DAYS SECTION                             */}
      {/* ========================================================================= */}
      <div className={`rounded-2xl border p-5 shadow-sm transition-all ${
        upcoming5DaysDepartureTickets.length > 0
          ? 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-blue-600/60 ring-2 ring-blue-500/30'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-800/60 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/40 flex items-center justify-center shrink-0">
              <Plane className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  Air Ticket Recent Departure Flights (Within 5 Days)
                </h3>
                {upcoming5DaysDepartureTickets.length > 0 && (
                  <span className="bg-cyan-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-md animate-pulse flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{upcoming5DaysDepartureTickets.length} FLIGHTS DEPARTING SOON</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Urgent flight departures requiring ticket status verification & customer notification
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('tickets')}
            className="px-3.5 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>View All Ticket Queue</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {upcoming5DaysDepartureTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {upcoming5DaysDepartureTickets.map(({ ticket, daysLeft }) => {
              const route = ticket.departureLocation && ticket.arrivalLocation
                ? `${ticket.departureLocation} → ${ticket.arrivalLocation}`
                : ticket.itinerary && ticket.itinerary[0]?.route
                ? ticket.itinerary[0].route
                : 'Route N/A';

              const mainTraveler = ticket.travelers && ticket.travelers[0]?.name
                ? ticket.travelers[0].name
                : 'Passenger N/A';

              const extraTravelersCount = ticket.travelers && ticket.travelers.length > 1
                ? ticket.travelers.length - 1
                : 0;

              return (
                <div
                  key={ticket.id}
                  onClick={() => {
                    if (onOpenTicketDetails) {
                      onOpenTicketDetails(ticket);
                    } else {
                      onNavigateTab('tickets');
                    }
                  }}
                  className="bg-slate-800/90 hover:bg-slate-800/100 border border-blue-500/40 hover:border-blue-400 p-4 rounded-xl shadow-lg transition-all cursor-pointer group space-y-3"
                >
                  {/* Top Bar: Countdown Tag & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 ${
                      daysLeft === 0
                        ? 'bg-red-600 text-white ring-2 ring-red-400/50 animate-pulse'
                        : daysLeft === 1
                        ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300'
                        : daysLeft < 0
                        ? 'bg-slate-600 text-slate-200'
                        : 'bg-cyan-500 text-slate-950 font-extrabold'
                    }`}>
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {daysLeft === 0
                        ? '🔥 DEPARTS TODAY!'
                        : daysLeft === 1
                        ? '⚡ DEPARTS TOMORROW!'
                        : daysLeft < 0
                        ? 'FLOWN / YESTERDAY'
                        : `DEPARTS IN ${daysLeft} DAYS`}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                      ticket.status === 'Issued / Confirmed' ? 'bg-emerald-600' :
                      ticket.status === 'In-Progress' ? 'bg-blue-600' :
                      ticket.status === 'Approved' ? 'bg-indigo-600' : 'bg-slate-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>

                  {/* Flight Info & Route */}
                  <div className="space-y-1 border-b border-slate-700/80 pb-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                        <Plane className="w-4 h-4 text-cyan-400 -rotate-45" />
                        {ticket.airline} ({ticket.flightNo || 'Flight N/A'})
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 font-extrabold">
                        FLY: {ticket.flyDate || 'N/A'}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 truncate">{route}</span>
                    </div>
                  </div>

                  {/* PNR & Traveler Details */}
                  <div className="text-xs space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">PNR Code:</span>
                      <span className="font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded text-[11px]">
                        {ticket.pnr || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Passenger:</span>
                      <span className="font-bold text-slate-200 truncate max-w-[170px]" title={mainTraveler}>
                        {mainTraveler} {extraTravelersCount > 0 && <span className="text-cyan-400 font-normal">+{extraTravelersCount}</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Agency / Customer:</span>
                      <span className="font-semibold text-blue-300 truncate max-w-[160px]">
                        {ticket.customer || 'Direct Customer'}
                      </span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-cyan-400 font-bold group-hover:underline">
                    <span>Open Ticket Details & Letterhead</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-slate-200">No flights departing within the next 5 days.</p>
            <p className="text-[11px] text-slate-400">All air ticket followups are currently scheduled outside the 5-day urgent window.</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. 4-COLUMN OVERVIEW GRID (STATUS, CATEGORY, EXPIRING SUMMARY, AGENCIES)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Status Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 border-b border-slate-100 pb-3 mb-3">
              <span className="text-sm font-bold tracking-tight text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Status Summary
              </span>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {statusItems.map((item) => (
                <div
                  key={item.label}
                  onClick={() => {
                    onSelectVisaStatusFilter(item.label);
                    onNavigateTab('visas');
                  }}
                  className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                >
                  <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">
                    {item.label}
                  </span>
                  <span className={`${item.colorClass} text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-2xs min-w-[32px] text-center font-mono`}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 text-center border-t border-slate-100 pt-2">
            Click any status to filter Visa registry
          </p>
        </div>

        {/* Card 2: Visa Category Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 border-b border-slate-100 pb-3 mb-3">
              <Layers className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold tracking-tight text-slate-800">
                Visa Category Summary
              </span>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {categoryItems.map((cat) => (
                <div
                  key={cat.label}
                  onClick={() => {
                    if (onSelectVisaCategoryFilter) {
                      onSelectVisaCategoryFilter(cat.label);
                    }
                    onNavigateTab('visas');
                  }}
                  className="flex items-center justify-between group cursor-pointer hover:bg-blue-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                  title={`Filter visas by ${cat.label}`}
                >
                  <span className="text-xs text-slate-700 font-medium group-hover:text-blue-900 leading-tight truncate max-w-[180px]">
                    {cat.label}
                  </span>
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white px-2 py-0.5 rounded transition-colors shrink-0 font-mono">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-3 text-center border-t border-slate-100 pt-2">
            Click any category to filter Visa registry
          </p>
        </div>

        {/* Card 3: Expiring Visas Quick Watchlist (Enhanced) */}
        <div className={`rounded-xl border shadow-xs p-4 flex flex-col justify-between transition-all ${
          expiring15DaysVisas.length > 0
            ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/50'
            : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <CalendarX className={`w-4 h-4 ${expiring15DaysVisas.length > 0 ? 'text-amber-600' : 'text-blue-500'}`} />
                  <span className="text-sm font-bold tracking-tight text-slate-800">
                    Expiring (Next 15 Days)
                  </span>
                </div>
                <div className="text-[10px] font-semibold text-teal-800 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  <span>Inside UAE • Used Visas Only</span>
                </div>
              </div>
              {expiring15DaysVisas.length > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  <span>{expiring15DaysVisas.length} ALERT</span>
                </span>
              )}
            </div>

            {displayedExpiringVisas.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {displayedExpiringVisas.map(({ visa, daysLeft }) => (
                  <div
                    key={visa.id}
                    onClick={() => {
                      if (onOpenVisaDetails) {
                        onOpenVisaDetails(visa);
                      } else {
                        onNavigateTab('visas');
                      }
                    }}
                    className="p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs hover:border-amber-500 hover:shadow-xs cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">
                        {`${visa.lastName || ''} ${visa.firstName || ''}`.trim() || 'Passenger'}
                      </span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        daysLeft < 0
                          ? 'bg-red-100 text-red-800'
                          : daysLeft <= 3
                          ? 'bg-red-600 text-white font-mono'
                          : 'bg-amber-500 text-white font-mono'
                      }`}>
                        {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Expires Today!' : `${daysLeft}d left`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-amber-50 rounded px-2 py-1 border border-amber-200">
                      <span className="text-amber-900 font-extrabold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-700" />
                        <span>Expiry: <strong>{visa.expiryDate || visa.passportExpiry}</strong></span>
                      </span>
                      <span className="text-[10px] text-blue-700 font-bold group-hover:underline">
                        Details &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="text-xs font-bold text-slate-700">No 'Used' visas expiring in 15 days.</p>
                <p className="text-[10px] text-slate-400 max-w-[190px]">
                  All active travelers inside the UAE are safely within validity dates.
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-200/80 pt-2 flex items-center justify-between">
            <span>Click to view details</span>
            <button
              onClick={() => onNavigateTab('visas')}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              View All &rarr;
            </button>
          </div>
        </div>

        {/* Card 4: Expiring Visas by Customer (Next 15 Days) */}
        <div className={`rounded-xl border shadow-xs p-4 flex flex-col justify-between transition-all ${
          expiringByCustomer.length > 0
            ? 'bg-blue-50/60 border-blue-200'
            : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 mb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold tracking-tight text-slate-800">
                  Expiring by Agency
                </span>
              </div>
              {expiringByCustomer.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {expiringByCustomer.length} Agencies
                </span>
              )}
            </div>

            {expiringByCustomer.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {expiringByCustomer.map(({ customer, count, minDays }) => (
                  <div
                    key={customer}
                    onClick={() => onNavigateTab('visas')}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block truncate max-w-[140px]">
                        {customer}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Earliest: <strong className="text-amber-700">{minDays <= 0 ? 'Immediate' : `In ${minDays} days`}</strong>
                      </span>
                    </div>
                    <span className="text-xs font-extrabold px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      {count} {count === 1 ? 'Visa' : 'Visas'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 space-y-2">
                <UserCheck className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">No agency alerts.</p>
                <p className="text-[10px] text-slate-400 max-w-[180px]">
                  Client alerts will appear here automatically when deadlines approach.
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 text-center border-t border-slate-200/80 pt-2">
            Seagull Global • Travel & Visa Workflow Management
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. VISA EXPIRATIONS MONTHLY TIMELINE / TREND BAR CHART                     */}
      {/* ========================================================================= */}
      <VisaExpirationsChart
        visas={visas}
        onNavigateTab={onNavigateTab}
        onSelectVisaStatusFilter={onSelectVisaStatusFilter}
        onOpenVisaDetails={onOpenVisaDetails}
      />

      {/* ========================================================================= */}
      {/* 5. AGENCY / CUSTOMER DATA OVERVIEW SECTION                                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Data Separated by Agency / Customer</h3>
              <p className="text-[11px] text-slate-500">Live stats per partner agency for Visas & Air Ticket reissues</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('visas')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Filter by Agency in Visas</span> &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {agencyStatsList.map((item) => (
            <div
              key={item.agency}
              onClick={() => onNavigateTab('visas')}
              className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all space-y-2.5 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    {item.agency}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  {item.totalVisas + item.totalTickets} Total Items
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[11px] pt-1">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Visas</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{item.totalVisas}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Air Tickets</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{item.totalTickets}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/80 pt-2">
                <span>Approved: <strong className="text-emerald-600 font-bold">{item.approved}</strong></span>
                <span>Extended: <strong className="text-blue-600 font-bold">{item.extended}</strong></span>
                <span>Pending: <strong className="text-amber-600 font-bold">{item.pending}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. TICKET REISSUES & FOLLOWUPS ACTION SECTION                              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">Air Ticket Reissues Needing Action</h3>
          </div>
          <button
            onClick={() => onNavigateTab('tickets')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            View All Ticket Requests ({tickets.length}) &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pendingTickets.slice(0, 3).map((t) => (
            <div
              key={t.id}
              onClick={() => onNavigateTab('tickets')}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 font-mono">
                  PNR: {t.pnr || 'N/A'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${
                  t.status === 'Declined' ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 mb-2 font-mono">
                {Array.isArray(t.tickets) ? t.tickets.join(' ') : ''}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
                <span>{t.customer}</span>
                <span className="font-semibold text-slate-700">{t.quote || 'Pending Quote'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

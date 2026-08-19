import React, { useState, useMemo } from 'react';
import { VisaFollowup, VISA_CATEGORIES } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { Calendar, AlertCircle, Building2, Layers, Filter, TrendingUp, CheckCircle2 } from 'lucide-react';

interface VisaExpirationsChartProps {
  visas: VisaFollowup[];
  onNavigateTab: (tab: 'tickets' | 'visas') => void;
  onSelectVisaStatusFilter?: (status: any) => void;
  onOpenVisaDetails?: (visa: VisaFollowup) => void;
}

export const VisaExpirationsChart: React.FC<VisaExpirationsChartProps> = ({
  visas,
  onNavigateTab,
  onOpenVisaDetails
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAgency, setSelectedAgency] = useState<string>('ALL');
  const [statusScope, setStatusScope] = useState<'ALL' | 'USED_ONLY' | 'APPROVED_ONLY'>('ALL');
  const [timeframe, setTimeframe] = useState<'6M' | '12M' | 'ALL'>('12M');
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null);

  // Helper to parse DD/MM/YYYY or YYYY-MM-DD
  const parseExpiryMonth = (expiryDateStr?: string) => {
    if (!expiryDateStr || expiryDateStr === 'N/A') return null;
    let day = 0, month = 0, year = 0;

    if (expiryDateStr.includes('/')) {
      const parts = expiryDateStr.split('/');
      if (parts.length === 3) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
    } else if (expiryDateStr.includes('-')) {
      const parts = expiryDateStr.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }
    }

    if (!month || !year || isNaN(month) || isNaN(year)) return null;
    if (year < 100) year += 2000;

    const dateObj = new Date(year, month - 1, 1);
    const yearMonthKey = `${year}-${String(month).padStart(2, '0')}`;
    const label = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    return { yearMonthKey, label, dateObj, year, month };
  };

  // Filtered visas based on Category, Agency, and Status Scope
  const filteredVisas = useMemo(() => {
    return (visas || []).filter((v) => {
      if (!v) return false;

      // Status scope filter
      if (statusScope === 'USED_ONLY') {
        if (v.status !== 'Used' && v.status !== 'Extended') return false;
      } else if (statusScope === 'APPROVED_ONLY') {
        if (v.status !== 'Approved') return false;
      } else {
        // Exclude cancelled/refunded/rejected from standard timeline
        if (v.status === 'Cancelled' || v.status === 'Refund' || v.status === 'Rejected' || v.status === 'Closed') {
          return false;
        }
      }

      const matchesCat =
        selectedCategory === 'ALL' ||
        (v.visaCategory || '').toLowerCase().includes(selectedCategory.toLowerCase());

      const agencyName = (v.customer || 'Direct Customer').trim();
      const matchesAgency =
        selectedAgency === 'ALL' ||
        agencyName.toLowerCase() === selectedAgency.toLowerCase();

      return matchesCat && matchesAgency;
    });
  }, [visas, selectedCategory, selectedAgency, statusScope]);

  // Aggregate monthly expiration data
  const { monthlyData, peakMonth, totalUpcoming, next30DaysCount } = useMemo(() => {
    const map: Record<
      string,
      {
        monthKey: string;
        label: string;
        dateObj: Date;
        count: number;
        cat30: number;
        cat60: number;
        umrah: number;
        other: number;
        visas: VisaFollowup[];
      }
    > = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let next30Count = 0;

    filteredVisas.forEach((v) => {
      const parsed = parseExpiryMonth(v.expiryDate);
      if (!parsed) return;

      const { yearMonthKey, label, dateObj } = parsed;

      // Calculate days until expiry
      const expParts = v.expiryDate?.split('/') || [];
      if (expParts.length === 3) {
        const expDate = new Date(
          parseInt(expParts[2], 10),
          parseInt(expParts[1], 10) - 1,
          parseInt(expParts[0], 10)
        );
        const diffDays = Math.ceil(
          (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays >= 0 && diffDays <= 30) {
          next30Count++;
        }
      }

      if (!map[yearMonthKey]) {
        map[yearMonthKey] = {
          monthKey: yearMonthKey,
          label,
          dateObj,
          count: 0,
          cat30: 0,
          cat60: 0,
          umrah: 0,
          other: 0,
          visas: []
        };
      }

      map[yearMonthKey].count += 1;
      map[yearMonthKey].visas.push(v);

      const catLower = (v.visaCategory || '').toLowerCase();
      if (catLower.includes('30')) map[yearMonthKey].cat30 += 1;
      else if (catLower.includes('60')) map[yearMonthKey].cat60 += 1;
      else if (catLower.includes('umrah')) map[yearMonthKey].umrah += 1;
      else map[yearMonthKey].other += 1;
    });

    let sorted = Object.values(map).sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
    );

    // Filter by timeframe if applicable
    if (timeframe === '6M') {
      const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      sorted = sorted.filter((d) => d.monthKey >= currentYearMonth).slice(0, 6);
    } else if (timeframe === '12M') {
      const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      sorted = sorted.filter((d) => d.monthKey >= currentYearMonth).slice(0, 12);
    }

    let peak = { label: 'None', count: 0 };
    let total = 0;

    sorted.forEach((item) => {
      total += item.count;
      if (item.count > peak.count) {
        peak = { label: item.label, count: item.count };
      }
    });

    return {
      monthlyData: sorted,
      peakMonth: peak,
      totalUpcoming: total,
      next30DaysCount: next30Count
    };
  }, [filteredVisas, timeframe]);

  // Unique Agencies list for filter dropdown
  const agenciesList = useMemo(() => {
    const set = new Set<string>();
    visas.forEach((v) => {
      if (v.customer && v.customer.trim()) set.add(v.customer.trim());
    });
    return Array.from(set).sort();
  }, [visas]);

  // Currently selected month details
  const activeMonthData = useMemo(() => {
    if (!activeMonthKey) return null;
    return monthlyData.find((m) => m.monthKey === activeMonthKey) || null;
  }, [monthlyData, activeMonthKey]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Upcoming Visa Expirations by Month
              </h3>
              <span className="bg-blue-100 text-blue-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                Monthly Trend
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              High-level visual timeline of active visa validity deadlines across months
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setTimeframe('6M')}
              className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                timeframe === '6M'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 6M
            </button>
            <button
              onClick={() => setTimeframe('12M')}
              className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                timeframe === '12M'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 12M
            </button>
            <button
              onClick={() => setTimeframe('ALL')}
              className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                timeframe === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Status Scope Filter */}
          <select
            value={statusScope}
            onChange={(e) => setStatusScope(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Active Statuses</option>
            <option value="USED_ONLY">Inside UAE (Used Only)</option>
            <option value="APPROVED_ONLY">Approved (Unused Permits)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {VISA_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Agency Filter */}
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Agencies / Clients</option>
            {agenciesList.map((ag) => (
              <option key={ag} value={ag}>
                {ag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Expirations Tracked
          </span>
          <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
            {totalUpcoming}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Across {monthlyData.length} active months
          </span>
        </div>

        <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
              Critical (Next 30 Days)
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-xl font-extrabold text-amber-900 font-mono mt-0.5 block">
            {next30DaysCount}
          </span>
          <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
            Requires priority processing
          </span>
        </div>

        <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
          <span className="text-[10px] uppercase font-bold text-blue-700 block tracking-wider">
            Peak Expiration Month
          </span>
          <span className="text-sm font-extrabold text-blue-900 mt-1 block truncate">
            {peakMonth.label}
          </span>
          <span className="text-[10px] text-blue-700 font-bold mt-0.5 block">
            {peakMonth.count} visas expiring
          </span>
        </div>

        <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
            Primary Category
          </span>
          <span className="text-sm font-extrabold text-emerald-900 mt-1 block">
            60 Days Partner
          </span>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
            Highest volume category
          </span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="pt-2">
        {monthlyData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300" />
            <p className="font-semibold text-slate-600">No visa expirations found for selected filters.</p>
            <p className="text-[11px] text-slate-400">Try adjusting timeframe, category, or agency options.</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload[0]) {
                    const monthKey = state.activePayload[0].payload.monthKey;
                    setActiveMonthKey(activeMonthKey === monthKey ? null : monthKey);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={40}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[170px]">
                          <div className="font-extrabold text-blue-300 border-b border-slate-700 pb-1 flex justify-between items-center">
                            <span>{data.label}</span>
                            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                              {data.count} Visas
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px] pt-0.5">
                            <div className="flex justify-between">
                              <span className="text-slate-300">60 Days (P):</span>
                              <span className="font-mono font-bold text-emerald-400">{data.cat60}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">30 Days (P):</span>
                              <span className="font-mono font-bold text-amber-400">{data.cat30}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">Umrah Visa:</span>
                              <span className="font-mono font-bold text-purple-400">{data.umrah}</span>
                            </div>
                            {data.other > 0 && (
                              <div className="flex justify-between">
                                <span className="text-slate-300">Others:</span>
                                <span className="font-mono font-bold text-slate-300">{data.other}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 pt-1 border-t border-slate-800 text-center italic">
                            Click bar to inspect list below
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {monthlyData.map((entry) => (
                    <Cell
                      key={`cell-${entry.monthKey}`}
                      fill={activeMonthKey === entry.monthKey ? '#1D4ED8' : '#3B82F6'}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Selected Month Detail Drawer / Drilldown */}
      {activeMonthData && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">
                Visas Expiring in <span className="text-blue-700 underline font-extrabold">{activeMonthData.label}</span> ({activeMonthData.visas.length} Visas)
              </h4>
            </div>
            <button
              onClick={() => setActiveMonthKey(null)}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
            >
              Close Drilldown
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {activeMonthData.visas.map((v) => (
              <div
                key={v.id}
                onClick={() => {
                  if (onOpenVisaDetails) {
                    onOpenVisaDetails(v);
                  } else {
                    onNavigateTab('visas');
                  }
                }}
                className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 hover:shadow-xs cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[140px]">
                    {`${v.firstName || ''} ${v.lastName || ''}`.trim() || 'Passenger'}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    Exp: {v.expiryDate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Category: <strong>{v.visaCategory}</strong></span>
                  <span className="font-semibold text-slate-700">{v.customer || 'Direct Customer'}</span>
                </div>
                <div className="text-[9px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end">
                  <span>Click to view all datas &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation Link */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-slate-500 text-[11px]">
          Tip: Click on any month bar to expand the detailed list of expiring visas for that month.
        </span>
        <button
          onClick={() => onNavigateTab('visas')}
          className="font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
        >
          <span>Open Full Visa Registry</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { TicketFollowup, TicketStatus } from '../types';
import { 
  MessageSquare, ExternalLink, Filter, Search, Plus, Download, Edit2, Edit3, 
  Trash2, Building2, Layers, Plane, Calendar, MapPin, Tag, ArrowRight, User, Paperclip, Users,
  DollarSign, TrendingUp, TrendingDown, Calculator, CalendarRange, X
} from 'lucide-react';
import { getTicketStatusBadgeClass } from '../utils/helpers';
import { isDateInRange, getDateRangePreset, DatePreset } from '../utils/dateUtils';

interface TicketFollowupTableProps {
  tickets: TicketFollowup[];
  searchTerm: string;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (status: string) => void;
  onOpenDetails: (ticket: TicketFollowup) => void;
  onOpenComments: (ticket: TicketFollowup) => void;
  onAddNewTicket: () => void;
  onEditTicket?: (ticket: TicketFollowup) => void;
  onDeleteTicket: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: TicketStatus) => void;
  commentsCountMap: Record<string, number>;
}

export const TicketFollowupTable: React.FC<TicketFollowupTableProps> = ({
  tickets,
  searchTerm,
  selectedStatusFilter,
  setSelectedStatusFilter,
  onOpenDetails,
  onOpenComments,
  onAddNewTicket,
  onEditTicket,
  onDeleteTicket,
  onUpdateStatus,
  commentsCountMap
}) => {
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>('ALL');
  const [selectedAirlineFilter, setSelectedAirlineFilter] = useState<string>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState<'ALL' | 'Agency' | 'Customer'>('ALL');
  const [isGroupedByAgency, setIsGroupedByAgency] = useState<boolean>(false);

  // Date Filtering State
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateField, setDateField] = useState<'flyDate' | 'requestDate'>('flyDate');

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const range = getDateRangePreset(preset);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const handleClearDateFilter = () => {
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
  };

  // Helper to calculate days remaining until departure
  const getDaysLeftForFlyDate = React.useCallback((dateStr?: string): number | null => {
    if (!dateStr || dateStr === 'N/A' || dateStr === 'Pending') return null;
    const clean = dateStr.trim();
    let depDate: Date | null = null;
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        depDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    } else if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          depDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          depDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }
    }
    if (!depDate || isNaN(depDate.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = depDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const statusOptions = [
    'ALL', 
    'Departing in 5 Days',
    'In-Progress', 
    'Approved', 
    'Issued / Confirmed', 
    'Flown', 
    'Declined', 
    'Completed', 
    'Cancelled'
  ];

  // Dynamic Agency list with counts
  const agencyList = React.useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      const agencyName = (t.customer || 'Direct Customer').trim();
      counts[agencyName] = (counts[agencyName] || 0) + 1;
    });
    const sortedAgencies = Object.keys(counts).sort().map((name) => ({
      name,
      count: counts[name],
    }));
    return [{ name: 'ALL', count: tickets.length }, ...sortedAgencies];
  }, [tickets]);

  // Dynamic Airline List
  const airlineList = React.useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.airline) set.add(t.airline.trim());
    });
    return Array.from(set).sort();
  }, [tickets]);

  // Filtering
  const filteredTickets = (tickets || []).filter((t) => {
    if (!t) return false;
    const matchesSearch =
      searchTerm === '' ||
      (Array.isArray(t.tickets) && t.tickets.some((num) => (num || '').includes(searchTerm))) ||
      (t.pnr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.airline && t.airline.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.flyDate && t.flyDate.includes(searchTerm)) ||
      (t.departureLocation && t.departureLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.arrivalLocation && t.arrivalLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.flightNo && t.flightNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.travelers && t.travelers.some((tr) => (tr?.name || '').toLowerCase().includes(searchTerm.toLowerCase())));

    const daysLeft = getDaysLeftForFlyDate(t.flyDate || (t.itinerary && t.itinerary[0]?.dateTime?.split(' ')[0]));

    const matchesStatus =
      selectedStatusFilter === 'ALL'
        ? true
        : selectedStatusFilter === 'Departing in 5 Days'
        ? (daysLeft !== null && daysLeft >= -1 && daysLeft <= 5)
        : t.status === selectedStatusFilter;

    const matchesAgency =
      selectedAgencyFilter === 'ALL' ||
      (t.customer || 'Direct Customer').trim().toLowerCase() === selectedAgencyFilter.toLowerCase();

    const matchesAirline =
      selectedAirlineFilter === 'ALL' ||
      (t.airline || '').trim().toLowerCase() === selectedAirlineFilter.toLowerCase();

    const matchesEntityType =
      entityTypeFilter === 'ALL' ||
      (entityTypeFilter === 'Customer' ? t.customerType === 'Customer' : (t.customerType || 'Agency') === 'Agency');

    const matchesDate = (() => {
      if (!startDate && !endDate) return true;
      const targetDateStr = dateField === 'flyDate'
        ? (t.flyDate || (t.itinerary && t.itinerary[0]?.dateTime?.split(' ')[0]))
        : (t.requestDate || t.createdAt?.split('T')[0]);
      return isDateInRange(targetDateStr, startDate, endDate);
    })();

    return matchesSearch && matchesStatus && matchesAgency && matchesAirline && matchesEntityType && matchesDate;
  });

  // Grouping logic when isGroupedByAgency is true
  const groupedTickets = React.useMemo(() => {
    const groups: Record<string, TicketFollowup[]> = {};
    filteredTickets.forEach((t) => {
      const agencyName = (t.customer || 'Direct Customer').trim();
      if (!groups[agencyName]) {
        groups[agencyName] = [];
      }
      groups[agencyName].push(t);
    });
    return groups;
  }, [filteredTickets]);

  const financialTotals = React.useMemo(() => {
    let totalSelling = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let pricedCount = 0;
    let groupCount = 0;
    let groupPaxCount = 0;

    filteredTickets.forEach((t) => {
      const selling = t.sellingPrice !== undefined ? t.sellingPrice : (t.totalRefundable || 0);
      const cost = t.costPrice !== undefined ? t.costPrice : 0;
      const profit = t.profit !== undefined ? t.profit : (selling - cost);

      totalSelling += selling;
      totalCost += cost;
      if (t.costPrice !== undefined || t.sellingPrice !== undefined) {
        totalProfit += profit;
        pricedCount++;
      }
      if (t.isGroupBooking) {
        groupCount++;
        groupPaxCount += (t.groupSize || t.travelers?.length || 1);
      }
    });

    const margin = totalSelling > 0 ? ((totalProfit / totalSelling) * 100).toFixed(1) : '0.0';
    return { totalSelling, totalCost, totalProfit, margin, pricedCount, groupCount, groupPaxCount };
  }, [filteredTickets]);

  const exportCSV = () => {
    const headers = [
      'Tickets', 'PNR', 'Airline', 'Flight No', 'Fly Date', 'Return Date', 
      'Departure Location', 'Arrival Location', 'Category', 'Status', 'Customer',
      'Is Group', 'Group Name', 'Group Pax', 'Cost Price', 'Selling Price', 'Net Profit', 'Profit Per Pax', 'Payment Status', 'Comment'
    ];
    const rows = filteredTickets.map((t) => {
      const selling = t.sellingPrice !== undefined ? t.sellingPrice : (t.totalRefundable || 0);
      const cost = t.costPrice !== undefined ? t.costPrice : '';
      const profit = t.profit !== undefined ? t.profit : (t.costPrice !== undefined ? selling - t.costPrice : '');
      const paxCount = t.groupSize || t.travelers?.length || 1;
      const profitPerPax = t.profitPerPax !== undefined ? t.profitPerPax : (typeof profit === 'number' && paxCount > 0 ? (profit / paxCount).toFixed(0) : '');

      return [
        `"${t.tickets.join(', ')}"`,
        `"${t.pnr}"`,
        `"${t.airline || ''}"`,
        `"${t.flightNo || ''}"`,
        `"${t.flyDate || ''}"`,
        `"${t.returnDate || ''}"`,
        `"${t.departureLocation || ''}"`,
        `"${t.arrivalLocation || ''}"`,
        `"${t.reissueCategory || 'Standard Reissue'}"`,
        `"${t.status}"`,
        `"${t.customer}"`,
        `"${t.isGroupBooking ? 'YES' : 'NO'}"`,
        `"${t.groupName || ''}"`,
        `"${t.isGroupBooking ? paxCount : 1}"`,
        `"${cost}"`,
        `"${selling}"`,
        `"${profit}"`,
        `"${profitPerPax}"`,
        `"${t.paymentStatus || 'Unpaid'}"`,
        `"${t.comment.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Air_Tickets_Followup_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTicketRow = (item: TicketFollowup) => {
    const commentCount = commentsCountMap[item.id] || 0;
    const primaryTraveler = item.travelers && item.travelers.length > 0 ? item.travelers[0].name : '';
    const otherTravelersCount = item.travelers && item.travelers.length > 1 ? item.travelers.length - 1 : 0;
    const routeDisplay = item.departureLocation && item.arrivalLocation 
      ? `${item.departureLocation} → ${item.arrivalLocation}` 
      : (item.itinerary && item.itinerary[0]?.route ? item.itinerary[0].route : 'N/A');

    const cur = item.currency || 'LKR';
    const selling = item.sellingPrice !== undefined ? item.sellingPrice : (item.totalRefundable || 0);
    const cost = item.costPrice !== undefined ? item.costPrice : undefined;
    const hasFinancials = cost !== undefined || item.sellingPrice !== undefined || item.totalRefundable !== undefined;
    const netProfit = item.profit !== undefined ? item.profit : (cost !== undefined ? selling - cost : undefined);
    const paxCount = item.groupSize || (item.travelers && item.travelers.length > 0 ? item.travelers.length : 1);
    const profitPax = item.profitPerPax !== undefined 
      ? item.profitPerPax 
      : (netProfit !== undefined && paxCount > 0 ? Math.round(netProfit / paxCount) : undefined);

    return (
      <tr
        key={item.id}
        className="hover:bg-slate-50/90 transition-colors group border-b border-slate-100"
      >
        {/* Ticket Numbers & Passenger */}
        <td className="py-3 px-4 align-top">
          {item.isGroupBooking && (
            <div className="mb-1.5 inline-flex items-center space-x-1 bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded-md text-[10px] font-black">
              <Users className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>GROUP: {item.groupName || 'Tour Group'}</span>
              <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono ml-1">
                {paxCount} Pax
              </span>
            </div>
          )}

          <div className="font-mono text-slate-800 text-[11px] leading-relaxed break-words font-semibold max-w-[240px]">
            {item.tickets.join(' ')}
          </div>

          <div className="text-[10px] text-slate-700 mt-1 font-sans flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-bold truncate max-w-[190px]" title={primaryTraveler || item.customer}>
              {primaryTraveler || item.customer}
            </span>
            {otherTravelersCount > 0 && (
              <span 
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-1.5 py-0.2 rounded text-[9px] cursor-help transition-colors"
                title={`All Passengers:\n${item.travelers?.map((t, idx) => `${idx + 1}. ${t.name} (${t.ticketNo || 'No Ticket'})`).join('\n')}`}
              >
                +{otherTravelersCount} more
              </span>
            )}
          </div>

          <div className="text-[9px] text-slate-400 mt-0.5 font-mono flex items-center gap-1">
            <span>Account:</span>
            <span className="text-slate-700 font-semibold">{item.customer}</span>
            <span className={`text-[8px] px-1 rounded font-bold uppercase ${
              item.customerType === 'Customer' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {item.customerType === 'Customer' ? 'B2C' : 'Agency'}
            </span>
          </div>
        </td>

        {/* Airline & Flight Details */}
        <td className="py-3 px-3 align-top space-y-1">
          <div className="flex items-center space-x-1">
            <Plane className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">
              {item.airline || 'Airline'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 border border-blue-200/60 rounded px-1.5 py-0.5 inline-block">
            {item.flightNo || (item.itinerary && item.itinerary[0]?.flightNo) || 'Flight N/A'}
          </div>
          <div className="text-[10px] text-slate-600 flex items-center gap-1 font-semibold">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{routeDisplay}</span>
          </div>
        </td>

        {/* Fly Date & Return Date */}
        <td className="py-3 px-3 align-top space-y-1 font-mono">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-400 block font-sans uppercase tracking-tight font-bold">FLY DATE</span>
              <span className="text-xs font-bold text-slate-900">{item.flyDate || (item.itinerary && item.itinerary[0]?.dateTime?.split(' ')[0]) || 'Pending'}</span>
            </div>
          </div>
          {(() => {
            const daysLeft = getDaysLeftForFlyDate(item.flyDate || (item.itinerary && item.itinerary[0]?.dateTime?.split(' ')[0]));
            if (daysLeft !== null && daysLeft >= -1 && daysLeft <= 5) {
              return (
                <div className="pt-0.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tight inline-flex items-center gap-1 ${
                    daysLeft === 0 ? 'bg-red-600 text-white animate-pulse' :
                    daysLeft === 1 ? 'bg-amber-500 text-slate-950 font-bold' :
                    daysLeft < 0 ? 'bg-slate-600 text-slate-200' :
                    'bg-cyan-600 text-white'
                  }`}>
                    {daysLeft === 0 ? '🔥 Departs Today!' :
                     daysLeft === 1 ? '⚡ Departs Tomorrow!' :
                     daysLeft < 0 ? 'Yesterday / Flown' :
                     `✈️ Departs in ${daysLeft} days`}
                  </span>
                </div>
              );
            }
            return null;
          })()}
          {item.returnDate && item.returnDate !== 'N/A' ? (
            <div className="text-[10px] text-slate-600 pl-5">
              <span className="text-slate-400 text-[9px] font-sans block">RETURN:</span>
              <span className="font-semibold text-slate-800">{item.returnDate}</span>
            </div>
          ) : (
            <div className="pl-5 text-[9px] text-slate-400 italic">
              {item.tripType || 'One Way'}
            </div>
          )}
        </td>

        {/* Booking PNR & Category */}
        <td className="py-3 px-3 align-top space-y-1">
          <div className="font-mono font-bold text-slate-900 text-xs tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
            {item.pnr || item.newBooking || 'N/A'}
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="bg-[#FEF0D9] text-[#D97706] border border-[#FDE68A] text-[9px] px-2 py-0.5 rounded-full font-bold inline-block">
              {item.reissueCategory || 'Standard Reissue'}
            </span>
            {item.isGroupBooking && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1" title="Group Booking (Shared PNR)">
                <Users className="w-2.5 h-2.5 text-indigo-600" />
                <span>Group Booking</span>
              </span>
            )}
            {item.ticketAttachment && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1" title="Air Ticket Document Attached">
                <Paperclip className="w-2.5 h-2.5 text-blue-600" />
                <span>Ticket Attached</span>
              </span>
            )}
          </div>
        </td>

        {/* Current Status Dropdown */}
        <td className="py-3 px-3 align-top">
          <select
            value={item.status}
            onChange={(e) => onUpdateStatus(item.id, e.target.value as TicketStatus)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold cursor-pointer border-none focus:ring-2 focus:ring-blue-500 appearance-none inline-block shadow-2xs ${
              item.status === 'In-Progress'
                ? 'bg-[#3498DB] text-white'
                : item.status === 'Issued / Confirmed'
                ? 'bg-emerald-600 text-white'
                : item.status === 'Flown'
                ? 'bg-purple-600 text-white'
                : item.status === 'Approved'
                ? 'bg-[#2ECC71] text-white'
                : item.status === 'Completed'
                ? 'bg-[#10B981] text-white'
                : item.status === 'Declined'
                ? 'bg-[#E74C3C] text-white'
                : 'bg-slate-600 text-white'
            }`}
          >
            <option value="In-Progress" className="text-slate-800 bg-white">In-Progress</option>
            <option value="Approved" className="text-slate-800 bg-white">Approved</option>
            <option value="Issued / Confirmed" className="text-slate-800 bg-white">Issued / Confirmed</option>
            <option value="Flown" className="text-slate-800 bg-white">Flown</option>
            <option value="Completed" className="text-slate-800 bg-white">Completed</option>
            <option value="Declined" className="text-slate-800 bg-white">Declined</option>
            <option value="Cancelled" className="text-slate-800 bg-white">Cancelled</option>
          </select>

          <p className="line-clamp-2 text-[10px] text-slate-500 font-sans mt-1 max-w-[140px]">
            {item.comment}
          </p>
        </td>

        {/* Financials: Selling, Cost & Profit */}
        <td className="py-3 px-3 align-top space-y-1">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-tight">Selling / Quote</span>
            <span className="font-extrabold text-slate-900 text-xs font-mono">
              {cur} {selling.toLocaleString()}
            </span>
          </div>

          {cost !== undefined && cost > 0 && (
            <div className="text-[10px] text-slate-500 font-mono">
              <span className="text-[9px] text-slate-400 block uppercase font-bold">Cost:</span>
              <span className="text-slate-700 font-bold">{cur} {cost.toLocaleString()}</span>
            </div>
          )}

          {netProfit !== undefined && (
            <div className="pt-0.5">
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono inline-flex items-center gap-1 ${
                netProfit >= 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {netProfit >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                <span>{netProfit >= 0 ? `+${cur} ${netProfit.toLocaleString()}` : `${cur} ${netProfit.toLocaleString()}`}</span>
              </span>

              {item.isGroupBooking && profitPax !== undefined && paxCount > 1 && (
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  ({cur} {profitPax.toLocaleString()} / pax)
                </div>
              )}
            </div>
          )}

          {item.paymentStatus && (
            <div className="pt-0.5">
              <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                item.paymentStatus === 'Fully Paid' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : item.paymentStatus === 'Partial Paid'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {item.paymentStatus}
              </span>
            </div>
          )}
        </td>

        {/* Actions Column */}
        <td className="py-3 px-4 align-top">
          <div className="flex flex-col space-y-1.5 items-end">
            
            {/* Comments Button */}
            <button
              onClick={() => onOpenComments(item)}
              className="w-24 bg-[#3897F0] hover:bg-[#000000] text-white text-[11px] font-bold py-1 px-2.5 rounded shadow-2xs flex items-center justify-between transition-colors cursor-pointer"
              title="View / Add Operational Comments"
            >
              <span>Comments</span>
              {commentCount > 0 && (
                <span className="bg-white/20 text-white text-[9px] px-1 rounded font-mono font-bold">
                  {commentCount}
                </span>
              )}
            </button>

            {/* Full Details Card Button */}
            <button
              onClick={() => onOpenDetails(item)}
              className="w-24 bg-[#3897F0] hover:bg-[#1D72C2] text-white text-[11px] font-bold py-1 px-2.5 rounded shadow-2xs flex items-center justify-between transition-colors cursor-pointer"
              title="Open Full Detail Card View"
            >
              <span>Details</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {/* Edit Ticket Button */}
            {onEditTicket && (
              <button
                onClick={() => onEditTicket(item)}
                className="w-24 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-1 px-2.5 rounded shadow-2xs flex items-center justify-between transition-colors cursor-pointer"
                title="Edit Air Ticket Record"
              >
                <span>Edit</span>
                <Edit3 className="w-3 h-3" />
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={() => onDeleteTicket(item.id)}
              className="text-[10px] text-slate-400 hover:text-red-600 pt-0.5 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>

          </div>
        </td>
      </tr>
    );
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
                <span>Air Ticket Issue & Follow-Up System</span>
                <span className="bg-blue-500/30 text-blue-300 text-[10px] px-2 py-0.5 rounded font-normal">
                  {filteredTickets.length} Tickets
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Track fly dates, airlines, departure routes, ticket status, and agency accounts
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-1">
            {/* Airline Dropdown Filter */}
            {airlineList.length > 0 && (
              <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                <Plane className="w-3 h-3 text-blue-400" />
                <select
                  value={selectedAirlineFilter}
                  onChange={(e) => setSelectedAirlineFilter(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">All Airlines</option>
                  {airlineList.map((al) => (
                    <option key={al} value={al} className="bg-slate-900 text-white">
                      {al}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                👤 Direct
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
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                selectedAgencyFilter === ag.name
                  ? 'bg-blue-600 text-white shadow-sm font-bold ring-2 ring-blue-400/40'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
              <span>{ag.name === 'ALL' ? 'All Agencies / Accounts' : ag.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedAgencyFilter === ag.name ? 'bg-white text-blue-700' : 'bg-slate-700 text-slate-300'
              }`}>
                {ag.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Filter & Range Selector Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-xs">
            <CalendarRange className="w-4 h-4 text-blue-600" />
            <span>Date Filter:</span>
          </div>

          {/* Basis (Fly Date vs Request Date) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setDateField('flyDate')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                dateField === 'flyDate' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Fly Date
            </button>
            <button
              type="button"
              onClick={() => setDateField('requestDate')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                dateField === 'requestDate' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Request Date
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center space-x-1">
            {(['all', 'today', 'this_week', 'this_month', 'last_month'] as DatePreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleDatePresetChange(p)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  datePreset === p && !startDate && p === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : datePreset === p && p !== 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p === 'all' ? 'All Dates' : p === 'today' ? 'Today' : p === 'this_week' ? 'This Week' : p === 'this_month' ? 'This Month' : 'Last Month'}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {(startDate || endDate || datePreset !== 'all') && (
            <button
              type="button"
              onClick={handleClearDateFilter}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Reset date filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selected Filters Info Banner */}
      {(selectedAgencyFilter !== 'ALL' || selectedAirlineFilter !== 'ALL') && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-blue-900">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-xs font-bold block">
                Filtered View: {selectedAgencyFilter !== 'ALL' && `Agency [${selectedAgencyFilter}] `} {selectedAirlineFilter !== 'ALL' && `Airline [${selectedAirlineFilter}]`}
              </span>
              <span className="text-[10px] text-blue-600">
                Found {filteredTickets.length} matching tickets in current view.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedAgencyFilter('ALL');
              setSelectedAirlineFilter('ALL');
            }}
            className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-300 rounded-lg transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
      
      {/* Air Ticket Financial & Group Booking Performance Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Selling / Revenue */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Air Revenue</span>
            <div className="text-base font-black text-slate-900 font-mono mt-0.5">
              LKR {financialTotals.totalSelling.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">From {filteredTickets.length} tickets</span>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Total Supplier Cost */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Supplier / GDS Cost</span>
            <div className="text-base font-black text-slate-700 font-mono mt-0.5">
              LKR {financialTotals.totalCost.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Recorded net cost</span>
          </div>
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
        </div>

        {/* Calculated Net Profit & Margin */}
        <div className={`p-3 rounded-xl border shadow-2xs flex items-center justify-between ${
          financialTotals.totalProfit >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'
        }`}>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Net Profit</span>
              <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded font-mono">
                {financialTotals.margin}%
              </span>
            </div>
            <div className={`text-base font-black font-mono mt-0.5 ${
              financialTotals.totalProfit >= 0 ? 'text-emerald-800' : 'text-red-700'
            }`}>
              {financialTotals.totalProfit >= 0 ? `+LKR ${financialTotals.totalProfit.toLocaleString()}` : `LKR ${financialTotals.totalProfit.toLocaleString()}`}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">
              Margin on priced tickets
            </span>
          </div>
          <div className={`p-2 rounded-lg shrink-0 ${
            financialTotals.totalProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {financialTotals.totalProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Group Bookings KPI */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">Group Bookings</span>
            <div className="text-base font-black text-indigo-900 font-mono mt-0.5">
              {financialTotals.groupCount} <span className="text-xs font-semibold text-slate-500">Groups</span>
            </div>
            <span className="text-[10px] text-indigo-600 font-semibold">
              {financialTotals.groupPaxCount} total passengers
            </span>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Table Control Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Status Filter Badges */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onAddNewTicket}
            className="flex items-center space-x-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue / Add Ticket</span>
          </button>
        </div>

      </div>

      {/* Main Air Ticket Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-[21%]">Issued Ticket & Passenger</th>
                <th className="py-3 px-3 w-[16%]">Airline & Flight</th>
                <th className="py-3 px-3 w-[14%]">Fly Date / Return</th>
                <th className="py-3 px-3 w-[12%]">PNR / Category</th>
                <th className="py-3 px-3 w-[13%]">Current Status</th>
                <th className="py-3 px-3 w-[14%]">Financials & Profit</th>
                <th className="py-3 px-4 text-center w-[10%]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No tickets found matching current filter criteria.
                  </td>
                </tr>
              ) : isGroupedByAgency ? (
                (Object.entries(groupedTickets) as [string, TicketFollowup[]][]).map(([agencyName, agencyItems]) => (
                  <React.Fragment key={`group-ticket-${agencyName}`}>
                    <tr className="bg-slate-100 border-y-2 border-slate-300">
                      <td colSpan={7} className="py-2.5 px-3 bg-slate-100/90">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="font-extrabold text-xs uppercase tracking-wide text-slate-900">{agencyName}</span>
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                              {agencyItems.length} {agencyItems.length === 1 ? 'Ticket' : 'Tickets'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-[11px] text-slate-600 font-semibold">
                            <span>In-Progress: <strong className="text-blue-700">{agencyItems.filter(x => x.status === 'In-Progress').length}</strong></span>
                            <span>Confirmed: <strong className="text-emerald-700">{agencyItems.filter(x => x.status === 'Issued / Confirmed' || x.status === 'Approved').length}</strong></span>
                            <span>Flown: <strong className="text-purple-700">{agencyItems.filter(x => x.status === 'Flown' || x.status === 'Completed').length}</strong></span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {agencyItems.map((item) => renderTicketRow(item))}
                  </React.Fragment>
                ))
              ) : (
                filteredTickets.map((item) => renderTicketRow(item))
              )}
            </tbody>

          </table>
        </div>

        {/* Table Footer Stats */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 font-medium">
          <span>Showing {filteredTickets.length} of {tickets.length} total Air Tickets</span>
          <span>Click <strong className="text-slate-700">Details</strong> to view complete Flight Itinerary, Passengers & PNR Timeline</span>
        </div>

      </div>

    </div>
  );
};

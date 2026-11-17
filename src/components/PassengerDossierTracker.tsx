import React, { useState, useMemo } from 'react';
import { 
  TicketFollowup, 
  VisaFollowup, 
  BranchFilter, 
  BranchOffice, 
  BRANCH_CONFIG,
  CompanyProfile 
} from '../types';
import { 
  buildAllPassengerDossiers, 
  PassengerDossier, 
  matchPassport, 
  matchNameLoose,
  normalizePassport,
  normalizeName
} from '../utils/passengerTrackerHelpers';
import { getNationalityFlag } from '../data/nationalities';
import { getVisaStatusBadgeClass, getTicketStatusBadgeClass } from '../utils/helpers';
import { 
  Search, 
  UserCheck, 
  FileText, 
  Plane, 
  Calendar, 
  CreditCard, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Printer, 
  X, 
  Building2, 
  Filter,
  User,
  ArrowRight,
  Sparkles,
  FileCheck2,
  FileQuestion,
  Receipt
} from 'lucide-react';

interface PassengerDossierTrackerProps {
  visas: VisaFollowup[];
  tickets: TicketFollowup[];
  initialSearchQuery?: string;
  selectedBranchFilter?: BranchFilter;
  companyProfile?: CompanyProfile;
  onOpenVisaDetails?: (visa: VisaFollowup) => void;
  onOpenTicketDetails?: (ticket: TicketFollowup) => void;
  onAddNewVisaForPassenger?: (name: string, passport: string) => void;
  onAddNewTicketForPassenger?: (name: string, passport: string) => void;
}

export const PassengerDossierTracker: React.FC<PassengerDossierTrackerProps> = ({
  visas,
  tickets,
  initialSearchQuery = '',
  selectedBranchFilter = 'All',
  companyProfile,
  onOpenVisaDetails,
  onOpenTicketDetails,
  onAddNewVisaForPassenger,
  onAddNewTicketForPassenger,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [branchFilter, setBranchFilter] = useState<BranchFilter>(selectedBranchFilter);
  const [activeRecordFilter, setActiveRecordFilter] = useState<'ALL' | 'VISAS_ONLY' | 'TICKETS_ONLY' | 'OUTSTANDING'>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedPassengerId, setExpandedPassengerId] = useState<string | null>(null);
  const [printingDossier, setPrintingDossier] = useState<PassengerDossier | null>(null);

  // Sync if initialSearchQuery changes from parent
  React.useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Sync if selectedBranchFilter changes in header
  React.useEffect(() => {
    setBranchFilter(selectedBranchFilter);
  }, [selectedBranchFilter]);

  // Build unified dossiers across all branches
  const allDossiers = useMemo(() => {
    return buildAllPassengerDossiers(visas, tickets);
  }, [visas, tickets]);

  // Filter dossiers by search query, branch, and category
  const filteredDossiers = useMemo(() => {
    const q = searchQuery.trim();
    const cleanPass = normalizePassport(q);
    const cleanName = normalizeName(q);

    return allDossiers.filter((dossier) => {
      // Branch filter
      if (branchFilter !== 'All') {
        if (!dossier.branches.includes(branchFilter)) {
          return false;
        }
      }

      // Record type filter
      if (activeRecordFilter === 'VISAS_ONLY' && dossier.visas.length === 0) return false;
      if (activeRecordFilter === 'TICKETS_ONLY' && dossier.tickets.length === 0) return false;
      if (activeRecordFilter === 'OUTSTANDING' && dossier.outstandingBalance <= 0) return false;

      // Query filter
      if (!q) return true;

      // Match by Passport Number
      if (cleanPass.length >= 2 && matchPassport(dossier.passportNo, cleanPass)) {
        return true;
      }

      // Match by Full Name
      if (cleanName.length >= 2 && matchNameLoose(dossier.fullName, cleanName)) {
        return true;
      }

      // Also check inside visas and tickets for ticket numbers, UID, ICP
      const matchVisaDetail = dossier.visas.some(
        (v) =>
          (v.unifiedNumber && v.unifiedNumber.toUpperCase().includes(q.toUpperCase())) ||
          (v.icpFileNo && v.icpFileNo.toUpperCase().includes(q.toUpperCase()))
      );
      if (matchVisaDetail) return true;

      const matchTicketDetail = dossier.tickets.some(
        (t) =>
          (t.ticket.pnr && t.ticket.pnr.toUpperCase().includes(q.toUpperCase())) ||
          (t.ticketNo && t.ticketNo.toUpperCase().includes(q.toUpperCase()))
      );
      if (matchTicketDetail) return true;

      return false;
    });
  }, [allDossiers, searchQuery, branchFilter, activeRecordFilter]);

  // Auto-expand first result if exact query entered
  React.useEffect(() => {
    if (searchQuery.trim().length >= 3 && filteredDossiers.length > 0) {
      setExpandedPassengerId(filteredDossiers[0].id);
    }
  }, [searchQuery, filteredDossiers.length]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrintDossier = (dossier: PassengerDossier) => {
    setPrintingDossier(dossier);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      
      {/* Tracker Hero & Search Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 rounded-2xl shadow-lg border border-slate-700/80">
        <div className="max-w-4xl mx-auto space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Overall Passenger & Record Tracker</span>
                  <span className="text-[11px] bg-blue-600/40 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30 font-mono">
                    Cross-Branch Database
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Track any traveler by <strong>Full Name</strong> or <strong>Passport Number</strong>. If any historical visas or air tickets exist, they will be instantly displayed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-mono font-bold">
                Total Dossiers: <span className="text-blue-400 font-black">{allDossiers.length}</span>
              </span>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-blue-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Traveler Full Name OR Passport Number (e.g. MOHAMED, N1234567, RASIKA)..."
              className="w-full pl-12 pr-10 py-3.5 bg-slate-950/90 text-white placeholder-slate-400 rounded-xl border-2 border-blue-500/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium transition-all shadow-inner"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            {/* Branch Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-700/60">
              <span className="text-[11px] text-slate-400 px-2 font-semibold">Branch:</span>
              <button
                onClick={() => setBranchFilter('All')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  branchFilter === 'All' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Branches
              </button>
              <button
                onClick={() => setBranchFilter('Dubai')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  branchFilter === 'Dubai' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇦🇪 Dubai
              </button>
              <button
                onClick={() => setBranchFilter('Negombo')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  branchFilter === 'Negombo' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇱🇰 Negombo
              </button>
            </div>

            {/* Record type filter */}
            <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setActiveRecordFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeRecordFilter === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Records
              </button>
              <button
                onClick={() => setActiveRecordFilter('VISAS_ONLY')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeRecordFilter === 'VISAS_ONLY' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Has Visas
              </button>
              <button
                onClick={() => setActiveRecordFilter('TICKETS_ONLY')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeRecordFilter === 'TICKETS_ONLY' ? 'bg-blue-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Has Air Tickets
              </button>
              <button
                onClick={() => setActiveRecordFilter('OUTSTANDING')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeRecordFilter === 'OUTSTANDING' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Payment Due
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Tracked Results</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {filteredDossiers.length} passenger{filteredDossiers.length === 1 ? '' : 's'}
            </span>
            {searchQuery && (
              <span className="text-xs text-slate-500 font-normal">
                matching "{searchQuery}"
              </span>
            )}
          </h3>
        </div>
      </div>

      {/* Empty State / Not Found Alert */}
      {filteredDossiers.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <FileQuestion className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              {searchQuery ? `No Existing Records Found for "${searchQuery}"` : 'No Passenger Records in this Filter'}
            </h4>
            <p className="text-xs text-slate-500">
              {searchQuery 
                ? 'Neither visas nor flight tickets have been recorded under this name or passport number. You can register a brand new visa or ticket below.'
                : 'Try clearing filters or search by a passenger name or passport number above.'}
            </p>
          </div>

          {searchQuery && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onAddNewVisaForPassenger?.(searchQuery, searchQuery.match(/^[A-Z0-9]{5,10}$/i) ? searchQuery : '')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Register New Visa for "{searchQuery}"</span>
              </button>

              <button
                onClick={() => onAddNewTicketForPassenger?.(searchQuery, searchQuery.match(/^[A-Z0-9]{5,10}$/i) ? searchQuery : '')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Plane className="w-4 h-4" />
                <span>+ Issue Air Ticket for "{searchQuery}"</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Passenger Dossiers List */}
      <div className="space-y-4">
        {filteredDossiers.map((dossier) => {
          const isExpanded = expandedPassengerId === dossier.id || filteredDossiers.length === 1;
          const flag = getNationalityFlag(dossier.nationality || 'SRI LANKAN');

          return (
            <div
              key={dossier.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                isExpanded ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              
              {/* Dossier Header Card */}
              <div 
                onClick={() => setExpandedPassengerId(isExpanded ? null : dossier.id)}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                {/* Left: Passenger Profile Info */}
                <div className="flex items-start space-x-3.5">
                  {/* Photo or Avatar */}
                  <div className="relative shrink-0">
                    {dossier.photoAttachment ? (
                      <img
                        src={dossier.photoAttachment}
                        alt={dossier.fullName}
                        className="w-13 h-13 rounded-xl object-cover border border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-xs">
                        {dossier.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 text-sm drop-shadow" title={dossier.nationality}>
                      {flag}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-black text-slate-900 tracking-tight">
                        {dossier.fullName}
                      </h4>

                      {/* Passport Number pill with copy button */}
                      {dossier.passportNo ? (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(dossier.passportNo, `p-${dossier.id}`);
                          }}
                          className="flex items-center space-x-1 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-mono font-bold hover:bg-blue-100 transition-colors"
                          title="Click to copy passport number"
                        >
                          <span>Passport:</span>
                          <span className="text-blue-700 font-black">{dossier.passportNo}</span>
                          {copiedKey === `p-${dossier.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-blue-400" />
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No passport recorded</span>
                      )}

                      {/* Branches */}
                      {dossier.branches.map((b) => (
                        <span
                          key={b}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            b === 'Dubai'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {b === 'Dubai' ? '🇦🇪 Dubai Branch' : '🇱🇰 Negombo Branch'}
                        </span>
                      ))}
                    </div>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {dossier.nationality && (
                        <span>Nationality: <strong className="text-slate-700">{dossier.nationality}</strong></span>
                      )}
                      {dossier.passportExpiry && (
                        <span>
                          Passport Expiry: <strong className="text-slate-700 font-mono">{dossier.passportExpiry}</strong>
                        </span>
                      )}
                      {dossier.dob && (
                        <span>DOB: <strong className="text-slate-700 font-mono">{dossier.dob}</strong></span>
                      )}
                      {dossier.unifiedNumber && (
                        <span>UID: <strong className="text-blue-700 font-mono">{dossier.unifiedNumber}</strong></span>
                      )}
                      {dossier.agencyOrCustomer && (
                        <span>Agency / Sponsor: <strong className="text-slate-700">{dossier.agencyOrCustomer}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Record counts & Balance Snapshot */}
                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center space-x-2">
                    {/* Visas count badge */}
                    <div 
                      className={`px-3 py-1.5 rounded-xl border text-center transition-all ${
                        dossier.visas.length > 0 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider">Visas</div>
                      <div className="text-sm font-black">{dossier.visas.length}</div>
                    </div>

                    {/* Tickets count badge */}
                    <div 
                      className={`px-3 py-1.5 rounded-xl border text-center transition-all ${
                        dossier.tickets.length > 0 
                          ? 'bg-blue-50 border-blue-200 text-blue-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider">Tickets</div>
                      <div className="text-sm font-black">{dossier.tickets.length}</div>
                    </div>
                  </div>

                  {/* Payment status badge */}
                  {dossier.outstandingBalance > 0 ? (
                    <div className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-right">
                      <div className="text-[10px] font-semibold text-amber-700">Balance Due</div>
                      <div className="text-xs font-black text-amber-800">
                        {dossier.outstandingBalance.toLocaleString()} {dossier.branches.includes('Dubai') ? 'AED' : 'LKR'}
                      </div>
                    </div>
                  ) : dossier.totalSpent > 0 ? (
                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-right">
                      <div className="text-[10px] font-semibold text-emerald-600">Payment Status</div>
                      <div className="text-xs font-black text-emerald-700">All Settled ✓</div>
                    </div>
                  ) : null}

                  {/* Toggle Arrow */}
                  <div className="text-slate-400 hover:text-slate-600 p-1">
                    <ArrowRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-blue-600' : ''}`} />
                  </div>
                </div>
              </div>

              {/* Expanded Detailed Records Section */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-6 space-y-6">
                  
                  {/* Quick Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Existing Records for {dossier.fullName}:</span>
                      <span className="text-slate-500 font-normal">
                        ({dossier.visas.length} Visa{dossier.visas.length === 1 ? '' : 's'}, {dossier.tickets.length} Flight Ticket{dossier.tickets.length === 1 ? '' : 's'})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onAddNewVisaForPassenger?.(dossier.fullName, dossier.passportNo)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
                        title="Add another visa for this passenger"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ New Visa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onAddNewTicketForPassenger?.(dossier.fullName, dossier.passportNo)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
                        title="Issue another flight ticket for this passenger"
                      >
                        <Plane className="w-3.5 h-3.5" />
                        <span>+ New Ticket</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintDossier(dossier)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-colors flex items-center space-x-1 cursor-pointer"
                        title="Print passenger history dossier"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Print Dossier</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. VISAS SECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Existing Visa Applications ({dossier.visas.length})</span>
                      </h5>
                    </div>

                    {dossier.visas.length === 0 ? (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                        No previous visa applications on record for this passenger.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {dossier.visas.map((v) => (
                          <div
                            key={v.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all space-y-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  v.branch === 'Dubai' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-blue-800 border-blue-300'
                                }`}>
                                  {v.branch === 'Dubai' ? '🇦🇪 Dubai Branch' : '🇱🇰 Negombo Branch'}
                                </span>

                                <span className="text-sm font-bold text-slate-900">
                                  {v.visaCategory}
                                </span>

                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getVisaStatusBadgeClass(v.status)}`}>
                                  {v.status}
                                </span>

                                {v.isGroup && (
                                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                                    Group: {v.groupName || 'Group Application'}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => onOpenVisaDetails?.(v)}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg border border-emerald-200 flex items-center space-x-1 cursor-pointer transition-colors"
                              >
                                <span>View Full Visa Details</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Submission Date:</span>
                                <span className="font-semibold text-slate-800">{v.submissionDate || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Entry Date:</span>
                                <span className="font-semibold text-slate-800">{v.entryDate || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Expiry Date:</span>
                                <span className="font-semibold text-rose-700 font-mono">{v.expiryDate || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Customer / Agency:</span>
                                <span className="font-semibold text-slate-800 truncate block">{v.customer || 'Direct'}</span>
                              </div>
                              {v.icpFileNo && (
                                <div>
                                  <span className="text-slate-400 block text-[10px]">ICP File No:</span>
                                  <span className="font-mono font-bold text-slate-700">{v.icpFileNo}</span>
                                </div>
                              )}
                              {v.unifiedNumber && (
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Unified Number (UID):</span>
                                  <span className="font-mono font-bold text-blue-700">{v.unifiedNumber}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-slate-400 block text-[10px]">Selling Price:</span>
                                <span className="font-bold text-slate-900">
                                  {v.sellingPrice ? `${v.sellingPrice} ${v.currency || 'AED'}` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Payment Status:</span>
                                <span className={`font-bold ${v.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {v.paymentStatus || 'Pending'}
                                </span>
                              </div>
                            </div>

                            {/* Attached documents indicator */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                              {v.passportAttachment && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                                  <FileCheck2 className="w-3 h-3" /> Passport Attached
                                </span>
                              )}
                              {v.visaAttachment && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                                  <FileCheck2 className="w-3 h-3" /> Visa Doc Attached
                                </span>
                              )}
                              {v.photoAttachment && (
                                <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded flex items-center gap-1">
                                  <FileCheck2 className="w-3 h-3" /> Photo Attached
                                </span>
                              )}
                              {v.remarks && (
                                <span className="text-slate-600 truncate max-w-md">
                                  Remarks: {v.remarks}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. AIR TICKETS SECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Plane className="w-4 h-4 text-blue-600" />
                        <span>Existing Air Ticket Bookings ({dossier.tickets.length})</span>
                      </h5>
                    </div>

                    {dossier.tickets.length === 0 ? (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                        No previous air ticket bookings on record for this passenger.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {dossier.tickets.map(({ ticket: t, travelerName, ticketNo }, idx) => (
                          <div
                            key={`${t.id}-${idx}`}
                            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all space-y-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  t.branch === 'Dubai' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-blue-800 border-blue-300'
                                }`}>
                                  {t.branch === 'Dubai' ? '🇦🇪 Dubai Branch' : '🇱🇰 Negombo Branch'}
                                </span>

                                <span className="text-sm font-bold text-slate-900">
                                  {t.airline || 'Airline Flight'} - {t.flightNo || ''}
                                </span>

                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getTicketStatusBadgeClass(t.status)}`}>
                                  {t.status}
                                </span>

                                {t.pnr && (
                                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                    PNR: {t.pnr}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => onOpenTicketDetails?.(t)}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg border border-blue-200 flex items-center space-x-1 cursor-pointer transition-colors"
                              >
                                <span>View Full Ticket Details</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Route:</span>
                                <span className="font-bold text-blue-800">
                                  {t.departureLocation || 'CMB'} ➔ {t.arrivalLocation || 'DXB'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Fly Date:</span>
                                <span className="font-semibold text-slate-800">{t.flyDate || t.requestDate || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Return Date:</span>
                                <span className="font-semibold text-slate-800">{t.returnDate || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Ticket Number:</span>
                                <span className="font-mono font-bold text-slate-800">{ticketNo || t.tickets?.[0] || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Customer / Agency:</span>
                                <span className="font-semibold text-slate-800 truncate block">{t.customer || 'Direct'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Trip & Class:</span>
                                <span className="font-semibold text-slate-800">{t.tripType || 'One Way'} ({t.cabinClass || 'Economy'})</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Selling Price:</span>
                                <span className="font-bold text-slate-900">
                                  {t.sellingPrice ? `${t.sellingPrice} ${t.currency || 'LKR'}` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Payment Status:</span>
                                <span className={`font-bold ${t.paymentStatus === 'Paid' || t.paymentStatus === 'Fully Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {t.paymentStatus || 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Hidden Print Container for Dossier Printing */}
      {printingDossier && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 text-black z-50">
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black">{companyProfile?.companyName || 'Seagull Global'}</h1>
              <p className="text-xs text-slate-600">Official Passenger & Travel Dossier Verification</p>
            </div>
            <div className="text-right text-xs">
              <div>Printed on: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}</div>
              <div className="font-bold text-blue-800">Passport: {printingDossier.passportNo || 'N/A'}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-100 p-4 rounded-lg">
              <h2 className="text-lg font-bold">{printingDossier.fullName}</h2>
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                <div>Passport No: <strong>{printingDossier.passportNo || 'N/A'}</strong></div>
                <div>Nationality: <strong>{printingDossier.nationality || 'SRI LANKAN'}</strong></div>
                <div>Passport Expiry: <strong>{printingDossier.passportExpiry || 'N/A'}</strong></div>
                <div>DOB: <strong>{printingDossier.dob || 'N/A'}</strong></div>
                <div>Unified No: <strong>{printingDossier.unifiedNumber || 'N/A'}</strong></div>
                <div>Total Records: <strong>{printingDossier.visas.length} Visas, {printingDossier.tickets.length} Tickets</strong></div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm border-b pb-1">Visa Applications ({printingDossier.visas.length})</h3>
              {printingDossier.visas.map((v, i) => (
                <div key={i} className="text-xs border p-2 rounded">
                  <div className="font-bold">{v.visaCategory} - {v.status} ({v.branch || 'Branch'})</div>
                  <div>Submitted: {v.submissionDate} | Expiry: {v.expiryDate || 'N/A'} | Price: {v.sellingPrice} {v.currency}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm border-b pb-1">Air Ticket Bookings ({printingDossier.tickets.length})</h3>
              {printingDossier.tickets.map((t, i) => (
                <div key={i} className="text-xs border p-2 rounded">
                  <div className="font-bold">{t.ticket.airline} {t.ticket.flightNo} - PNR: {t.ticket.pnr} ({t.ticket.status})</div>
                  <div>Route: {t.ticket.departureLocation} ➔ {t.ticket.arrivalLocation} | Fly Date: {t.ticket.flyDate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

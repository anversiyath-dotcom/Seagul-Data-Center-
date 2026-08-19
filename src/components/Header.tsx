import React from 'react';
import { Plane, FileText, LayoutDashboard, Plus, Search, ArrowRightLeft, LogOut, User, Building2 } from 'lucide-react';
import { SeagullLogo } from './SeagullLogo';
import { CompanyProfile } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'tickets' | 'visas';
  setActiveTab: (tab: 'dashboard' | 'tickets' | 'visas') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddTicket: () => void;
  onAddVisa: () => void;
  onResetData?: () => void;
  ticketCount: number;
  visaCount: number;
  onLogout?: () => void;
  onOpenCompanySettings?: () => void;
  companyProfile?: CompanyProfile;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  onAddTicket,
  onAddVisa,
  onResetData,
  ticketCount,
  visaCount,
  onLogout,
  onOpenCompanySettings,
  companyProfile
}) => {

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-white p-1 rounded-xl shadow-md">
              <SeagullLogo size="sm" variant="full" />
            </div>
            <div className="hidden md:block pl-2 border-l border-slate-700">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>Travel & Visa Followup</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-400/30 font-mono">
                  Pro v2.4
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'tickets'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Air Tickets Followup</span>
              <span className="bg-slate-900/60 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {ticketCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('visas')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'visas'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Visa Followup</span>
              <span className="bg-slate-900/60 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {visaCount}
              </span>
            </button>
          </nav>

          {/* Global Search & Action Buttons */}
          <div className="flex items-center space-x-2">
            <div className="relative hidden md:block w-48 lg:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket, PNR, passport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={onAddTicket}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors shadow-sm"
                title="Add Ticket Reissue or Refund Followup"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">+ Ticket</span>
              </button>

              <button
                onClick={onAddVisa}
                className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
                title="Add Visa Application Entry"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Visa</span>
              </button>

              {onOpenCompanySettings && (
                <button
                  onClick={onOpenCompanySettings}
                  className="flex items-center space-x-1 bg-blue-900/70 hover:bg-blue-800 text-blue-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-blue-700/60 transition-colors shadow-sm cursor-pointer"
                  title="Configure Company Details & Database"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden md:inline">{companyProfile?.companyName || 'Company Settings'}</span>
                </button>
              )}

              {onLogout && (
                <div className="flex items-center pl-2 ml-1 border-l border-slate-700 space-x-2">
                  <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800 border border-slate-700/80 px-2 py-1 rounded-lg text-xs">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-slate-200">Seagulg</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="flex items-center space-x-1 bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-800/60 transition-colors cursor-pointer"
                    title="Sign Out of Application"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

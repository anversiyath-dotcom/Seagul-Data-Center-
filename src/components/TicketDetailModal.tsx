import React, { useState, useEffect } from 'react';
import { TicketFollowup, CompanyProfile } from '../types';
import { 
  X, User, Truck, Calendar, Ticket, DollarSign, Clock, 
  CheckCircle2, Info, Plane, Eye, EyeOff, Edit3, Check, Printer, MapPin, Luggage, Save, Trash2,
  Paperclip, FileText, ExternalLink, Users, FileCheck, PlaneTakeoff, PlaneLanding, Repeat, ArrowRight
} from 'lucide-react';
import { formatLKR } from '../utils/helpers';
import { TicketLetterheadPrint } from './TicketLetterheadPrint';

interface TicketDetailModalProps {
  ticket: TicketFollowup | null;
  onClose: () => void;
  onUpdateTicket: (updated: TicketFollowup) => void;
  onEditTicket?: (ticket: TicketFollowup) => void;
  onDeleteTicket?: (id: string) => void;
  companyProfile?: CompanyProfile;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onUpdateTicket,
  onEditTicket,
  onDeleteTicket,
  companyProfile
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'letterhead'>('details');
  const [hideCustomer, setHideCustomer] = useState(ticket?.hideCustomer ?? false);
  const [hideSupplier, setHideSupplier] = useState(ticket?.hideSupplier ?? true);
  const [hideRefundable, setHideRefundable] = useState(ticket?.hideRefundable ?? false);

  const [isEditingReason, setIsEditingReason] = useState(false);
  const [refundReasonText, setRefundReasonText] = useState(ticket?.refundReason || '');
  const [showTicketDocPreview, setShowTicketDocPreview] = useState(false);

  const [isEditingFlight, setIsEditingFlight] = useState(false);
  const [editAirline, setEditAirline] = useState(ticket?.airline || 'SriLankan Airlines');
  const [editFlightNo, setEditFlightNo] = useState(ticket?.flightNo || 'UL 225');
  const [editReturnFlightNo, setEditReturnFlightNo] = useState(ticket?.returnFlightNo || (ticket?.flightNo ? ticket.flightNo.replace(/\d+/, (m) => String(Number(m) + 1)) : 'UL 226'));
  const [editDepartureTime, setEditDepartureTime] = useState(ticket?.departureTime || '10:30 AM');
  const [editArrivalTime, setEditArrivalTime] = useState(ticket?.arrivalTime || '02:45 PM');
  const [editReturnDepartureTime, setEditReturnDepartureTime] = useState(ticket?.returnDepartureTime || '06:20 PM');
  const [editReturnArrivalTime, setEditReturnArrivalTime] = useState(ticket?.returnArrivalTime || '10:45 PM');
  const [editFlyDate, setEditFlyDate] = useState(ticket?.flyDate || '25/08/2026');
  const [editReturnDate, setEditReturnDate] = useState(ticket?.returnDate || 'N/A');
  const [editDeparture, setEditDeparture] = useState(ticket?.departureLocation || 'Colombo (CMB)');
  const [editArrival, setEditArrival] = useState(ticket?.arrivalLocation || 'Dubai (DXB)');
  const [editBaggage, setEditBaggage] = useState(ticket?.baggageAllowance || '30 Kg');

  useEffect(() => {
    if (ticket) {
      setHideCustomer(ticket.hideCustomer ?? false);
      setHideSupplier(ticket.hideSupplier ?? true);
      setHideRefundable(ticket.hideRefundable ?? false);
      setRefundReasonText(ticket.refundReason || '');
      setEditAirline(ticket.airline || 'SriLankan Airlines');
      setEditFlightNo(ticket.flightNo || 'UL 225');
      setEditReturnFlightNo(ticket.returnFlightNo || (ticket.flightNo ? ticket.flightNo.replace(/\d+/, (m) => String(Number(m) + 1)) : 'UL 226'));
      setEditDepartureTime(ticket.departureTime || '10:30 AM');
      setEditArrivalTime(ticket.arrivalTime || '02:45 PM');
      setEditReturnDepartureTime(ticket.returnDepartureTime || '06:20 PM');
      setEditReturnArrivalTime(ticket.returnArrivalTime || '10:45 PM');
      setEditFlyDate(ticket.flyDate || '25/08/2026');
      setEditReturnDate(ticket.returnDate || 'N/A');
      setEditDeparture(ticket.departureLocation || 'Colombo (CMB)');
      setEditArrival(ticket.arrivalLocation || 'Dubai (DXB)');
      setEditBaggage(ticket.baggageAllowance || '30 Kg');
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleSaveReason = () => {
    setIsEditingReason(false);
    onUpdateTicket({
      ...ticket,
      refundReason: refundReasonText
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenPrintWindow = () => {
    const letterheadEl = document.getElementById('printable-letterhead');
    if (!letterheadEl) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=1100');
    if (printWin) {
      // Safely clone without corrupting overflow-hidden or other compounds
      const cleanHtml = letterheadEl.outerHTML.replace(/\bhidden\b/g, '').replace(/\bprint:block\b/g, '');

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>SEAGULL GLOBAL - Air Ticket ${ticket.pnr || ''}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                @page { size: A4 portrait; margin: 6mm 8mm 6mm 8mm; }
                html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; height: 100% !important; overflow: hidden !important; }
                .no-print { display: none !important; }
                #printable-letterhead { page-break-inside: avoid !important; break-inside: avoid !important; box-shadow: none !important; border: none !important; }
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
            <div style="width: 100%; max-width: 860px;">
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
  const handleSaveFlightDetails = () => {
    setIsEditingFlight(false);
    const updatedTicket: TicketFollowup = {
      ...ticket,
      airline: editAirline,
      flightNo: editFlightNo,
      returnFlightNo: editReturnFlightNo,
      departureTime: editDepartureTime,
      arrivalTime: editArrivalTime,
      returnDepartureTime: editReturnDepartureTime,
      returnArrivalTime: editReturnArrivalTime,
      flyDate: editFlyDate,
      returnDate: editReturnDate,
      departureLocation: editDeparture,
      arrivalLocation: editArrival,
      baggageAllowance: editBaggage,
      itinerary: [
        {
          id: ticket.itinerary[0]?.id || `itin-${Date.now()}`,
          route: `${editDeparture} → ${editArrival}`,
          flightNo: editFlightNo,
          dateTime: `${editFlyDate} ${editDepartureTime || '10:00'}`
        }
      ]
    };
    onUpdateTicket(updatedTicket);
  };

  const handleToggleTimelineStep = (stepId: string) => {
    const updatedTimeline = ticket.timeline.map((st) => {
      if (st.id === stepId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    const allCompleted = updatedTimeline.every((st) => st.completed);
    const newStatus = allCompleted ? 'Completed' : 'In-Progress';

    onUpdateTicket({
      ...ticket,
      timeline: updatedTimeline,
      status: newStatus
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#F8FAFC] w-full max-w-5xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col my-auto">
        
        {/* Modal Top Close Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30 font-mono">
              PNR: {ticket.pnr}
            </span>
            
            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'details'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ticket Details</span>
              </button>
              <button
                onClick={() => setActiveTab('letterhead')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'letterhead'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Letterhead Print Preview</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onEditTicket && (
              <button
                onClick={() => {
                  onClose();
                  onEditTicket(ticket);
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Edit Full Air Ticket Record"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            {onDeleteTicket && (
              <button
                onClick={() => {
                  onClose();
                  onDeleteTicket(ticket.id);
                }}
                className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer border border-red-500/30"
                title="Delete Air Ticket Record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Print Official Letterhead Ticket"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Letterhead</span>
            </button>
            <button
              onClick={handleOpenPrintWindow}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Open in new window to print or save PDF"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Print Tab</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">

          {/* HIDDEN PRINT CONTAINER (ALWAYS RENDERED FOR WINDOW.PRINT) */}
          <div className="hidden print:block">
            <TicketLetterheadPrint 
              ticket={ticket} 
              hideCustomer={hideCustomer} 
              hideSupplier={hideSupplier} 
              hideRefundable={hideRefundable} 
              companyProfile={companyProfile}
            />
          </div>

          {activeTab === 'letterhead' ? (
            /* LETTERHEAD PREVIEW MODE */
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl flex items-center justify-between text-xs font-medium">
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Official Letterhead Preview Mode:</strong> This matches the official <strong>Seagull Global</strong> letterhead format for printing or saving as PDF.
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Letterhead</span>
                  </button>
                  <button
                    onClick={handleOpenPrintWindow}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Print Tab</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-200 p-4 sm:p-6 rounded-2xl overflow-x-auto shadow-inner">
                <TicketLetterheadPrint 
                  ticket={ticket} 
                  hideCustomer={hideCustomer} 
                  hideSupplier={hideSupplier} 
                  hideRefundable={hideRefundable} 
                  companyProfile={companyProfile}
                />
              </div>
            </div>
          ) : (
            /* REGULAR TICKET DETAILS MODE */
            <>

          {/* Header Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Card 1: CUSTOMER / AGENCY */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[90px]">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="flex items-center space-x-1.5">
                  <div className="p-1 rounded bg-blue-50 text-blue-600">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span>{ticket.customerType === 'Customer' ? 'DIRECT CUSTOMER' : 'PRIMARY AGENCY'}</span>
                </div>
                <button
                  onClick={() => setHideCustomer(!hideCustomer)}
                  className="text-blue-600 hover:text-blue-800 font-bold text-[10px] cursor-pointer"
                >
                  {hideCustomer ? 'SHOW' : 'HIDE'}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 gap-1">
                <div className="text-sm font-extrabold text-slate-900 truncate">
                  {hideCustomer ? '••••••••' : ticket.customer}
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                  ticket.customerType === 'Customer' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {ticket.customerType === 'Customer' ? 'B2C' : 'B2B Agency'}
                </span>
              </div>
            </div>

            {/* Card 2: SUPPLIER */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[90px]">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="flex items-center space-x-1.5">
                  <div className="p-1 rounded bg-purple-50 text-purple-600">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span>GDS / SUPPLIER</span>
                </div>
                <button
                  onClick={() => setHideSupplier(!hideSupplier)}
                  className="text-blue-600 hover:text-blue-800 font-bold text-[10px] cursor-pointer"
                >
                  {hideSupplier ? 'SHOW' : 'HIDE'}
                </button>
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-2 truncate">
                {hideSupplier ? '••••••••' : ticket.supplier}
              </div>
            </div>

            {/* Card 3: FLY DATE */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[90px]">
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="p-1 rounded bg-emerald-50 text-emerald-600">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span>FLY DATE</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-2 font-mono">
                {ticket.flyDate || ticket.requestDate}
              </div>
            </div>

            {/* Card 4: PNR */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[90px]">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="flex items-center space-x-1.5">
                  <div className="p-1 rounded bg-blue-50 text-blue-600">
                    <Ticket className="w-3.5 h-3.5" />
                  </div>
                  <span>PNR REF</span>
                </div>
                {ticket.isGroupBooking && (
                  <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    <span>GROUP</span>
                  </span>
                )}
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-2 font-mono tracking-widest flex items-center justify-between">
                <span>{ticket.pnr}</span>
              </div>
            </div>

            {/* Card 5: Total Fare / Refundable Card */}
            <div className="bg-[#0A1128] text-white p-3.5 rounded-xl shadow-lg border border-slate-800 flex flex-col justify-between col-span-1 sm:col-span-2 lg:col-span-1 min-h-[110px]">
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3 text-blue-400" />
                    <span>TOTAL FARE / QUOTE</span>
                  </div>
                  <button
                    onClick={() => setHideRefundable(!hideRefundable)}
                    className="text-slate-400 hover:text-white font-bold text-[9px] cursor-pointer"
                  >
                    {hideRefundable ? 'SHOW' : 'HIDE'}
                  </button>
                </div>
                <div className="text-xl font-black tracking-tight text-white mt-1">
                  {hideRefundable ? '••••••••' : (ticket.quote || formatLKR(ticket.totalRefundable))}
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-1.5 mt-2 text-[10px] space-y-0.5">
                <div className="flex justify-between text-slate-300">
                  <span>REFUND / FARE</span>
                  <span className="font-mono">{formatLKR(ticket.refundAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SERVICE FEE</span>
                  <span className="font-mono">{formatLKR(ticket.serviceFee)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Main 2-Column Split Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left Column: Flight Details & Itinerary */}
            <div className="space-y-5">
              
              {/* Card 1: FLIGHT & ROUTE TRACKING CARD */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <Plane className="w-4.5 h-4.5 text-blue-600" />
                    <span>Flight & Route Tracking</span>
                  </div>
                  {!isEditingFlight ? (
                    <button
                      onClick={() => setIsEditingFlight(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Details
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveFlightDetails}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Flight
                    </button>
                  )}
                </div>

                {!isEditingFlight ? (
                  <div className="space-y-3">
                    {/* Cabin & Trip Type Header */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded uppercase">
                          {ticket.tripType || 'Round Trip'}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {ticket.cabinClass || 'Economy'} Class
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                        <Luggage className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Baggage: {ticket.baggageAllowance || '30 Kg'}</span>
                      </div>
                    </div>

                    {(ticket.tripType === 'Round Trip' || (ticket.returnDate && ticket.returnDate !== 'N/A' && ticket.returnDate.trim() !== '')) ? (
                      /* ROUND TRIP - 2 SEPARATE CARDS */
                      <div className="space-y-2.5">
                        {/* Sector 1: Outbound */}
                        <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/80 space-y-2">
                          <div className="flex items-center justify-between border-b border-blue-200/60 pb-1">
                            <div className="flex items-center space-x-1.5 text-blue-900 font-extrabold text-[11px] uppercase">
                              <PlaneTakeoff className="w-3.5 h-3.5 text-blue-600" />
                              <span>Sector 1 • Outbound Flight</span>
                            </div>
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {ticket.flyDate || ticket.requestDate}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                              <span>{ticket.departureLocation || 'Colombo (CMB)'}</span>
                              <ArrowRight className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{ticket.arrivalLocation || 'Dubai (DXB)'}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-700">
                              <span>{ticket.airline || 'SriLankan Airlines'} </span>
                              <span className="font-mono font-bold bg-blue-200/80 text-blue-900 px-1 rounded text-[11px]">
                                {ticket.flightNo || 'UL 225'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-blue-100 text-[11px] font-mono text-blue-900">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>Time: {ticket.departureTime ? `Dep ${ticket.departureTime}` : 'Dep 10:30 AM'} • {ticket.arrivalTime ? `Arr ${ticket.arrivalTime}` : 'Arr 02:45 PM'}</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Confirmed</span>
                          </div>
                        </div>

                        {/* Sector 2: Inbound / Return */}
                        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-2">
                          <div className="flex items-center justify-between border-b border-amber-200/60 pb-1">
                            <div className="flex items-center space-x-1.5 text-amber-900 font-extrabold text-[11px] uppercase">
                              <PlaneLanding className="w-3.5 h-3.5 text-amber-600" />
                              <span>Sector 2 • Return Flight</span>
                            </div>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              {ticket.returnDate || '10/09/2026'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                              <span>{ticket.arrivalLocation || 'Dubai (DXB)'}</span>
                              <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{ticket.departureLocation || 'Colombo (CMB)'}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-700">
                              <span>{ticket.returnAirline || ticket.airline || 'SriLankan Airlines'} </span>
                              <span className="font-mono font-bold bg-amber-200/80 text-amber-900 px-1 rounded text-[11px]">
                                {ticket.returnFlightNo || (ticket.flightNo ? ticket.flightNo.replace(/\d+/, (m) => String(Number(m) + 1)) : 'UL 226')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-amber-100 text-[11px] font-mono text-amber-900">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Time: {ticket.returnDepartureTime ? `Dep ${ticket.returnDepartureTime}` : 'Dep 06:20 PM'} • {ticket.returnArrivalTime ? `Arr ${ticket.returnArrivalTime}` : 'Arr 10:45 PM'}</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Confirmed</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ONE WAY SINGLE CARD */
                      <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-blue-800 font-bold uppercase block">DEPARTURE (ORIGIN)</span>
                            <span className="text-xs font-black text-slate-900 block">{ticket.departureLocation || 'Colombo (CMB)'}</span>
                            <span className="text-[11px] font-mono text-emerald-700 font-bold mt-1 block">
                              Fly: {ticket.flyDate || ticket.requestDate}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-blue-800 font-bold uppercase block">ARRIVAL (DESTINATION)</span>
                            <span className="text-xs font-black text-slate-900 block">{ticket.arrivalLocation || 'Dubai (DXB)'}</span>
                            <span className="text-[11px] font-mono text-slate-600 font-bold mt-1 block">
                              Flight: {ticket.airline} {ticket.flightNo}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-blue-100 text-[11px] font-mono text-blue-900">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Time: {ticket.departureTime ? `Dep ${ticket.departureTime}` : 'Dep 10:30 AM'} • {ticket.arrivalTime ? `Arr ${ticket.arrivalTime}` : 'Arr 02:45 PM'}</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {ticket.specialRequests && (
                      <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-lg font-semibold">
                        <strong>Special Requests:</strong> {ticket.specialRequests}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Airline</label>
                        <input
                          type="text"
                          value={editAirline}
                          onChange={(e) => setEditAirline(e.target.value)}
                          className="w-full border p-1.5 rounded font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Flight No</label>
                        <input
                          type="text"
                          value={editFlightNo}
                          onChange={(e) => setEditFlightNo(e.target.value)}
                          className="w-full border p-1.5 rounded font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Return Flight No</label>
                        <input
                          type="text"
                          value={editReturnFlightNo}
                          onChange={(e) => setEditReturnFlightNo(e.target.value)}
                          className="w-full border p-1.5 rounded font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Departure Location</label>
                        <input
                          type="text"
                          value={editDeparture}
                          onChange={(e) => setEditDeparture(e.target.value)}
                          className="w-full border p-1.5 rounded font-medium text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Arrival Location</label>
                        <input
                          type="text"
                          value={editArrival}
                          onChange={(e) => setEditArrival(e.target.value)}
                          className="w-full border p-1.5 rounded font-medium text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Dep Date</label>
                        <input
                          type="text"
                          value={editFlyDate}
                          onChange={(e) => setEditFlyDate(e.target.value)}
                          className="w-full border p-1.5 rounded font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Dep Time</label>
                        <input
                          type="text"
                          value={editDepartureTime}
                          onChange={(e) => setEditDepartureTime(e.target.value)}
                          placeholder="10:30 AM"
                          className="w-full border p-1.5 rounded font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Arr Time</label>
                        <input
                          type="text"
                          value={editArrivalTime}
                          onChange={(e) => setEditArrivalTime(e.target.value)}
                          placeholder="02:45 PM"
                          className="w-full border p-1.5 rounded font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Baggage</label>
                        <input
                          type="text"
                          value={editBaggage}
                          onChange={(e) => setEditBaggage(e.target.value)}
                          className="w-full border p-1.5 rounded font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Return Date</label>
                        <input
                          type="text"
                          value={editReturnDate}
                          onChange={(e) => setEditReturnDate(e.target.value)}
                          className="w-full border p-1.5 rounded font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Return Dep Time</label>
                        <input
                          type="text"
                          value={editReturnDepartureTime}
                          onChange={(e) => setEditReturnDepartureTime(e.target.value)}
                          placeholder="06:20 PM"
                          className="w-full border p-1.5 rounded font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Return Arr Time</label>
                        <input
                          type="text"
                          value={editReturnArrivalTime}
                          onChange={(e) => setEditReturnArrivalTime(e.target.value)}
                          placeholder="10:45 PM"
                          className="w-full border p-1.5 rounded font-mono text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Card 2: PROCESSING TIMELINE */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2 text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      TICKET TIMELINE & STATUS
                    </h3>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1 ${
                    ticket.status === 'Completed' || ticket.status === 'Issued / Confirmed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {ticket.status.toUpperCase()}
                  </span>
                </div>

                {/* Vertical Step Timeline */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {ticket.timeline.map((step) => (
                    <div
                      key={step.id}
                      onClick={() => handleToggleTimelineStep(step.id)}
                      className="relative cursor-pointer group"
                    >
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white transition-all ${
                        step.completed
                          ? step.title === 'COMPLETED' || step.title === 'ISSUED' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-blue-600 ring-4 ring-blue-100'
                          : 'bg-slate-300 group-hover:bg-slate-400'
                      }`}>
                        {step.completed ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs font-bold tracking-wider uppercase ${
                            step.completed ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {step.date || 'Pending update'}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to toggle
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: PASSENGERS & COMMENTS */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2 text-slate-500">
                    <User className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      PASSENGERS & TICKET NOS
                    </h3>
                  </div>
                  <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded border border-blue-200 uppercase">
                    {ticket.airline || 'SriLankan Airlines'}
                  </span>
                </div>

                {/* TRAVELERS LIST */}
                <div className="space-y-2">
                  {ticket.travelers.map((trv, idx) => (
                    <div
                      key={trv.id || idx}
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="overflow-hidden">
                          <p className="text-xs font-extrabold text-slate-900 truncate uppercase">
                            {trv.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                            Ticket #: {trv.ticketNo}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ATTACHED AIR TICKET DOCUMENT */}
                {ticket.ticketAttachment && (
                  <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Paperclip className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          ATTACHED E-TICKET DOCUMENT
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTicketDocPreview(!showTicketDocPreview)}
                        className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        {showTicketDocPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showTicketDocPreview ? 'Hide Document' : 'View Document'}</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-300 font-mono truncate">
                      {ticket.ticketFileName || 'e-ticket-attachment'}
                    </div>

                    {showTicketDocPreview && (
                      <div className="pt-2 border-t border-slate-800">
                        {ticket.ticketAttachment.startsWith('data:image/') ? (
                          <div className="max-h-80 overflow-auto rounded-lg bg-black/40 p-2 flex justify-center">
                            <img
                              src={ticket.ticketAttachment}
                              alt="Attached Air Ticket"
                              className="max-w-full h-auto rounded object-contain"
                            />
                          </div>
                        ) : (
                          <div className="bg-slate-800 p-4 rounded-lg text-center space-y-2">
                            <FileText className="w-8 h-8 text-blue-400 mx-auto" />
                            <p className="text-xs font-bold text-white">PDF / Document Attached</p>
                            <a
                              href={ticket.ticketAttachment}
                              download={ticket.ticketFileName || 'air-ticket-document.pdf'}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Download Document</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ADDITIONAL REASON / COMMENT SECTION */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      REASON / OPERATIONAL NOTES
                    </span>
                    {!isEditingReason ? (
                      <button
                        onClick={() => setIsEditingReason(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveReason}
                        className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-semibold cursor-pointer"
                      >
                        Save
                      </button>
                    )}
                  </div>

                  {!isEditingReason ? (
                    <p className="text-xs font-medium text-slate-800 leading-relaxed">
                      {ticket.refundReason || ticket.comment || 'No notes specified.'}
                    </p>
                  ) : (
                    <textarea
                      value={refundReasonText}
                      onChange={(e) => setRefundReasonText(e.target.value)}
                      className="w-full bg-white p-2 rounded border border-blue-400 text-xs text-slate-800 focus:outline-none"
                      rows={3}
                    />
                  )}
                </div>

              </div>

              {/* Footer Modal Action */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  Log Created: {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-2">
                  {onEditTicket && (
                    <button
                      onClick={() => {
                        onClose();
                        onEditTicket(ticket);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Record</span>
                    </button>
                  )}
                  {onDeleteTicket && (
                    <button
                      onClick={() => {
                        onClose();
                        onDeleteTicket(ticket.id);
                      }}
                      className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Record</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    Close Card
                  </button>
                </div>
              </div>

            </div>

          </div>
          </>
          )}

        </div>

      </div>
    </div>
  );
};

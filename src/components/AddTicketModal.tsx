import React, { useState, useEffect, useRef } from 'react';
import { TicketFollowup, TicketStatus, CustomerType } from '../types';
import { 
  X, Plus, Plane, DollarSign, Building2, User, Calendar, MapPin, Luggage, 
  AlertTriangle, ExternalLink, Edit3, Save, Upload, FileText, Sparkles, 
  CheckCircle2, Trash2, Loader2, Paperclip, Image as ImageIcon, Clock 
} from 'lucide-react';

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTicket: (ticket: TicketFollowup) => void;
  editingTicket?: TicketFollowup | null;
  onUpdateTicket?: (ticket: TicketFollowup) => void;
  recordedAgencies?: string[];
  existingTickets?: TicketFollowup[];
  onOpenExistingTicket?: (ticket: TicketFollowup) => void;
}

export const AddTicketModal: React.FC<AddTicketModalProps> = ({
  isOpen,
  onClose,
  onAddTicket,
  editingTicket,
  onUpdateTicket,
  recordedAgencies,
  existingTickets = [],
  onOpenExistingTicket
}) => {
  const [ticketNumbersText, setTicketNumbersText] = useState('');
  const [pnr, setPnr] = useState('');
  const [customer, setCustomer] = useState('Seagull Global');
  const [customerType, setCustomerType] = useState<CustomerType>('Agency');
  const [supplier, setSupplier] = useState('AeroConnect Ltd');
  const [airline, setAirline] = useState('SriLankan Airlines');
  const [flightNo, setFlightNo] = useState('UL 225');
  const [returnFlightNo, setReturnFlightNo] = useState('UL 226');
  const [departureTime, setDepartureTime] = useState('10:30 AM');
  const [arrivalTime, setArrivalTime] = useState('02:45 PM');
  const [returnDepartureTime, setReturnDepartureTime] = useState('06:20 PM');
  const [returnArrivalTime, setReturnArrivalTime] = useState('10:45 PM');
  const [departureLocation, setDepartureLocation] = useState('Colombo (CMB)');
  const [arrivalLocation, setArrivalLocation] = useState('Dubai (DXB)');
  const [flyDate, setFlyDate] = useState('25/08/2026');
  const [returnDate, setReturnDate] = useState('10/09/2026');
  const [tripType, setTripType] = useState<'One Way' | 'Round Trip' | 'Multi-City'>('Round Trip');
  const [cabinClass, setCabinClass] = useState<'Economy' | 'Premium Economy' | 'Business' | 'First'>('Economy');
  const [baggageAllowance, setBaggageAllowance] = useState('30 Kg');
  const [reissueCategory, setReissueCategory] = useState('Standard Reissue');
  const [status, setStatus] = useState<TicketStatus>('Issued / Confirmed');
  const [totalRefundable, setTotalRefundable] = useState('125000');
  const [refundReason, setRefundReason] = useState('New Flight Ticket Issued');
  const [comment, setComment] = useState('E-ticket confirmed and sent to passenger');
  const [travelerName, setTravelerName] = useState('MRS ARUMAKSAYAKKARALAGE / RASIKA');

  const [overrideDuplicate, setOverrideDuplicate] = useState(false);
  const [showDuplicateError, setShowDuplicateError] = useState(false);

  // Group Booking state (Allow shared PNR for multi-passenger bookings)
  const [isGroupBooking, setIsGroupBooking] = useState(editingTicket?.isGroupBooking || false);

  // Attachment state & AI Auto Extraction
  const [ticketAttachment, setTicketAttachment] = useState<string | undefined>(editingTicket?.ticketAttachment);
  const [ticketFileName, setTicketFileName] = useState<string | undefined>(editingTicket?.ticketFileName);
  const [isScanningTicket, setIsScanningTicket] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const ticketFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingTicket) {
      setTicketNumbersText(Array.isArray(editingTicket.tickets) ? editingTicket.tickets.join('\n') : '');
      setPnr(editingTicket.pnr || editingTicket.newBooking || '');
      setCustomer(editingTicket.customer || 'Seagull Global');
      setCustomerType(editingTicket.customerType || 'Agency');
      setSupplier(editingTicket.supplier || 'AeroConnect Ltd');
      setAirline(editingTicket.airline || 'SriLankan Airlines');
      setFlightNo(editingTicket.flightNo || 'UL 225');
      setReturnFlightNo(editingTicket.returnFlightNo || (editingTicket.flightNo ? editingTicket.flightNo.replace(/\d+/, (m) => String(Number(m) + 1)) : 'UL 226'));
      setDepartureTime(editingTicket.departureTime || '10:30 AM');
      setArrivalTime(editingTicket.arrivalTime || '02:45 PM');
      setReturnDepartureTime(editingTicket.returnDepartureTime || '06:20 PM');
      setReturnArrivalTime(editingTicket.returnArrivalTime || '10:45 PM');
      setDepartureLocation(editingTicket.departureLocation || 'Colombo (CMB)');
      setArrivalLocation(editingTicket.arrivalLocation || 'Dubai (DXB)');
      setFlyDate(editingTicket.flyDate || '');
      setReturnDate(editingTicket.returnDate || '');
      setTripType(editingTicket.tripType || 'Round Trip');
      setCabinClass(editingTicket.cabinClass || 'Economy');
      setBaggageAllowance(editingTicket.baggageAllowance || '30 Kg');
      setReissueCategory(editingTicket.reissueCategory || 'Standard Reissue');
      setStatus(editingTicket.status || 'Issued / Confirmed');
      setTotalRefundable(editingTicket.totalRefundable ? String(editingTicket.totalRefundable) : (editingTicket.refundAmount ? String(editingTicket.refundAmount) : ''));
      setRefundReason(editingTicket.refundReason || 'New Flight Ticket Issued');
      setComment(editingTicket.comment || '');
      setTravelerName(editingTicket.travelers?.[0]?.name || 'PASSENGER NAME');
      setTicketAttachment(editingTicket.ticketAttachment);
      setTicketFileName(editingTicket.ticketFileName);
      setIsGroupBooking(editingTicket.isGroupBooking || false);
    } else {
      setTicketNumbersText('');
      setPnr('');
      setCustomer('Seagull Global');
      setCustomerType('Agency');
      setSupplier('AeroConnect Ltd');
      setAirline('SriLankan Airlines');
      setFlightNo('UL 225');
      setReturnFlightNo('UL 226');
      setDepartureTime('10:30 AM');
      setArrivalTime('02:45 PM');
      setReturnDepartureTime('06:20 PM');
      setReturnArrivalTime('10:45 PM');
      setDepartureLocation('Colombo (CMB)');
      setArrivalLocation('Dubai (DXB)');
      setFlyDate('25/08/2026');
      setReturnDate('10/09/2026');
      setTripType('Round Trip');
      setCabinClass('Economy');
      setBaggageAllowance('30 Kg');
      setReissueCategory('Standard Reissue');
      setStatus('Issued / Confirmed');
      setTotalRefundable('125000');
      setRefundReason('New Flight Ticket Issued');
      setComment('E-ticket confirmed and sent to passenger');
      setTravelerName('MRS ARUMAKSAYAKKARALAGE / RASIKA');
      setTicketAttachment(undefined);
      setTicketFileName(undefined);
      setIsGroupBooking(false);
    }
    setOverrideDuplicate(false);
    setShowDuplicateError(false);
    setScanStatus(null);
    setIsScanningTicket(false);
  }, [editingTicket, isOpen]);

  const handleTicketFileUpload = async (file: File) => {
    if (!file) return;

    setTicketFileName(file.name);
    setScanStatus(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setTicketAttachment(dataUrl);

      // Call API to parse ticket with AI OCR
      setIsScanningTicket(true);
      try {
        const response = await fetch('/api/parse-ticket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: dataUrl,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          const {
            tickets: extractedTickets,
            pnr: extractedPnr,
            travelerName: extractedTraveler,
            airline: extractedAirline,
            flightNo: extractedFlight,
            returnFlightNo: extractedReturnFlight,
            departureTime: extractedDepTime,
            arrivalTime: extractedArrTime,
            returnDepartureTime: extractedReturnDepTime,
            returnArrivalTime: extractedReturnArrTime,
            departureLocation: extractedDep,
            arrivalLocation: extractedArr,
            flyDate: extractedFlyDate,
            returnDate: extractedReturnDate,
            tripType: extractedTripType,
            cabinClass: extractedCabin,
            baggageAllowance: extractedBaggage,
            totalAmount: extractedTotal,
            supplier: extractedSupplier,
            reissueCategory: extractedReissueCat,
            isGroupBooking: extractedGroupBooking
          } = result.data;

          if (Array.isArray(extractedTickets) && extractedTickets.length > 0) {
            setTicketNumbersText(extractedTickets.join('\n'));
            if (extractedTickets.length > 1) {
              setIsGroupBooking(true);
            }
          }
          if (extractedGroupBooking) {
            setIsGroupBooking(true);
          }
          if (extractedPnr) setPnr(extractedPnr.toUpperCase());
          if (extractedTraveler) setTravelerName(extractedTraveler.toUpperCase());
          if (extractedAirline) setAirline(extractedAirline);
          if (extractedFlight) setFlightNo(extractedFlight.toUpperCase());
          if (extractedReturnFlight) setReturnFlightNo(extractedReturnFlight.toUpperCase());
          if (extractedDepTime) setDepartureTime(extractedDepTime);
          if (extractedArrTime) setArrivalTime(extractedArrTime);
          if (extractedReturnDepTime) setReturnDepartureTime(extractedReturnDepTime);
          if (extractedReturnArrTime) setReturnArrivalTime(extractedReturnArrTime);
          if (extractedDep) setDepartureLocation(extractedDep);
          if (extractedArr) setArrivalLocation(extractedArr);
          if (extractedFlyDate) setFlyDate(extractedFlyDate);
          if (extractedReturnDate && extractedReturnDate !== 'N/A') setReturnDate(extractedReturnDate);
          if (extractedTripType) setTripType(extractedTripType as any);
          if (extractedCabin) setCabinClass(extractedCabin as any);
          if (extractedBaggage) setBaggageAllowance(extractedBaggage);
          if (extractedTotal && extractedTotal > 0) setTotalRefundable(String(extractedTotal));
          if (extractedSupplier) setSupplier(extractedSupplier);
          if (extractedReissueCat) setReissueCategory(extractedReissueCat);

          setScanStatus({
            type: 'success',
            message: extractedGroupBooking || (Array.isArray(extractedTickets) && extractedTickets.length > 1)
              ? '✨ AI Extraction Complete: Group booking detected with shared PNR!'
              : '✨ Air ticket AI extraction completed successfully! Flight and ticket details populated.'
          });
        } else {
          setScanStatus({
            type: 'error',
            message: result.error || 'Ticket attached successfully. AI extraction unavailable or quota exceeded.'
          });
        }
      } catch (error: any) {
        console.error('Air Ticket Parsing Error:', error);
        setScanStatus({
          type: 'error',
          message: 'Ticket document attached! AI processing error, please verify details manually.'
        });
      } finally {
        setIsScanningTicket(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Check for duplicate ticket entries
  const findDuplicateTicket = (): { ticket: TicketFollowup; reason: string } | null => {
    if (!existingTickets || !Array.isArray(existingTickets) || existingTickets.length === 0) return null;

    const currentTicketNums = (ticketNumbersText || '')
      .split(/[\s,]+/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length >= 4);

    const cleanPnr = (pnr || '').trim().toUpperCase();
    const isValidPnr = cleanPnr.length >= 4 && !['N/A', 'NONE', 'PENDING'].includes(cleanPnr);

    for (const t of existingTickets) {
      if (!t) continue;
      if (editingTicket && t.id === editingTicket.id) continue;

      // 1. Check ticket numbers (exact ticket numbers must be unique across all bookings)
      if (Array.isArray(t.tickets)) {
        for (const num of currentTicketNums) {
          if (t.tickets.some((existingNum) => (existingNum || '').trim().toUpperCase() === num)) {
            return { ticket: t, reason: `Ticket Number "${num}" is already registered` };
          }
        }
      }
      if (Array.isArray(t.travelers)) {
        for (const num of currentTicketNums) {
          if (t.travelers.some((trv) => (trv?.ticketNo || '').trim().toUpperCase() === num)) {
            return { ticket: t, reason: `Passenger Ticket Number "${num}" is already registered` };
          }
        }
      }

      // 2. Check PNR
      // IF Group Booking is enabled (either for current ticket or existing ticket), same PNR is ALLOWED across tickets/passengers!
      if (isValidPnr && !isGroupBooking && !t.isGroupBooking) {
        if (
          (t.pnr || '').trim().toUpperCase() === cleanPnr ||
          (t.newBooking && (t.newBooking || '').trim().toUpperCase() === cleanPnr)
        ) {
          return { ticket: t, reason: `PNR / Booking Reference "${cleanPnr}" is already registered` };
        }
      }
    }

    return null;
  };

  const duplicateMatch = findDuplicateTicket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (duplicateMatch && !overrideDuplicate) {
      setShowDuplicateError(true);
      return;
    }

    const ticketsList = ticketNumbersText
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const amountNum = parseFloat(totalRefundable) || 0;
    const todayStr = new Date().toLocaleDateString('en-GB');

    const routeStr = `${departureLocation || 'CMB'} → ${arrivalLocation || 'DXB'}`;

    if (editingTicket && onUpdateTicket) {
      const updatedTicket: TicketFollowup = {
        ...editingTicket,
        tickets: ticketsList.length > 0 ? ticketsList : editingTicket.tickets,
        newBooking: pnr || editingTicket.newBooking || 'N/A',
        pnr: pnr || editingTicket.pnr || 'DCYMLG',
        status: status,
        reissueCategory: reissueCategory,
        comment: comment || editingTicket.comment,
        quote: `LKR ${amountNum.toLocaleString()}`,
        customer: customer || editingTicket.customer,
        customerType: customerType,
        supplier: supplier || editingTicket.supplier,
        totalRefundable: amountNum,
        refundAmount: amountNum,
        refundReason: refundReason,
        airline: airline || editingTicket.airline,
        flyDate: flyDate || editingTicket.flyDate,
        departureLocation: departureLocation || editingTicket.departureLocation,
        arrivalLocation: arrivalLocation || editingTicket.arrivalLocation,
        returnDate: tripType === 'Round Trip' ? returnDate : 'N/A',
        tripType: tripType,
        flightNo: flightNo || editingTicket.flightNo,
        returnFlightNo: tripType === 'Round Trip' ? returnFlightNo : undefined,
        departureTime: departureTime,
        arrivalTime: arrivalTime,
        returnDepartureTime: tripType === 'Round Trip' ? returnDepartureTime : undefined,
        returnArrivalTime: tripType === 'Round Trip' ? returnArrivalTime : undefined,
        cabinClass: cabinClass,
        baggageAllowance: baggageAllowance,
        travelers: [
          {
            id: editingTicket.travelers?.[0]?.id || `trv-${Date.now()}`,
            name: travelerName || 'PASSENGER NAME',
            ticketNo: (ticketsList[0] ?? editingTicket.tickets?.[0] ?? '1572134128637')
          }
        ],
        itinerary: [
          {
            id: editingTicket.itinerary?.[0]?.id || `itin-${Date.now()}`,
            route: routeStr,
            flightNo: flightNo || editingTicket.flightNo || 'UL 225',
            dateTime: `${flyDate} 10:00`
          }
        ],
        ticketAttachment: ticketAttachment,
        ticketFileName: ticketFileName,
        isGroupBooking: isGroupBooking
      };
      onUpdateTicket(updatedTicket);
    } else {
      const newTicket: TicketFollowup = {
        id: `tkt-${Date.now()}`,
        tickets: ticketsList.length > 0 ? ticketsList : [`1572${Math.floor(100000000 + Math.random() * 900000000)}`],
        newBooking: pnr || 'N/A',
        status: status,
        reissueCategory: reissueCategory,
        comment: comment || 'Ticket issued',
        quote: `LKR ${amountNum.toLocaleString()}`,
        outcome: 'Ticket Active & Tracked',
        customer: customer.trim() || 'Seagull Global',
        customerType: customerType,
        supplier: supplier || 'Standard Airline Supplier',
        requestDate: todayStr,
        pnr: pnr || 'DCYMLG',
        totalRefundable: amountNum,
        refundAmount: amountNum,
        serviceFee: 0,
        currency: 'LKR',
        timeline: [
          { id: 'tm-1', title: 'ISSUED', date: todayStr, completed: true },
          { id: 'tm-2', title: 'FLOWN / COMPLETED', date: flyDate, completed: status === 'Flown' || status === 'Completed' }
        ],
        refundReason: refundReason,
        airline: airline || 'SriLankan Airlines',
        flyDate: flyDate || todayStr,
        departureLocation: departureLocation || 'Colombo (CMB)',
        arrivalLocation: arrivalLocation || 'Dubai (DXB)',
        returnDate: tripType === 'Round Trip' ? returnDate : 'N/A',
        tripType: tripType,
        flightNo: flightNo || 'UL 225',
        returnFlightNo: tripType === 'Round Trip' ? returnFlightNo : undefined,
        departureTime: departureTime,
        arrivalTime: arrivalTime,
        returnDepartureTime: tripType === 'Round Trip' ? returnDepartureTime : undefined,
        returnArrivalTime: tripType === 'Round Trip' ? returnArrivalTime : undefined,
        cabinClass: cabinClass,
        baggageAllowance: baggageAllowance,
        travelers: [
          {
            id: `trv-${Date.now()}`,
            name: travelerName || 'PASSENGER NAME',
            ticketNo: (ticketsList[0] ?? '1572134128637')
          }
        ],
        itinerary: [
          {
            id: `itin-${Date.now()}`,
            route: routeStr,
            flightNo: flightNo || 'UL 225',
            dateTime: `${flyDate} 10:00`
          }
        ],
        createdAt: new Date().toISOString(),
        ticketAttachment: ticketAttachment,
        ticketFileName: ticketFileName,
        isGroupBooking: isGroupBooking
      };
      onAddTicket(newTicket);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Plane className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              {editingTicket ? 'Edit Air Ticket Record' : 'Issue / Log New Air Ticket Record'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          
          {/* Duplicate Record Warning Banner */}
          {duplicateMatch && (
            <div className={`p-4 rounded-xl border-2 space-y-2.5 transition-all ${
              showDuplicateError 
                ? 'bg-red-50 border-red-500 text-red-900 shadow-md ring-2 ring-red-200' 
                : 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 font-extrabold text-xs uppercase tracking-wide">
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${showDuplicateError ? 'text-red-600' : 'text-amber-600'}`} />
                  <span className={showDuplicateError ? 'text-red-700' : 'text-amber-900'}>
                    ⚠️ Existing Application Record Detected!
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  showDuplicateError ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  Duplicate Blocked
                </span>
              </div>

              <div className="text-xs font-medium space-y-1.5 pl-7">
                <p className="font-bold text-slate-800">
                  {duplicateMatch.reason}. An existing ticket record already exists in the system:
                </p>
                
                <div className="bg-white/90 p-3 rounded-lg border border-slate-300 space-y-1 text-[11px] font-sans shadow-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Passenger Name:</span>
                    <span className="font-extrabold text-slate-900">
                      {duplicateMatch.ticket.travelers?.[0]?.name || duplicateMatch.ticket.customer}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Customer / Agency:</span>
                    <span className="font-bold text-slate-800">{duplicateMatch.ticket.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Airline & Flight:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {duplicateMatch.ticket.airline} ({duplicateMatch.ticket.flightNo})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Current Status:</span>
                    <span className="font-bold text-emerald-700">{duplicateMatch.ticket.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Fly Date:</span>
                    <span className="font-mono font-bold text-slate-700">{duplicateMatch.ticket.flyDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pl-7">
                <span className="text-[10px] text-slate-600 font-medium">
                  System detected a matching record. You can override and save this record anyway, or open the existing record.
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideDuplicate(true);
                      setShowDuplicateError(false);
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }, 50);
                    }}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Override & Save Record</span>
                  </button>

                  {onOpenExistingTicket && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenExistingTicket(duplicateMatch.ticket);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center space-x-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Existing Ticket</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 0: Attach Air Ticket & AI Auto-Extraction */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-xl shadow-md border border-blue-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-400/30">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <span>Attach Air Ticket Document</span>
                    <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase">
                      AI Auto-Extract
                    </span>
                  </h4>
                  <p className="text-[11px] text-blue-200/90 font-medium">
                    Upload e-ticket, PDF receipt, or itinerary image to automatically extract flight numbers, PNR, passenger names, and fares.
                  </p>
                </div>
              </div>

              <label className="inline-flex items-center space-x-2 cursor-pointer bg-blue-950/80 hover:bg-blue-950 border border-blue-400/50 px-3 py-1.5 rounded-xl transition-all shrink-0">
                <input
                  type="checkbox"
                  checked={isGroupBooking}
                  onChange={(e) => setIsGroupBooking(e.target.checked)}
                  className="rounded text-amber-400 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-amber-300 leading-tight">
                    Attach as Group Booking
                  </span>
                  <span className="text-[9px] text-blue-200/80 font-medium">
                    Allows shared PNR for group
                  </span>
                </div>
              </label>
            </div>

            <input
              type="file"
              ref={ticketFileInputRef}
              accept="image/*,application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleTicketFileUpload(file);
              }}
            />

            {!ticketAttachment ? (
              <div
                onClick={() => ticketFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleTicketFileUpload(file);
                }}
                className="border-2 border-dashed border-blue-400/50 hover:border-blue-300 bg-blue-950/40 hover:bg-blue-950/60 p-4 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 group"
              >
                {isScanningTicket ? (
                  <div className="flex flex-col items-center space-y-2 py-2">
                    <Loader2 className="w-7 h-7 text-amber-300 animate-spin" />
                    <span className="text-xs font-bold text-amber-200">
                      Reading Air Ticket Document with AI OCR...
                    </span>
                    <span className="text-[10px] text-blue-300">
                      Extracting PNR, ticket numbers, passenger details, flights & route
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="p-2 bg-blue-800/50 rounded-full text-blue-200 group-hover:bg-blue-700/60 group-hover:scale-105 transition-all">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-white">
                      Click to Browse or Drag & Drop E-Ticket PDF / Image
                    </div>
                    <div className="text-[10px] text-blue-300 font-medium">
                      Supports JPG, PNG, WEBP & PDF files
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/90 p-3 rounded-xl border border-blue-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                    {ticketAttachment.startsWith('data:image/') ? (
                      <img src={ticketAttachment} alt="Ticket preview" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white truncate flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{ticketFileName || 'Attached Air Ticket Document'}</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Ticket Document Attached</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => ticketFileInputRef.current?.click()}
                    disabled={isScanningTicket}
                    className="px-2.5 py-1.5 bg-blue-700/80 hover:bg-blue-600 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Re-upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTicketAttachment(undefined);
                      setTicketFileName(undefined);
                      setScanStatus(null);
                    }}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-red-500/30"
                    title="Remove Attachment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {scanStatus && (
              <div
                className={`p-2.5 rounded-lg text-[11px] font-extrabold flex items-center justify-between ${
                  scanStatus.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                    : 'bg-amber-950/80 border border-amber-500/50 text-amber-200'
                }`}
              >
                <span>{scanStatus.message}</span>
                <button
                  type="button"
                  onClick={() => setScanStatus(null)}
                  className="text-slate-400 hover:text-white font-bold text-xs cursor-pointer ml-2"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Section 1: Flight & Airline Details */}
          <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/80 space-y-3">
            <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <Plane className="w-4 h-4 text-blue-600" />
              <span>Flight & Route Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Airline Name</label>
                <input
                  type="text"
                  value={airline}
                  onChange={(e) => setAirline(e.target.value)}
                  placeholder="e.g. SriLankan Airlines, Emirates, Qatar Airways"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Flight Number</label>
                <input
                  type="text"
                  value={flightNo}
                  onChange={(e) => setFlightNo(e.target.value)}
                  placeholder="e.g. UL 225, EK 651"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono uppercase font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Trip Type</label>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                >
                  <option value="Round Trip">Round Trip</option>
                  <option value="One Way">One Way</option>
                  <option value="Multi-City">Multi-City</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Departure Location (Origin)</label>
                <input
                  type="text"
                  value={departureLocation}
                  onChange={(e) => setDepartureLocation(e.target.value)}
                  placeholder="e.g. Colombo (CMB)"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Arrival Location (Destination)</label>
                <input
                  type="text"
                  value={arrivalLocation}
                  onChange={(e) => setArrivalLocation(e.target.value)}
                  placeholder="e.g. Dubai (DXB) or London (LHR)"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900"
                  required
                />
              </div>
            </div>

            <div className={`grid grid-cols-1 ${tripType === 'Round Trip' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Departure Date</span>
                </label>
                <input
                  type="text"
                  value={flyDate}
                  onChange={(e) => setFlyDate(e.target.value)}
                  placeholder="DD/MM/YYYY e.g. 25/08/2026"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                  required
                />
              </div>

              {tripType === 'Round Trip' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Return Flight No</label>
                  <input
                    type="text"
                    value={returnFlightNo}
                    onChange={(e) => setReturnFlightNo(e.target.value)}
                    placeholder="e.g. UL 226"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 uppercase"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Return Date</label>
                <input
                  type="text"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  placeholder="DD/MM/YYYY or N/A"
                  disabled={tripType === 'One Way'}
                  className={`w-full border rounded-lg p-2 font-mono text-slate-900 ${
                    tripType === 'One Way' ? 'bg-slate-100 text-slate-400' : 'bg-white border-slate-300 font-bold'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cabin & Baggage</label>
                <div className="flex space-x-1">
                  <select
                    value={cabinClass}
                    onChange={(e) => setCabinClass(e.target.value as any)}
                    className="w-1/2 bg-white border border-slate-300 rounded-lg p-2 text-[11px] font-semibold"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium</option>
                    <option value="Business">Business</option>
                    <option value="First">First Class</option>
                  </select>
                  <input
                    type="text"
                    value={baggageAllowance}
                    onChange={(e) => setBaggageAllowance(e.target.value)}
                    placeholder="30 Kg"
                    className="w-1/2 bg-white border border-slate-300 rounded-lg p-2 text-[11px] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Flight Timing (Dep & Arr Times) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                <span className="text-[11px] font-extrabold text-blue-900 uppercase block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-600" />
                  Outbound Flight Times (Dep / Arr)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Dep Time</label>
                    <input
                      type="text"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      placeholder="e.g. 10:30 AM"
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Arr Time</label>
                    <input
                      type="text"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      placeholder="e.g. 02:45 PM"
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {tripType === 'Round Trip' ? (
                <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                  <span className="text-[11px] font-extrabold text-amber-900 uppercase block mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Return Flight Times (Dep / Arr)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Dep Time</label>
                      <input
                        type="text"
                        value={returnDepartureTime}
                        onChange={(e) => setReturnDepartureTime(e.target.value)}
                        placeholder="e.g. 06:20 PM"
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Arr Time</label>
                      <input
                        type="text"
                        value={returnArrivalTime}
                        onChange={(e) => setReturnArrivalTime(e.target.value)}
                        placeholder="e.g. 10:45 PM"
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-center text-xs text-slate-400 font-medium">
                  One Way Flight (No Return Timings)
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Ticket & Booking Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Ticket Number(s) <span className="text-slate-400 font-normal">(comma / space separated)</span>
              </label>
              <textarea
                value={ticketNumbersText}
                onChange={(e) => setTicketNumbersText(e.target.value)}
                placeholder="1572134128637 1572134128636"
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">PNR / Booking Reference</label>
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={isGroupBooking}
                      onChange={(e) => setIsGroupBooking(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-indigo-900">
                      Group Booking / Shared PNR
                    </span>
                  </label>
                </div>
                <input
                  type="text"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value)}
                  placeholder="e.g. 6BHYAW or DCYMLG"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono uppercase font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                {isGroupBooking && (
                  <p className="text-[10px] font-bold text-indigo-700 mt-1 flex items-center gap-1">
                    <span>✓ Group Booking enabled: PNR can be shared across multiple passengers/tickets without duplicate block.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Passenger Name</label>
                <input
                  type="text"
                  value={travelerName}
                  onChange={(e) => setTravelerName(e.target.value)}
                  placeholder="MR/MRS PASSENGER FULL NAME"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 uppercase font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Customer / Agency Selection */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Customer / B2B Agency Account</span>
              </label>
              <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCustomerType('Agency')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
                    customerType === 'Agency'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>Agency (B2B)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerType('Customer')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
                    customerType === 'Customer'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>Direct Customer (B2C)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {customerType === 'Agency' ? 'Agency Name' : 'Customer Name'}
                </label>
                <input
                  type="text"
                  list="ticket-recorded-agencies"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Select or type Agency name"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <datalist id="ticket-recorded-agencies">
                  {(recordedAgencies && recordedAgencies.length > 0
                    ? recordedAgencies
                    : ['Seagull Global', 'Royal Horizon Agency', 'Al Safa Travels', 'Skyline Tours', 'Lanka Tours & Travels']
                  ).map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">GDS / Supplier</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Price & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Total Fare / Quote (LKR)</label>
              <input
                type="number"
                value={totalRefundable}
                onChange={(e) => setTotalRefundable(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={reissueCategory}
                onChange={(e) => setReissueCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900"
              >
                <option value="New Issue">New Issue</option>
                <option value="Standard Reissue">Standard Reissue</option>
                <option value="Full Refund">Full Refund</option>
                <option value="No-Show Waiver">No-Show Waiver</option>
                <option value="Name Correction">Name Correction</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
              >
                <option value="Issued / Confirmed">Issued / Confirmed</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Flown">Flown</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Operational Comments / Notes</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Confirmed on GDS, ticket emailed to customer"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
            />
          </div>

          {duplicateMatch && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideDuplicate}
                  onChange={(e) => {
                    setOverrideDuplicate(e.target.checked);
                    if (e.target.checked) setShowDuplicateError(false);
                  }}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Allow adding duplicate record anyway (Override System Safety)</span>
              </label>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={(e) => {
                if (duplicateMatch && !overrideDuplicate) {
                  setOverrideDuplicate(true);
                  setShowDuplicateError(false);
                }
              }}
              className={`px-5 py-2 font-bold rounded-lg shadow-sm transition-colors cursor-pointer text-white ${
                duplicateMatch && !overrideDuplicate
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {duplicateMatch && !overrideDuplicate 
                ? 'Override & Save Record' 
                : (editingTicket ? 'Save Changes' : 'Save & Track Ticket')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

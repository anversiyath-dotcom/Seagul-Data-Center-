import React from 'react';
import { TicketFollowup, CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../types';
import { 
  Plane, MapPin, Phone, Mail, FileText, Globe, Hotel, Compass, 
  Sparkles, ShieldCheck
} from 'lucide-react';
import { SeagullLogo } from './SeagullLogo';
import { TicketQrCode } from './TicketQrCode';
import { 
  resolveAirport, 
  formatFlightDate, 
  calculateFlightDuration, 
  formatFlightTime 
} from '../utils/airportHelpers';

interface TicketLetterheadPrintProps {
  ticket: TicketFollowup;
  hideCustomer?: boolean;
  hideSupplier?: boolean;
  hideRefundable?: boolean;
  companyProfile?: CompanyProfile;
}

export const TicketLetterheadPrint: React.FC<TicketLetterheadPrintProps> = ({
  ticket,
  hideCustomer = false,
  companyProfile = DEFAULT_COMPANY_PROFILE
}) => {
  const primaryTraveler = ticket.travelers?.[0]?.name || 'PASSENGER NAME';
  const ticketNumbersStr = Array.isArray(ticket.tickets) && ticket.tickets.length > 0 
    ? ticket.tickets.join(', ') 
    : (typeof ticket.tickets === 'string' && ticket.tickets ? ticket.tickets : (ticket.travelers?.[0]?.ticketNo || '1769292562435'));

  const negomboAddress = companyProfile.negomboAddress || '45/1/1 Meerigama Road, Pankada junction , Negombo';
  const negomboPhone = companyProfile.negomboPhone || '+94 70 170 4613';
  const dubaiAddress = companyProfile.dubaiAddress || 'Coastal building , Al tawar center Dubai';
  const dubaiPhone = companyProfile.dubaiPhone || '+971 52 263 6372';
  const companyEmail = companyProfile.email || 'Info@seagullglobal.com';

  const isRoundTrip = ticket.tripType === 'Round Trip' || Boolean(ticket.returnDate && ticket.returnDate !== 'N/A' && ticket.returnDate.trim() !== '');

  // Outbound flight details
  const originAirport = resolveAirport(ticket.departureLocation, 'CMB', 'Bandaranaike Intl Arpt', 'Colombo, Sri Lanka');
  const destAirport = resolveAirport(ticket.arrivalLocation, 'MLE', 'Male Intl Arpt', 'Male, Maldives');
  
  const outboundDateFormatted = formatFlightDate(ticket.flyDate || ticket.requestDate);
  const outboundDepTime = formatFlightTime(ticket.departureTime, '20:35');
  const outboundArrTime = formatFlightTime(ticket.arrivalTime, '21:35');
  const outboundDuration = calculateFlightDuration(outboundDepTime, outboundArrTime);

  // Return flight details
  const returnDateFormatted = formatFlightDate(ticket.returnDate || '11/09/2026');
  const returnFlightNum = ticket.returnFlightNo || (ticket.flightNo ? ticket.flightNo.replace(/\d+/, (m) => String(Number(m) + 1)) : 'EK 0652');
  const returnAirlineName = ticket.returnAirline || ticket.airline || 'Emirates';
  const returnDepTime = formatFlightTime(ticket.returnDepartureTime, '16:30');
  const returnArrTime = formatFlightTime(ticket.returnArrivalTime, '18:30');
  const returnDuration = calculateFlightDuration(returnDepTime, returnArrTime);

  const issuedDate = ticket.createdAt 
    ? new Date(ticket.createdAt).toISOString().split('T')[0] 
    : '2026-07-25';

  const nowTimestamp = new Date().toISOString();

  return (
    <div 
      id="printable-letterhead" 
      className="bg-white text-slate-900 font-sans p-4 sm:p-6 max-w-4xl mx-auto border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 flex flex-col justify-between relative overflow-hidden"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', minHeight: '1000px' }}
    >
      {/* ================= 1. HEADER ================= */}
      <div>
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-2">
          
          {/* Top Left: Logo stacked */}
          <div className="shrink-0 flex items-start">
            <SeagullLogo size="md" variant="stacked" />
          </div>

          {/* Top Right: Negombo & Dubai Branches */}
          <div className="space-y-2 text-[11px] text-slate-700 text-right self-end sm:self-auto max-w-lg">
            
            {/* Negombo Branch */}
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-slate-600 shrink-0">
                  <MapPin className="w-2.5 h-2.5 text-slate-600" />
                </span>
                <span className="font-extrabold uppercase tracking-wide">NEGOMBO</span>
              </div>
              <span className="text-slate-600">{negomboAddress}</span>
              <span className="font-medium text-slate-800 flex items-center gap-1 shrink-0 font-mono">
                <Phone className="w-3 h-3 text-slate-500" />
                {negomboPhone}
              </span>
            </div>

            {/* Dubai Branch */}
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-slate-600 shrink-0">
                  <MapPin className="w-2.5 h-2.5 text-slate-600" />
                </span>
                <span className="font-extrabold uppercase tracking-wide">DUBAI</span>
              </div>
              <span className="text-slate-600">{dubaiAddress}</span>
              <span className="font-medium text-slate-800 flex items-center gap-1 shrink-0 font-mono">
                <Phone className="w-3 h-3 text-slate-500" />
                {dubaiPhone}
              </span>
            </div>

          </div>
        </div>

        {/* Thin Divider Line */}
        <hr className="border-t border-slate-200 my-2" />

        {/* ================= 2. TITLE ================= */}
        <div className="text-center py-2 mb-2">
          <h1 className="text-xl sm:text-2xl font-black text-[#00ADEF] tracking-[0.12em] uppercase font-sans">
            CONFIRMED RESERVATION
          </h1>
          <p className="text-xs font-semibold text-slate-400 tracking-[0.22em] uppercase mt-0.5">
            PASSENGER FLIGHT INFORMATION
          </p>
        </div>

        {/* ================= 3. PASSENGER & TICKET META ================= */}
        <div className="flex items-start justify-between gap-4 mb-4">
          
          {/* Left: Booking Reference & Passenger */}
          <div className="space-y-3">
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                BOOKING REFERENCE
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#0088EA] font-mono tracking-wider">
                {ticket.pnr || '6YUZAW'}
              </span>
            </div>

            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                PASSENGER
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide block">
                {primaryTraveler}
              </span>
              {ticket.travelers && ticket.travelers.length > 1 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {ticket.travelers.slice(1).map((t, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: QR Code, Ticket Number & Issued Meta */}
          <div className="flex flex-col items-end text-right space-y-1">
            <TicketQrCode value={`${ticket.pnr || '6YUZAW'}-${ticketNumbersStr}`} size={76} />
            <div className="pt-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                TICKET NO
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono block">
                {ticketNumbersStr}
              </span>
              <span className="text-[10.5px] font-medium text-slate-600 block mt-0.5">
                Issued: {issuedDate} | IATA: 07303074
              </span>
            </div>
          </div>

        </div>

        {/* ================= 4. FLIGHT SECTOR CARDS ================= */}
        <div className="space-y-4 mb-4">
          
          {/* Sector 1: Outbound Flight */}
          <div className="rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
            {/* Top Banner Ribbon */}
            <div className="bg-[#0099FF] text-white px-4 py-2 text-xs sm:text-[12.5px] font-black uppercase tracking-wider flex items-center justify-start gap-2">
              <span>{outboundDateFormatted}</span>
              <span>|</span>
              <span>{ticket.cabinClass || 'Economy'}</span>
              <span>|</span>
              <span>{ticket.airline || 'Emirates'} {ticket.flightNo || 'EK 0653'}</span>
              <span>|</span>
              <span>Equipment: 77W</span>
            </div>

            {/* Flight Route Body */}
            <div className="bg-white p-4">
              <div className="grid grid-cols-12 items-center gap-2">
                
                {/* Origin Airport */}
                <div className="col-span-4 text-left">
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                    {originAirport.code}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">
                    {originAirport.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {originAirport.cityCountry}
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-2">
                    {outboundDepTime}
                  </div>
                </div>

                {/* Duration & Flight Track Graphic */}
                <div className="col-span-4 text-center px-1">
                  <div className="text-[11px] font-medium text-slate-600 italic mb-1.5">
                    {outboundDuration}
                  </div>
                  <div className="flex items-center justify-center w-full">
                    <div className="w-2 h-2 rounded-full bg-slate-700 shrink-0"></div>
                    <div className="flex-1 h-[1.5px] bg-slate-400"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-700 shrink-0"></div>
                  </div>
                </div>

                {/* Destination Airport */}
                <div className="col-span-4 text-right">
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                    {destAirport.code}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">
                    {destAirport.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {destAirport.cityCountry}
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-2">
                    {outboundArrTime}
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Meta Bar */}
            <div className="bg-white px-4 py-2 border-t border-slate-100 text-xs text-slate-700 font-medium flex flex-wrap items-center justify-between gap-3">
              <div>Terminal: <span className="font-bold text-slate-900">1</span></div>
              <div>Airline Ref: <span className="font-bold font-mono text-slate-900">{ticket.pnr || 'JJAQGB'}</span></div>
              <div>Status: <span className="font-bold text-emerald-700">HK (Confirmed)</span></div>
              <div>Baggage: <span className="font-bold text-slate-900">{ticket.baggageAllowance || '30 KG'}</span></div>
            </div>
          </div>

          {/* Sector 2: Return / Inbound Flight (For Round Trip) */}
          {isRoundTrip && (
            <div className="rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
              {/* Top Banner Ribbon */}
              <div className="bg-[#0099FF] text-white px-4 py-2 text-xs sm:text-[12.5px] font-black uppercase tracking-wider flex items-center justify-start gap-2">
                <span>{returnDateFormatted}</span>
                <span>|</span>
                <span>{ticket.cabinClass || 'Economy'}</span>
                <span>|</span>
                <span>{returnAirlineName} {returnFlightNum}</span>
                <span>|</span>
                <span>Equipment: 77W</span>
              </div>

              {/* Flight Route Body */}
              <div className="bg-white p-4">
                <div className="grid grid-cols-12 items-center gap-2">
                  
                  {/* Origin Airport (Destination on Outbound) */}
                  <div className="col-span-4 text-left">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                      {destAirport.code}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">
                      {destAirport.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {destAirport.cityCountry}
                    </div>
                    <div className="text-xl font-black text-slate-900 font-mono mt-2">
                      {returnDepTime}
                    </div>
                  </div>

                  {/* Duration & Flight Track Graphic */}
                  <div className="col-span-4 text-center px-1">
                    <div className="text-[11px] font-medium text-slate-600 italic mb-1.5">
                      {returnDuration}
                    </div>
                    <div className="flex items-center justify-center w-full">
                      <div className="w-2 h-2 rounded-full bg-slate-700 shrink-0"></div>
                      <div className="flex-1 h-[1.5px] bg-slate-400"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-700 shrink-0"></div>
                    </div>
                  </div>

                  {/* Destination Airport (Origin on Outbound) */}
                  <div className="col-span-4 text-right">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                      {originAirport.code}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">
                      {originAirport.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {originAirport.cityCountry}
                    </div>
                    <div className="text-xl font-black text-slate-900 font-mono mt-2">
                      {returnArrTime}
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Meta Bar */}
              <div className="bg-white px-4 py-2 border-t border-slate-100 text-xs text-slate-700 font-medium flex flex-wrap items-center justify-between gap-3">
                <div>Terminal: <span className="font-bold text-slate-900">1</span></div>
                <div>Airline Ref: <span className="font-bold font-mono text-slate-900">{ticket.pnr || 'JJAQGB'}</span></div>
                <div>Status: <span className="font-bold text-emerald-700">HK (Confirmed)</span></div>
                <div>Baggage: <span className="font-bold text-slate-900">{ticket.baggageAllowance || '30 KG'}</span></div>
              </div>
            </div>
          )}

        </div>

        {/* ================= 5. DISCLAIMER NOTE ================= */}
        <div className="my-3 text-[10px] sm:text-[10.5px] text-slate-500 leading-relaxed font-normal">
          <p>
            Note: All times shown are local times. Please note that the above information is correct as of{' '}
            <span className="font-mono text-slate-600">{nowTimestamp.replace(/\.\d+Z$/, '+00:00')}</span>. You may want to check with the travel agent/airline and reconfirm before departure. This document is not eligible for resale.
          </p>
        </div>

      </div>

      {/* ================= 6. BOTTOM BRAND RIBBON (EXACT IMAGE REPLICA) ================= */}
      <div className="mt-4 pt-1 relative">
        
        <div className="relative flex flex-col md:flex-row items-end">
          
          {/* White Brand Pod on the Left with rounded top & wave shape */}
          <div className="relative z-10 bg-white px-4 pt-2.5 pb-1 rounded-t-2xl shadow-xs border-t border-l border-r border-slate-200 flex flex-col items-center justify-center shrink-0 -mb-0.5 min-w-[150px]">
            <SeagullLogo size="sm" variant="stacked" />
          </div>

          {/* Cyan/Blue Ribbon across bottom with services grid and contact */}
          <div className="w-full bg-[#0099FF] text-white p-3 rounded-tr-2xl rounded-tl-2xl md:rounded-tl-none shadow-md print:shadow-none flex flex-wrap items-center justify-between gap-3">
            
            {/* Middle Services Grid (2 rows x 3 columns) */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
              
              {/* Row 1 */}
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span className="leading-tight">STANDARD VISAS</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span className="leading-tight">AIR TICKETS</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Hotel className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span className="leading-tight">HOTEL RESERVATION</span>
              </div>

              {/* Row 2 */}
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span className="leading-tight">EVISAS</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span className="leading-tight">INBOUND &amp; OUTBOUND TOUR</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span className="leading-tight">HOLIDAY ACTIVITES</span>
              </div>

            </div>

            {/* Right Contact Box */}
            <div className="text-[9px] sm:text-[10px] text-white text-right space-y-1 border-t md:border-t-0 md:border-l border-white/30 pt-1.5 md:pt-0 md:pl-4 shrink-0">
              <div>
                <div className="flex items-center justify-end gap-1 text-[8.5px] font-bold text-cyan-100 uppercase">
                  <Mail className="w-2.5 h-2.5 text-cyan-100" />
                  <span>EMAIL</span>
                </div>
                <div className="font-semibold text-white tracking-wide text-[9.5px]">
                  {companyEmail}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-end gap-1 text-[8.5px] font-bold text-cyan-100 uppercase">
                  <Phone className="w-2.5 h-2.5 text-cyan-100" />
                  <span>CONTACT / WHATSAPP</span>
                </div>
                <div className="font-bold text-white font-mono tracking-tight text-[9.5px]">
                  {negomboPhone}, {dubaiPhone}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

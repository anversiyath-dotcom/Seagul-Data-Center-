import React, { useState, useEffect, useRef } from 'react';
import { TicketFollowup, TicketStatus, CustomerType, TicketPaymentStatus, Traveler } from '../types';
import { 
  X, Plus, Plane, DollarSign, Building2, User, Calendar, MapPin, Luggage, 
  AlertTriangle, ExternalLink, Edit3, Save, Upload, FileText, Sparkles, 
  CheckCircle2, Trash2, Loader2, Paperclip, Image as ImageIcon, Clock,
  Users, TrendingUp, TrendingDown, Calculator, Check, ArrowRight, Copy, ClipboardList,
  Link, Globe
} from 'lucide-react';
import { normalizeGitHubUrl } from '../utils/imageUrlHelpers';
import { isPaidPaymentStatus, isPartialPaymentStatus, isUnpaidPaymentStatus } from '../utils/paymentUtils';

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

  // Group Booking & Financials state
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSize, setGroupSize] = useState<number>(1);
  const [pricingMode, setPricingMode] = useState<'total' | 'per_pax'>('per_pax');
  const [costPrice, setCostPrice] = useState<string>('105000');
  const [sellingPrice, setSellingPrice] = useState<string>('125000');
  const [costPerPax, setCostPerPax] = useState<string>('105000');
  const [sellingPerPax, setSellingPerPax] = useState<string>('125000');
  const [currency, setCurrency] = useState<string>('LKR');
  const [paymentStatus, setPaymentStatus] = useState<TicketPaymentStatus>('Pending');

  // Dynamic Passenger List for Group or Individual
  const [groupTravelers, setGroupTravelers] = useState<Array<{ id: string; name: string; ticketNo: string }>>([
    { id: 'trv-1', name: 'MRS ARUMAKSAYAKKARALAGE / RASIKA', ticketNo: '1572134128637' }
  ]);
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');

  const [overrideDuplicate, setOverrideDuplicate] = useState(false);
  const [showDuplicateError, setShowDuplicateError] = useState(false);

  // Attachment state & AI Auto Extraction
  const [ticketAttachment, setTicketAttachment] = useState<string | undefined>(editingTicket?.ticketAttachment);
  const [ticketFileName, setTicketFileName] = useState<string | undefined>(editingTicket?.ticketFileName);
  const [isScanningTicket, setIsScanningTicket] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [ticketSourceType, setTicketSourceType] = useState<'file' | 'link'>('file');
  const [ticketLinkUrl, setTicketLinkUrl] = useState('');

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
      
      const sPrice = editingTicket.sellingPrice !== undefined 
        ? String(editingTicket.sellingPrice) 
        : (editingTicket.totalRefundable ? String(editingTicket.totalRefundable) : (editingTicket.refundAmount ? String(editingTicket.refundAmount) : '125000'));
      const cPrice = editingTicket.costPrice !== undefined ? String(editingTicket.costPrice) : '105000';
      setSellingPrice(sPrice);
      setTotalRefundable(sPrice);
      setCostPrice(cPrice);
      setCostPerPax(editingTicket.costPerPax !== undefined ? String(editingTicket.costPerPax) : cPrice);
      setSellingPerPax(editingTicket.sellingPerPax !== undefined ? String(editingTicket.sellingPerPax) : sPrice);
      setCurrency(editingTicket.currency || 'LKR');
      setPaymentStatus(editingTicket.paymentStatus ? (isPaidPaymentStatus(editingTicket.paymentStatus) ? 'Paid' : isPartialPaymentStatus(editingTicket.paymentStatus) ? 'Partially Paid' : 'Pending') : 'Pending');

      setRefundReason(editingTicket.refundReason || 'New Flight Ticket Issued');
      setComment(editingTicket.comment || '');
      setTravelerName(editingTicket.travelers?.[0]?.name || 'PASSENGER NAME');
      setTicketAttachment(editingTicket.ticketAttachment);
      setTicketFileName(editingTicket.ticketFileName);
      
      const isGroup = editingTicket.isGroupBooking || false;
      setIsGroupBooking(isGroup);
      setGroupName(editingTicket.groupName || '');
      setPricingMode(editingTicket.pricingMode || (isGroup ? 'per_pax' : 'total'));

      if (editingTicket.travelers && editingTicket.travelers.length > 0) {
        setGroupTravelers(editingTicket.travelers.map(t => ({
          id: t.id || `trv-${Date.now()}-${Math.random()}`,
          name: t.name,
          ticketNo: t.ticketNo
        })));
        setGroupSize(editingTicket.groupSize || editingTicket.travelers.length);
      } else {
        const trvs = Array.isArray(editingTicket.tickets) && editingTicket.tickets.length > 0
          ? editingTicket.tickets.map((tNum, idx) => ({
              id: `trv-${Date.now()}-${idx}`,
              name: idx === 0 ? (editingTicket.travelers?.[0]?.name || editingTicket.customer) : `PASSENGER ${idx + 1}`,
              ticketNo: tNum
            }))
          : [{ id: `trv-${Date.now()}-1`, name: editingTicket.customer, ticketNo: editingTicket.pnr || '1572134128637' }];
        setGroupTravelers(trvs);
        setGroupSize(editingTicket.groupSize || trvs.length);
      }
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
      setCostPrice('105000');
      setSellingPrice('125000');
      setCostPerPax('105000');
      setSellingPerPax('125000');
      setCurrency('LKR');
      setPaymentStatus('Pending');
      setRefundReason('New Flight Ticket Issued');
      setComment('E-ticket confirmed and sent to passenger');
      setTravelerName('MRS ARUMAKSAYAKKARALAGE / RASIKA');
      setTicketAttachment(undefined);
      setTicketFileName(undefined);
      setIsGroupBooking(false);
      setGroupName('');
      setGroupSize(1);
      setPricingMode('per_pax');
      setGroupTravelers([
        { id: `trv-${Date.now()}-1`, name: 'MRS ARUMAKSAYAKKARALAGE / RASIKA', ticketNo: '1572134128637' }
      ]);
    }
    setOverrideDuplicate(false);
    setShowDuplicateError(false);
    setScanStatus(null);
    setIsScanningTicket(false);
  }, [editingTicket, isOpen]);

  const applyParsedTicketData = (data: any) => {
    const {
      tickets: extractedTickets,
      pnr: extractedPnr,
      travelerName: extractedTraveler,
      travelersList: extractedTravelersList,
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
      costPrice: extractedCost,
      sellingPrice: extractedSelling,
      supplier: extractedSupplier,
      reissueCategory: extractedReissueCat,
      isGroupBooking: extractedGroupBooking,
      groupName: extractedGroupName,
      groupSize: extractedGroupSize
    } = data;

    const isGroup = Boolean(extractedGroupBooking || (Array.isArray(extractedTickets) && extractedTickets.length > 1) || (Array.isArray(extractedTravelersList) && extractedTravelersList.length > 1));

    if (Array.isArray(extractedTickets) && extractedTickets.length > 0) {
      setTicketNumbersText(extractedTickets.join('\n'));
    }
    if (isGroup) {
      setIsGroupBooking(true);
      if (extractedGroupName) setGroupName(extractedGroupName);
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

    // Pricing extraction
    const finalSell = extractedSelling || extractedTotal || 0;
    if (finalSell > 0) {
      setSellingPrice(String(finalSell));
      setTotalRefundable(String(finalSell));
      setSellingPerPax(String(finalSell));
    }
    if (extractedCost && extractedCost > 0) {
      setCostPrice(String(extractedCost));
      setCostPerPax(String(extractedCost));
    }

    // Build group travelers if multiple detected
    if (Array.isArray(extractedTravelersList) && extractedTravelersList.length > 0) {
      const trvs = extractedTravelersList.map((name: string, i: number) => ({
        id: `trv-${Date.now()}-${i}`,
        name: name.toUpperCase(),
        ticketNo: (extractedTickets && extractedTickets[i]) ? extractedTickets[i] : ''
      }));
      setGroupTravelers(trvs);
      setGroupSize(trvs.length);
    } else if (Array.isArray(extractedTickets) && extractedTickets.length > 1) {
      const trvs = extractedTickets.map((tNo: string, i: number) => ({
        id: `trv-${Date.now()}-${i}`,
        name: i === 0 && extractedTraveler ? extractedTraveler.toUpperCase() : `PASSENGER ${i + 1}`,
        ticketNo: tNo
      }));
      setGroupTravelers(trvs);
      setGroupSize(trvs.length);
    }

    if (extractedSupplier) setSupplier(extractedSupplier);
    if (extractedReissueCat) setReissueCategory(extractedReissueCat);

    setScanStatus({
      type: 'success',
      message: isGroup
        ? `✨ AI Extraction Complete: Group booking detected with shared PNR (${extractedTickets?.length || extractedTravelersList?.length || 2} passengers)!`
        : '✨ Air ticket AI extraction completed successfully! Flight and ticket details populated.'
    });
  };

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
          applyParsedTicketData(result.data);
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

  const handleScanTicketFromUrl = async () => {
    const rawUrl = ticketLinkUrl.trim();
    if (!rawUrl) {
      setScanStatus({
        type: 'error',
        message: 'Please paste a valid GitHub ticket document link or image URL.'
      });
      return;
    }

    const normalized = normalizeGitHubUrl(rawUrl);
    const fileName = rawUrl.split('/').pop()?.split('?')[0] || 'ticket_document_github.jpg';

    setIsScanningTicket(true);
    setScanStatus(null);

    try {
      const response = await fetch('/api/parse-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: normalized }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        if (result.imageAttachment) {
          setTicketAttachment(result.imageAttachment);
          setTicketFileName(fileName);
        }
        applyParsedTicketData(result.data);
      } else if (result.imageAttachment) {
        setTicketAttachment(result.imageAttachment);
        setTicketFileName(fileName);
        setScanStatus({
          type: 'error',
          message: result.error || 'Ticket document attached from GitHub! Please review details.'
        });
      } else {
        // Fallback: direct client fetch
        try {
          const directRes = await fetch(normalized);
          if (directRes.ok) {
            const blob = await directRes.blob();
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              setTicketAttachment(dataUrl);
              setTicketFileName(fileName);
            };
            reader.readAsDataURL(blob);
            setScanStatus({
              type: 'error',
              message: 'Ticket document retrieved and attached from GitHub link! Please enter ticket details manually.'
            });
            return;
          }
        } catch (cErr) {
          console.warn('Ticket client fetch error:', cErr);
        }

        setScanStatus({
          type: 'error',
          message: result.error || 'Could not scan ticket from GitHub link. Verify that the URL is publicly accessible.'
        });
      }
    } catch (err: any) {
      console.error('Ticket link scan error:', err);
      setScanStatus({
        type: 'error',
        message: 'Could not connect to ticket scanner. Please verify the URL or upload the file directly.'
      });
    } finally {
      setIsScanningTicket(false);
    }
  };

  // Group passenger row helpers
  const handleAddTravelerRow = () => {
    const newIdx = groupTravelers.length + 1;
    setGroupTravelers(prev => [
      ...prev,
      { id: `trv-${Date.now()}-${newIdx}`, name: '', ticketNo: '' }
    ]);
    setGroupSize(prev => Math.max(prev + 1, groupTravelers.length + 1));
  };

  const handleUpdateTravelerRow = (id: string, field: 'name' | 'ticketNo', val: string) => {
    setGroupTravelers(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveTravelerRow = (id: string) => {
    if (groupTravelers.length <= 1) return;
    setGroupTravelers(prev => prev.filter(item => item.id !== id));
    setGroupSize(prev => Math.max(1, prev - 1));
  };

  const handleParseBulkPaste = () => {
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: Array<{ id: string; name: string; ticketNo: string }> = [];

    lines.forEach((line, idx) => {
      // Remove leading numbers like "1.", "1 -", etc.
      const cleanLine = line.replace(/^\d+[\.\-\)]\s*/, '').trim();
      let name = '';
      let tNo = '';

      if (cleanLine.includes('-')) {
        const parts = cleanLine.split('-');
        name = parts[0].trim();
        tNo = parts[1].trim();
      } else if (cleanLine.includes(',')) {
        const parts = cleanLine.split(',');
        name = parts[0].trim();
        tNo = parts[1].trim();
      } else {
        // Try regex match for ticket number (10 to 14 digits)
        const match = cleanLine.match(/(\d{10,14})/);
        if (match) {
          tNo = match[1];
          name = cleanLine.replace(match[1], '').trim();
        } else {
          name = cleanLine;
        }
      }

      parsed.push({
        id: `trv-${Date.now()}-${idx}`,
        name: name.toUpperCase(),
        ticketNo: tNo
      });
    });

    if (parsed.length > 0) {
      setGroupTravelers(parsed);
      setGroupSize(parsed.length);
      setIsGroupBooking(true);
      const allTickets = parsed.map(p => p.ticketNo).filter(Boolean);
      if (allTickets.length > 0) {
        setTicketNumbersText(allTickets.join('\n'));
      }
      setShowBulkPasteModal(false);
      setBulkPasteText('');
    }
  };

  // Real-time financial calculations
  const effectivePaxCount = isGroupBooking 
    ? Math.max(1, groupTravelers.length > 0 ? groupTravelers.length : (Number(groupSize) || 1)) 
    : 1;

  const computedFinancials = React.useMemo(() => {
    if (isGroupBooking) {
      if (pricingMode === 'per_pax') {
        const cPerPax = parseFloat(costPerPax) || 0;
        const sPerPax = parseFloat(sellingPerPax) || 0;
        const totalC = cPerPax * effectivePaxCount;
        const totalS = sPerPax * effectivePaxCount;
        const profit = totalS - totalC;
        const profitPax = sPerPax - cPerPax;
        const margin = totalS > 0 ? ((profit / totalS) * 100) : 0;
        return {
          totalCost: totalC,
          totalSelling: totalS,
          profit,
          costPerPax: cPerPax,
          sellingPerPax: sPerPax,
          profitPerPax: profitPax,
          margin: Math.round(margin * 10) / 10
        };
      } else {
        const totalC = parseFloat(costPrice) || 0;
        const totalS = parseFloat(sellingPrice) || (parseFloat(totalRefundable) || 0);
        const profit = totalS - totalC;
        const cPerPax = Math.round(totalC / effectivePaxCount);
        const sPerPax = Math.round(totalS / effectivePaxCount);
        const profitPax = Math.round(profit / effectivePaxCount);
        const margin = totalS > 0 ? ((profit / totalS) * 100) : 0;
        return {
          totalCost: totalC,
          totalSelling: totalS,
          profit,
          costPerPax: cPerPax,
          sellingPerPax: sPerPax,
          profitPerPax: profitPax,
          margin: Math.round(margin * 10) / 10
        };
      }
    } else {
      const totalC = parseFloat(costPrice) || 0;
      const totalS = parseFloat(sellingPrice) || (parseFloat(totalRefundable) || 0);
      const profit = totalS - totalC;
      const margin = totalS > 0 ? ((profit / totalS) * 100) : 0;
      return {
        totalCost: totalC,
        totalSelling: totalS,
        profit,
        costPerPax: totalC,
        sellingPerPax: totalS,
        profitPerPax: profit,
        margin: Math.round(margin * 10) / 10
      };
    }
  }, [isGroupBooking, pricingMode, costPrice, sellingPrice, costPerPax, sellingPerPax, totalRefundable, effectivePaxCount]);

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

    const todayStr = new Date().toLocaleDateString('en-GB');
    const routeStr = `${departureLocation || 'CMB'} → ${arrivalLocation || 'DXB'}`;

    const finalCost = computedFinancials.totalCost;
    const finalSelling = computedFinancials.totalSelling || parseFloat(totalRefundable) || 0;
    const finalProfit = computedFinancials.profit;
    const finalMargin = computedFinancials.margin;
    const finalCostPax = computedFinancials.costPerPax;
    const finalSellingPax = computedFinancials.sellingPerPax;
    const finalProfitPax = computedFinancials.profitPerPax;

    // Travelers array construction
    let finalTravelers: Traveler[] = [];
    if (isGroupBooking && groupTravelers.length > 0) {
      finalTravelers = groupTravelers.map((t, idx) => ({
        id: t.id || `trv-${Date.now()}-${idx}`,
        name: t.name.trim().toUpperCase() || `PASSENGER ${idx + 1}`,
        ticketNo: t.ticketNo.trim() || (ticketsList[idx] || `1572${Math.floor(100000000 + Math.random() * 900000000)}`),
        costPrice: finalCostPax,
        sellingPrice: finalSellingPax
      }));
    } else {
      finalTravelers = [
        {
          id: editingTicket?.travelers?.[0]?.id || `trv-${Date.now()}`,
          name: (travelerName || 'PASSENGER NAME').trim().toUpperCase(),
          ticketNo: (ticketsList[0] ?? editingTicket?.tickets?.[0] ?? '1572134128637'),
          costPrice: finalCost,
          sellingPrice: finalSelling
        }
      ];
    }

    const finalTicketsArray = isGroupBooking && groupTravelers.length > 0
      ? groupTravelers.map(t => t.ticketNo.trim()).filter(Boolean)
      : (ticketsList.length > 0 ? ticketsList : [`1572${Math.floor(100000000 + Math.random() * 900000000)}`]);

    if (editingTicket && onUpdateTicket) {
      const updatedTicket: TicketFollowup = {
        ...editingTicket,
        tickets: finalTicketsArray.length > 0 ? finalTicketsArray : editingTicket.tickets,
        newBooking: pnr || editingTicket.newBooking || 'N/A',
        pnr: pnr || editingTicket.pnr || 'DCYMLG',
        status: status,
        reissueCategory: reissueCategory,
        comment: comment || editingTicket.comment,
        quote: `${currency} ${finalSelling.toLocaleString()}`,
        customer: customer || editingTicket.customer,
        customerType: customerType,
        supplier: supplier || editingTicket.supplier,
        totalRefundable: finalSelling,
        refundAmount: finalSelling,
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
        travelers: finalTravelers,
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
        isGroupBooking: isGroupBooking,
        groupName: isGroupBooking ? (groupName.trim() || 'Group Booking') : undefined,
        groupSize: isGroupBooking ? effectivePaxCount : 1,
        pricingMode: isGroupBooking ? pricingMode : undefined,
        costPrice: finalCost,
        sellingPrice: finalSelling,
        profit: finalProfit,
        profitMargin: finalMargin,
        costPerPax: finalCostPax,
        sellingPerPax: finalSellingPax,
        profitPerPax: finalProfitPax,
        paymentStatus: isPaidPaymentStatus(paymentStatus) ? 'Paid' : isPartialPaymentStatus(paymentStatus) ? 'Partially Paid' : paymentStatus === 'Unpaid' ? 'Unpaid' : 'Pending',
        currency: currency
      };
      onUpdateTicket(updatedTicket);
    } else {
      const newTicket: TicketFollowup = {
        id: `tkt-${Date.now()}`,
        tickets: finalTicketsArray,
        newBooking: pnr || 'N/A',
        status: status,
        reissueCategory: reissueCategory,
        comment: comment || 'Ticket issued',
        quote: `${currency} ${finalSelling.toLocaleString()}`,
        outcome: 'Ticket Active & Tracked',
        customer: customer.trim() || 'Seagull Global',
        customerType: customerType,
        supplier: supplier || 'Standard Airline Supplier',
        requestDate: todayStr,
        pnr: pnr || 'DCYMLG',
        totalRefundable: finalSelling,
        refundAmount: finalSelling,
        serviceFee: 0,
        currency: currency,
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
        travelers: finalTravelers,
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
        isGroupBooking: isGroupBooking,
        groupName: isGroupBooking ? (groupName.trim() || 'Group Booking') : undefined,
        groupSize: isGroupBooking ? effectivePaxCount : 1,
        pricingMode: isGroupBooking ? pricingMode : undefined,
        costPrice: finalCost,
        sellingPrice: finalSelling,
        profit: finalProfit,
        profitMargin: finalMargin,
        costPerPax: finalCostPax,
        sellingPerPax: finalSellingPax,
        profitPerPax: finalProfitPax,
        paymentStatus: isPaidPaymentStatus(paymentStatus) ? 'Paid' : isPartialPaymentStatus(paymentStatus) ? 'Partially Paid' : paymentStatus === 'Unpaid' ? 'Unpaid' : 'Pending'
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

            {!ticketAttachment && (
              <div className="flex bg-slate-900/80 p-0.5 rounded-lg text-xs font-bold border border-slate-700/60 mb-2">
                <button
                  type="button"
                  onClick={() => setTicketSourceType('file')}
                  className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                    ticketSourceType === 'file' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketSourceType('link')}
                  className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                    ticketSourceType === 'link' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>GitHub / Web Link</span>
                </button>
              </div>
            )}

            {!ticketAttachment ? (
              ticketSourceType === 'file' ? (
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
                <div className="bg-blue-950/50 border border-blue-500/40 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-200 flex items-center space-x-1.5">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span>Scan from GitHub Link or Direct Image URL:</span>
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={ticketLinkUrl}
                      onChange={(e) => setTicketLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleScanTicketFromUrl();
                        }
                      }}
                      placeholder="https://github.com/.../ticket.jpg"
                      className="flex-1 min-w-0 bg-slate-900 border border-blue-500/50 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleScanTicketFromUrl()}
                      disabled={isScanningTicket || !ticketLinkUrl.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
                    >
                      {isScanningTicket ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      )}
                      <span>{isScanningTicket ? 'Scanning...' : 'Scan'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-300/80 leading-relaxed">
                    Paste any GitHub blob, raw, commit or file link of the e-ticket or boarding pass.
                  </p>
                </div>
              )
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

          {/* Section 2: Booking Reference & Passenger / Group Roster */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg ${isGroupBooking ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'}`}>
                  {isGroupBooking ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    {isGroupBooking ? 'Group Booking & Passenger Roster' : 'Individual Booking & Ticket'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {isGroupBooking 
                      ? 'Multiple passengers sharing same PNR with individual ticket numbers' 
                      : 'Single passenger booking with dedicated ticket number'}
                  </p>
                </div>
              </div>

              {/* Group Booking Toggle */}
              <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsGroupBooking(false)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
                    !isGroupBooking
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>Single Passenger</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsGroupBooking(true);
                    if (groupTravelers.length === 0) {
                      setGroupTravelers([
                        { id: `trv-${Date.now()}-1`, name: travelerName || 'PASSENGER 1', ticketNo: ticketNumbersText.split(/[\s,]+/)[0] || '' },
                        { id: `trv-${Date.now()}-2`, name: '', ticketNo: '' }
                      ]);
                      setGroupSize(2);
                    }
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
                    isGroupBooking
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Group Booking (Shared PNR)</span>
                </button>
              </div>
            </div>

            {/* PNR and (if Group) Group Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between text-xs">
                  <span>PNR / Booking Reference</span>
                  {isGroupBooking && (
                    <span className="text-[10px] text-indigo-700 font-extrabold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      ✓ Shared across all {groupTravelers.length || groupSize} pax
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value)}
                  placeholder="e.g. 6BHYAW or DCYMLG"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono uppercase font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {isGroupBooking ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Group Identifier / Tour Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Dubai Umrah Group - Nov 2026, Tech Delegation"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Passenger Full Name</label>
                  <input
                    type="text"
                    value={travelerName}
                    onChange={(e) => setTravelerName(e.target.value)}
                    placeholder="MR/MRS PASSENGER FULL NAME"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 uppercase font-bold text-slate-900"
                    required
                  />
                </div>
              )}
            </div>

            {/* Individual vs Group Passenger Management */}
            {isGroupBooking ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800">
                      Passenger Roster ({groupTravelers.length} Passengers)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      All passengers are recorded under PNR <strong className="font-mono text-slate-800">{pnr || 'DCYMLG'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setShowBulkPasteModal(true)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <ClipboardList className="w-3 h-3" />
                      <span>Bulk Paste Roster</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTravelerRow}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Passenger</span>
                    </button>
                  </div>
                </div>

                {/* Group Passenger Rows */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase sticky top-0 z-10">
                      <tr>
                        <th className="py-1.5 px-3 w-10 text-center">#</th>
                        <th className="py-1.5 px-3">Passenger Full Name</th>
                        <th className="py-1.5 px-3 w-48">E-Ticket Number</th>
                        <th className="py-1.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupTravelers.map((trv, idx) => (
                        <tr key={trv.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-1.5 px-3 text-center font-bold text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="text"
                              value={trv.name}
                              onChange={(e) => handleUpdateTravelerRow(trv.id, 'name', e.target.value)}
                              placeholder={`Passenger ${idx + 1} Name`}
                              className="w-full bg-transparent border-0 border-b border-slate-200 focus:border-indigo-600 focus:ring-0 p-1 font-bold uppercase text-slate-800 text-xs"
                              required
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="text"
                              value={trv.ticketNo}
                              onChange={(e) => handleUpdateTravelerRow(trv.id, 'ticketNo', e.target.value)}
                              placeholder="1572134128637"
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            {groupTravelers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTravelerRow(trv.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                                title="Remove Passenger"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Ticket Number(s) <span className="text-slate-400 font-normal">(13-14 digit e-ticket number)</span>
                </label>
                <textarea
                  value={ticketNumbersText}
                  onChange={(e) => setTicketNumbersText(e.target.value)}
                  placeholder="1572134128637 1572134128636"
                  rows={2}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  required
                />
              </div>
            )}
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
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  {customerType === 'Agency' ? 'Agency Name' : 'Customer Name'}
                </label>
                <input
                  type="text"
                  list="ticket-recorded-agencies"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Select or type Agency name"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
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
                <label className="font-bold text-slate-700 block mb-1 text-xs">GDS / Airline Supplier</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. Amadeus GDS, Galileo, SriLankan Direct"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Cost, Selling Price & Profit Calculation */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-xl border border-slate-700 shadow-md space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Financials & Profit Calculation</span>
                    {isGroupBooking && (
                      <span className="bg-indigo-500/30 text-indigo-300 text-[10px] px-2 py-0.2 rounded border border-indigo-400/40">
                        Group ({effectivePaxCount} Pax)
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Enter supplier cost and customer selling price to calculate profit and margin
                  </p>
                </div>
              </div>

              {/* Currency & Payment Status */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold">CUR:</span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                  >
                    <option value="LKR" className="bg-slate-800 text-white">LKR (Rs)</option>
                    <option value="USD" className="bg-slate-800 text-white">USD ($)</option>
                    <option value="AED" className="bg-slate-800 text-white">AED (د.إ)</option>
                    <option value="EUR" className="bg-slate-800 text-white">EUR (€)</option>
                    <option value="SAR" className="bg-slate-800 text-white">SAR (﷼)</option>
                    <option value="GBP" className="bg-slate-800 text-white">GBP (£)</option>
                  </select>
                </div>

                <select
                  value={isPaidPaymentStatus(paymentStatus) ? 'Paid' : isPartialPaymentStatus(paymentStatus) ? 'Partially Paid' : paymentStatus === 'Unpaid' ? 'Unpaid' : 'Pending'}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                    isPaidPaymentStatus(paymentStatus)
                      ? 'bg-emerald-900/60 border-emerald-500/50 text-emerald-300'
                      : isPartialPaymentStatus(paymentStatus)
                      ? 'bg-amber-900/60 border-amber-500/50 text-amber-300'
                      : 'bg-red-900/60 border-red-500/50 text-red-300'
                  }`}
                  title="Payment Status"
                >
                  <option value="Paid" className="bg-slate-900 text-white">✓ Paid / Fully Paid</option>
                  <option value="Partially Paid" className="bg-slate-900 text-white">⚡ Partially Paid</option>
                  <option value="Pending" className="bg-slate-900 text-white">⏳ Pending / Outstanding</option>
                  <option value="Unpaid" className="bg-slate-900 text-white">Unpaid</option>
                </select>
              </div>
            </div>

            {/* If Group Booking: Mode Selector */}
            {isGroupBooking && (
              <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-300">
                  Group Pricing Calculation Mode:
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setPricingMode('per_pax')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      pricingMode === 'per_pax'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white bg-slate-700/60'
                    }`}
                  >
                    Per Passenger (Per Pax)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('total')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      pricingMode === 'total'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white bg-slate-700/60'
                    }`}
                  >
                    Total Group Package
                  </button>
                </div>
              </div>
            )}

            {/* Input fields based on mode */}
            {isGroupBooking && pricingMode === 'per_pax' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                    <span>Cost Price Per Pax ({currency})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Supplier / GDS</span>
                  </label>
                  <input
                    type="number"
                    value={costPerPax}
                    onChange={(e) => setCostPerPax(e.target.value)}
                    placeholder="e.g. 130000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono font-bold text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Total Group Cost: <strong className="text-slate-200">{currency} {computedFinancials.totalCost.toLocaleString()}</strong> ({effectivePaxCount} pax)
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                    <span>Selling Price Per Pax ({currency})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Customer / Agency Quote</span>
                  </label>
                  <input
                    type="number"
                    value={sellingPerPax}
                    onChange={(e) => {
                      setSellingPerPax(e.target.value);
                      const num = parseFloat(e.target.value) || 0;
                      setTotalRefundable(String(num * effectivePaxCount));
                    }}
                    placeholder="e.g. 150000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Total Group Selling: <strong className="text-emerald-300">{currency} {computedFinancials.totalSelling.toLocaleString()}</strong> ({effectivePaxCount} pax)
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                    <span>Cost Price ({currency})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Supplier / GDS Net</span>
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="e.g. 130000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono font-bold text-white focus:border-blue-500 focus:outline-none"
                  />
                  {isGroupBooking && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Cost per Pax: <strong className="text-slate-200">{currency} {computedFinancials.costPerPax.toLocaleString()}</strong>
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                    <span>Selling Price / Quote ({currency})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Customer / Agency Gross</span>
                  </label>
                  <input
                    type="number"
                    value={sellingPrice || totalRefundable}
                    onChange={(e) => {
                      setSellingPrice(e.target.value);
                      setTotalRefundable(e.target.value);
                    }}
                    placeholder="e.g. 150000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  {isGroupBooking && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Selling per Pax: <strong className="text-emerald-300">{currency} {computedFinancials.sellingPerPax.toLocaleString()}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Calculated Profit & Margin Display Banner */}
            <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              computedFinancials.profit >= 0
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/60 border-red-500/40 text-red-200'
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg ${
                  computedFinancials.profit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {computedFinancials.profit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                    {computedFinancials.profit >= 0 ? 'Calculated Net Profit' : 'Net Loss Alert'}
                  </span>
                  <div className="text-xl font-black font-mono tracking-tight flex items-baseline gap-1.5">
                    <span>{currency} {computedFinancials.profit.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-extrabold ${
                      computedFinancials.profit >= 0 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/30 text-red-300'
                    }`}>
                      {computedFinancials.margin > 0 ? `+${computedFinancials.margin}%` : `${computedFinancials.margin}%`} Margin
                    </span>
                  </div>
                </div>
              </div>

              {isGroupBooking && (
                <div className="text-right text-xs space-y-0.5 border-l border-emerald-500/20 pl-3">
                  <div className="text-[10px] opacity-75 font-semibold uppercase">Profit Per Pax</div>
                  <div className="font-mono font-bold text-white text-sm">
                    {currency} {computedFinancials.profitPerPax.toLocaleString()} / pax
                  </div>
                </div>
              )}
            </div>

            {/* Category & Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
              <div>
                <label className="font-bold text-slate-300 block mb-1 text-xs">Reissue / Issue Category</label>
                <select
                  value={reissueCategory}
                  onChange={(e) => setReissueCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-semibold text-white text-xs cursor-pointer"
                >
                  <option value="New Issue">New Issue</option>
                  <option value="Standard Reissue">Standard Reissue</option>
                  <option value="Full Refund">Full Refund</option>
                  <option value="No-Show Waiver">No-Show Waiver</option>
                  <option value="Name Correction">Name Correction</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1 text-xs">Initial Ticket Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-white text-xs cursor-pointer"
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
              <label className="font-bold text-slate-300 block mb-1 text-xs">Operational Comments / Notes</label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Confirmed on GDS, ticket emailed to customer"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs placeholder:text-slate-500"
              />
            </div>
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

        {/* Bulk Paste Modal */}
        {showBulkPasteModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">Bulk Paste Passenger Roster</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkPasteModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Paste names and ticket numbers (one per line). Formats supported:<br />
                <code className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded text-[11px]">JOHN DOE - 1572134128637</code> or <code className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded text-[11px]">JOHN DOE, 1572134128637</code> or simply passenger names.
              </p>

              <textarea
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder={`1. AHMED MOHAMED - 1572134128637\n2. FATHIMA MOHAMED - 1572134128638\n3. ZAYN MOHAMED - 1572134128639`}
                rows={6}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkPasteModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseBulkPaste}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                >
                  Import Passenger Roster
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

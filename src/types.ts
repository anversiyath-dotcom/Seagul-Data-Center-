export type CustomerType = 'Agency' | 'Customer';

export type TicketStatus = 
  | 'In-Progress' 
  | 'Approved' 
  | 'Issued / Confirmed'
  | 'Flown'
  | 'Declined' 
  | 'Completed' 
  | 'Cancelled' 
  | 'Standard Reissue' 
  | 'Pending Quote';

export type VisaStatus = 
  | 'In Process'
  | 'Posted' 
  | 'Documents Required'
  | 'Approved' 
  | 'Rejected' 
  | 'Cancelled' 
  | 'Refund' 
  | 'Used' 
  | 'Extended' 
  | 'Closed' 
  | 'OutPass' 
  | 'Not Confirmed';

export interface Traveler {
  id: string;
  name: string;
  ticketNo: string;
}

export interface ItineraryLeg {
  id: string;
  route: string; // e.g. "CMB -> DXB"
  flightNo?: string;
  dateTime: string;
}

export interface TimelineStep {
  id: string;
  title: 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'DECLINED' | string;
  date: string;
  completed: boolean;
  active?: boolean;
}

export interface TicketFollowup {
  id: string;
  tickets: string[]; // e.g. ["1572134128637", "1572134128636"]
  newBooking?: string;
  status: TicketStatus;
  reissueCategory?: string; // e.g. "Standard Reissue"
  comment: string;
  quote?: string;
  outcome?: string;
  customer: string;
  customerType?: CustomerType; // 'Agency' vs 'Customer'
  supplier: string;
  requestDate: string;
  pnr: string;
  totalRefundable: number;
  refundAmount: number;
  serviceFee: number;
  currency: string; // default "LKR"
  timeline: TimelineStep[];
  refundReason: string;
  airline: string;
  flyDate?: string; // e.g. "18/08/2026"
  departureLocation?: string; // e.g. "Colombo (CMB)"
  arrivalLocation?: string; // e.g. "Dubai (DXB)"
  returnDate?: string; // e.g. "28/08/2026" or "N/A"
  tripType?: 'One Way' | 'Round Trip' | 'Multi-City';
  flightNo?: string; // e.g. "UL 225"
  departureTime?: string; // e.g. "10:30 AM" or "18:45"
  arrivalTime?: string; // e.g. "02:15 PM" or "22:30"
  returnFlightNo?: string; // e.g. "UL 226"
  returnAirline?: string;
  returnDepartureTime?: string; // e.g. "14:20" or "02:20 PM"
  returnArrivalTime?: string; // e.g. "20:45" or "08:45 PM"
  cabinClass?: 'Economy' | 'Premium Economy' | 'Business' | 'First';
  baggageAllowance?: string; // e.g. "30 Kg"
  specialRequests?: string; // e.g. "Wheelchair, Non-Veg Meal"
  travelers: Traveler[];
  itinerary: ItineraryLeg[];
  createdAt: string;
  ticketAttachment?: string; // Base64 or Data URL of attached e-ticket document/image
  ticketFileName?: string;
  isGroupBooking?: boolean; // Group booking / Multi-passenger sharing same PNR
  hideCustomer?: boolean;
  hideSupplier?: boolean;
  hideRefundable?: boolean;
}

export type VisaPaymentStatus = 'Paid' | 'Pending' | 'Partially Paid';

export const VISA_CATEGORIES = [
  '30 Days Single Entry',
  '30 Days Multiple Entry',
  '60 Days Single Entry',
  '60 Days Multiple Entry',
  '6 Months Tourist Multiple Entry',
  '6 Months Business Multiple Entry',
  '1 Year Tourist Multiple Entry',
  '1 Year Business Multiple Entry'
] as const;

export type VisaCategory = typeof VISA_CATEGORIES[number] | string;

export interface VisaFollowup {
  id: string;
  submissionDate: string;
  lastName: string;
  firstName: string;
  passportNo: string;
  passportExpiry: string; // DD/MM/YYYY
  nationality?: string; // Country of Citizenship / Nationality e.g. "SRI LANKAN"
  destinationCountry?: string; // Target country for visa processing e.g. "United Arab Emirates (UAE)"
  visaCategory: string; // e.g. "60 Days (P)", "30 Days (P)", "Umrah Visa"
  entryDate: string; // DD/MM/YYYY or "N/A"
  expiryDate?: string; // DD/MM/YYYY
  status: VisaStatus;
  customer?: string;
  customerType?: CustomerType; // 'Agency' vs 'Customer'
  remarks?: string;
  supplier?: string; // Visa Supplier / Provider / Issuing Partner e.g. "Rayna Tours", "Musafir B2B"
  purchasingPrice?: number; // Cost / Purchasing Price
  sellingPrice?: number; // Selling / Invoiced Price to Agency / Customer
  paymentStatus?: VisaPaymentStatus; // 'Paid' | 'Pending' | 'Partially Paid'
  currency?: string; // Currency e.g. "AED", "LKR", "USD" (default "AED")
  passportAttachment?: string; // Base64 or Data URL of attached passport document/image
  passportFileName?: string;
  visaAttachment?: string; // Base64 or Data URL of attached visa document/e-visa
  visaFileName?: string;
  unifiedNumber?: string; // UAE Unified No. (UID / UDB) e.g. "123456789"
  dob?: string; // Date of Birth DD/MM/YYYY
  icpFileNo?: string; // Optional ICP Application / File Number
  lastCheckedAt?: string; // e.g. "08/08/2026 14:30"
  autoCheckEnabled?: boolean;
  createdAt: string;
}

export interface ActivityComment {
  id: string;
  targetType: 'ticket' | 'visa';
  targetId: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface CompanyProfile {
  companyName: string;
  tagline: string;
  negomboAddress: string;
  negomboPhone: string;
  dubaiAddress: string;
  dubaiPhone: string;
  email: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'Seagull Global',
  tagline: 'Travel Ticket & Visa Application Workflow System',
  negomboAddress: '45/1/1 Meerigama Road, Pankada junction, Negombo',
  negomboPhone: '+94 70 170 4613',
  dubaiAddress: 'Coastal building, Al tawar center Dubai',
  dubaiPhone: '+971 52 263 6372',
  email: 'info@seagullglobal.lk'
};

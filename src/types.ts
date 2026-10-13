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
  passportNo?: string;
  costPrice?: number;
  sellingPrice?: number;
  profit?: number;
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

export type TicketPaymentStatus = 'Paid' | 'Pending' | 'Partially Paid' | 'Fully Paid' | 'Partial Paid' | 'Unpaid';

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
  groupName?: string; // Custom group name or reference e.g. "Sri Lanka Pilgrim Group"
  groupSize?: number; // Total number of passengers in group
  pricingMode?: 'total' | 'per_pax'; // Mode of pricing input
  costPrice?: number; // Airline Net Purchasing Cost (Total)
  sellingPrice?: number; // Selling Invoiced Price (Total)
  profit?: number; // Total Net Profit (sellingPrice - costPrice)
  profitMargin?: number; // Profit Margin %
  costPerPax?: number; // Net Cost per passenger
  sellingPerPax?: number; // Selling price per passenger
  profitPerPax?: number; // Net profit per passenger
  paymentStatus?: TicketPaymentStatus; // Payment collection status
  hideCustomer?: boolean;
  hideSupplier?: boolean;
  hideRefundable?: boolean;
  branch?: BranchOffice; // 'Dubai' | 'Negombo'
}

export type BranchOffice = 'Dubai' | 'Negombo';
export type BranchFilter = 'All' | 'Dubai' | 'Negombo';

export const BRANCH_CONFIG = {
  Dubai: {
    id: 'Dubai',
    name: 'Dubai Branch',
    shortName: 'Dubai',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    location: 'Coastal building, Al tawar center Dubai',
    phone: '+971 52 263 6372',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  Negombo: {
    id: 'Negombo',
    name: 'Negombo Branch',
    shortName: 'Negombo',
    country: 'Sri Lanka',
    flag: '🇱🇰',
    currency: 'LKR',
    location: '45/1/1 Meerigama Road, Pankada junction, Negombo',
    phone: '+94 70 170 4613',
    color: 'blue',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
  },
} as const;

export type VisaPaymentStatus = 'Paid' | 'Pending' | 'Partially Paid';

export const DUBAI_SERVICES_CATEGORIES = [
  'Golden Visa - Skilled Worker',
  'Family Entry Permit (Inside Country)',
  'Family Entry Permit (Outside Country)',
  'Golden Visa - Property Investor',
  'Family Visa 1 Month (Outside Country)',
  'Family Visit 1 Month (Inside Country)',
  'Family Visit 3 Months (Outside Country)',
  'Family Visit 3 Months (Inside Country)',
  '2 Years Freelancer Visa (Inside Country)',
  '2 Years Freelancer Visa (Outside Country)',
  'Company Setup',
  'Family Residency Visa Renewal',
  'Schengen Visa Services',
  'Equivalency Certificate Services',
  'Visa Cancellation',
  '30 Days Single Entry',
  '60 Days Single Entry',
  '30 Days Multiple Entry',
  '60 Days Multiple Entry'
] as const;

export const SRI_LANKA_VISA_CATEGORIES = [
  '30 Days Single Entry',
  '30 Days Multiple Entry',
  '60 Days Single Entry',
  '60 Days Multiple Entry',
  '6 Months Tourist Multiple Entry',
  '6 Months Business Multiple Entry',
  '1 Year Tourist Multiple Entry',
  '1 Year Business Multiple Entry',
  'Transit Visa',
  'Work / Employment Visa'
] as const;

export const VISA_CATEGORIES = [
  ...DUBAI_SERVICES_CATEGORIES,
  '6 Months Tourist Multiple Entry',
  '6 Months Business Multiple Entry',
  '1 Year Tourist Multiple Entry',
  '1 Year Business Multiple Entry',
  'Transit Visa',
  'Work / Employment Visa'
] as const;

export type VisaCategory = typeof VISA_CATEGORIES[number] | string;

export function getCategoriesForBranch(branch?: BranchOffice | BranchFilter | string): readonly string[] {
  if (branch === 'Dubai') {
    return DUBAI_SERVICES_CATEGORIES;
  }
  if (branch === 'Negombo') {
    return SRI_LANKA_VISA_CATEGORIES;
  }
  const set = new Set<string>([...DUBAI_SERVICES_CATEGORIES, ...SRI_LANKA_VISA_CATEGORIES]);
  return Array.from(set);
}

export interface VisaGroupMember {
  id: string;
  lastName: string;
  firstName: string;
  passportNo: string;
  passportExpiry: string; // DD/MM/YYYY
  nationality?: string;
  dob?: string;
  unifiedNumber?: string;
  icpFileNo?: string;
  passportAttachment?: string;
  passportFileName?: string;
  photoAttachment?: string; // Base64 or Data URL of applicant photo
  photoFileName?: string;
  visaAttachment?: string;
  visaFileName?: string;
  branch?: BranchOffice;
}

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
  photoAttachment?: string; // Base64 or Data URL of applicant passport-size photo
  photoFileName?: string;
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

  // Group Visa Application
  isGroup?: boolean; // True if this visa application was submitted as part of a group
  groupName?: string; // e.g. "Al-Noor Umrah Group" or "Silva Family Tour"
  groupId?: string; // Shared unique group identifier linking all members
  groupSize?: number; // Total number of applicants in this group
  groupMemberIndex?: number; // 1-based index (e.g. Applicant 1 of 5)
  groupMembers?: VisaGroupMember[]; // List of all applicants in this group
  pricingMode?: 'total' | 'per_pax'; // Mode of pricing calculation
  costPerPax?: number;
  sellingPerPax?: number;
  branch?: BranchOffice; // 'Dubai' | 'Negombo'
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

export type ExpenseCategory =
  | 'Office Rent & Tenancy'
  | 'Salaries & Staff Commissions'
  | 'Utilities, Electricity & Water'
  | 'Internet, Telecom & Phone'
  | 'Marketing, Ads & Promotion'
  | 'Government, Typing & Portal Fees'
  | 'Trade License & Legal Fees'
  | 'Software, IT & Subscriptions'
  | 'Office Supplies, Courier & Printing'
  | 'Bank Charges & Currency Exchange'
  | 'Travel, Fuel & Transportation'
  | 'Refreshments & Hospitality'
  | 'Miscellaneous Overhead';

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'Office Rent & Tenancy',
  'Salaries & Staff Commissions',
  'Utilities, Electricity & Water',
  'Internet, Telecom & Phone',
  'Marketing, Ads & Promotion',
  'Government, Typing & Portal Fees',
  'Trade License & Legal Fees',
  'Software, IT & Subscriptions',
  'Office Supplies, Courier & Printing',
  'Bank Charges & Currency Exchange',
  'Travel, Fuel & Transportation',
  'Refreshments & Hospitality',
  'Miscellaneous Overhead'
] as const;

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  currency: 'AED' | 'LKR' | 'USD' | string;
  branch: BranchOffice; // 'Dubai' | 'Negombo'
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Online' | string;
  vendor?: string;
  receiptNo?: string;
  notes?: string;
  createdAt: string;
}


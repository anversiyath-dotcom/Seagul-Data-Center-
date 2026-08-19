import { VisaStatus, TicketStatus } from '../types';

export function getVisaStatusBadgeClass(status: VisaStatus): string {
  switch (status) {
    case 'In Process':
      return 'bg-[#F39C12] text-white font-medium hover:bg-[#D68910] transition-colors'; // Orange / Amber
    case 'Posted':
      return 'bg-[#42A5F5] text-white font-medium hover:bg-[#1E88E5] transition-colors'; // Light Blue pill
    case 'Documents Required':
      return 'bg-[#8E44AD] text-white font-medium hover:bg-[#7D3C98] transition-colors'; // Deep Purple
    case 'Approved':
      return 'bg-[#2ECC71] text-white font-medium hover:bg-[#27AE60] transition-colors'; // Green
    case 'Rejected':
      return 'bg-[#E74C3C] text-white font-medium hover:bg-[#C0392B] transition-colors'; // Red
    case 'Cancelled':
      return 'bg-[#7F8C8D] text-white font-medium hover:bg-[#626567] transition-colors'; // Slate
    case 'Refund':
      return 'bg-[#9B59B6] text-white font-medium hover:bg-[#8E44AD] transition-colors'; // Purple
    case 'Used':
      return 'bg-[#16A085] text-white font-medium hover:bg-[#117A65] transition-colors'; // Teal/Emerald from Image 6
    case 'Extended':
      return 'bg-[#3498DB] text-white font-medium hover:bg-[#2980B9] transition-colors'; // Dodger Blue from Image 5
    case 'Closed':
      return 'bg-[#2C3E50] text-white font-medium hover:bg-[#1A252F] transition-colors'; // Navy
    case 'OutPass':
      return 'bg-[#5D6D7E] text-white font-medium hover:bg-[#4A5568] transition-colors'; // Slate Gray
    case 'Not Confirmed':
    default:
      return 'bg-[#95A5A6] text-white font-medium hover:bg-[#7F8C8D] transition-colors'; // Gray from Image 7
  }
}

export function getTicketStatusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case 'In-Progress':
      return 'bg-[#3498DB] text-white text-xs px-2.5 py-0.5 rounded-full font-medium';
    case 'Issued / Confirmed':
      return 'bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold shadow-xs';
    case 'Flown':
      return 'bg-purple-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold';
    case 'Approved':
      return 'bg-[#2ECC71] text-white text-xs px-2.5 py-0.5 rounded-full font-medium';
    case 'Completed':
      return 'bg-[#10B981] text-white text-xs px-2.5 py-0.5 rounded-full font-medium';
    case 'Standard Reissue':
      return 'bg-[#FEF0D9] text-[#D97706] border border-[#FDE68A] text-xs px-2.5 py-0.5 rounded-full font-medium';
    case 'Pending Quote':
      return 'bg-amber-500 text-white text-xs px-2.5 py-0.5 rounded-full font-medium';
    case 'Declined':
      return 'bg-[#E74C3C] text-white text-xs px-2.5 py-0.5 rounded-full font-medium';
    case 'Cancelled':
      return 'bg-[#6B7280] text-white text-xs px-2.5 py-0.5 rounded-full font-medium';
    default:
      return 'bg-[#9CA3AF] text-white text-xs px-2.5 py-0.5 rounded-full font-medium';
  }
}

export function formatLKR(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0
  }).format(amount).replace('LKR', 'LKR ');
}

export function computeValidityText(expiryDateStr?: string): { mainText: string; subText?: string; isExpired: boolean } {
  if (!expiryDateStr || expiryDateStr === 'N/A') {
    return { mainText: 'N/A', isExpired: false };
  }

  // Expecting format DD/MM/YYYY
  const parts = expiryDateStr.split('/');
  if (parts.length !== 3) {
    return { mainText: expiryDateStr, isExpired: false };
  }

  const expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  const today = new Date();
  
  // Calculate difference in days
  const diffTime = today.getTime() - expDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      mainText: `Expired (${diffDays}d ago)`,
      subText: `(Exp: ${expiryDateStr})`,
      isExpired: true
    };
  } else {
    const daysLeft = Math.abs(diffDays);
    return {
      mainText: `Valid (${daysLeft} days left)`,
      subText: `(Exp: ${expiryDateStr})`,
      isExpired: false
    };
  }
}

export function getVisaDurationDays(category: string): number {
  if (!category) return 30;
  const lower = category.toLowerCase();

  // 1 Year Visas (Tourist / Business Multiple Entry)
  if (lower.includes('1 year') || lower.includes('1 yr') || lower.includes('365') || lower.includes('one year')) {
    return 365;
  }

  // 6 Months Visas (Tourist / Business Multiple Entry)
  if (lower.includes('6 month') || lower.includes('6m') || lower.includes('180') || lower.includes('six month')) {
    return 180;
  }

  // 90 Days Visas
  if (lower.includes('90 day') || lower.includes('90d') || lower.includes('90')) {
    return 90;
  }

  // 60 Days Visas (Single / Multiple Entry)
  if (lower.includes('60 day') || lower.includes('60d') || lower.includes('60')) {
    return 60;
  }

  // 30 Days Visas (Single / Multiple Entry)
  if (lower.includes('30 day') || lower.includes('30d') || lower.includes('30')) {
    return 30;
  }

  const match = category.match(/(\d+)\s*(days?|d|months?|m|years?|y)?/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    const unit = (match[2] || '').toLowerCase();
    if (!isNaN(parsed) && parsed > 0) {
      if (unit.startsWith('y')) return parsed * 365;
      if (unit.startsWith('m')) return parsed * 30;
      return parsed;
    }
  }

  return 30; // Default fallback
}

export function calculateVisaExpiryDate(entryDateStr: string, categoryStr: string): string | null {
  if (!entryDateStr || entryDateStr.trim().toUpperCase() === 'N/A') {
    return null;
  }

  const durationDays = getVisaDurationDays(categoryStr);
  const trimmed = entryDateStr.trim();
  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  // Check YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    // Check DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const parts = trimmed.split(/[/.-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        // DD/MM/YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
    }
  }

  if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
    return null;
  }

  if (year < 100) {
    year += 2000;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const entryDate = new Date(year, month - 1, day);
  if (isNaN(entryDate.getTime())) {
    return null;
  }

  // Calculate expiry: entry date + durationDays
  const expiryDate = new Date(entryDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);

  const expDay = String(expiryDate.getDate()).padStart(2, '0');
  const expMonth = String(expiryDate.getMonth() + 1).padStart(2, '0');
  const expYear = expiryDate.getFullYear();

  return `${expDay}/${expMonth}/${expYear}`;
}

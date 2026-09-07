/**
 * Date calculation and filtering utilities for Financial Accounting & Followups
 */

export type DatePreset = 'all' | 'today' | 'yesterday' | 'this_week' | 'last_7_days' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface DateRangePreset {
  id: DatePreset;
  label: string;
}

export const DATE_PRESETS: DateRangePreset[] = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_year', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
];

/**
 * Universal date parser that handles:
 * - DD/MM/YYYY (e.g. 07/09/2026 or 18/08/2026)
 * - YYYY-MM-DD (e.g. 2026-09-07)
 * - DD-MM-YYYY (e.g. 07-09-2026)
 * - ISO string (e.g. 2026-09-07T12:00:00Z)
 */
export function parseFlexibleDate(dateStr?: string): Date | null {
  if (!dateStr || dateStr === 'N/A' || dateStr === 'Pending' || dateStr.trim() === '') {
    return null;
  }

  const clean = dateStr.trim();

  // If ISO string with T
  if (clean.includes('T')) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }

  // If separated by /
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);

      // Check if format is YYYY/MM/DD
      if (parts[0].length === 4) {
        if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
          return new Date(p0, p1 - 1, p2);
        }
      } else {
        // Assume DD/MM/YYYY
        if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
          return new Date(p2, p1 - 1, p0);
        }
      }
    }
  }

  // If separated by -
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);

      // YYYY-MM-DD
      if (parts[0].length === 4) {
        if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
          return new Date(p0, p1 - 1, p2);
        }
      } else {
        // DD-MM-YYYY
        if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
          return new Date(p2, p1 - 1, p0);
        }
      }
    }
  }

  const fallback = new Date(clean);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}

/**
 * Format a Date object to YYYY-MM-DD for HTML <input type="date">
 */
export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date or date string to readable display (e.g. "07 Sep 2026")
 */
export function formatReadableDate(d: Date | string | null | undefined): string {
  if (!d) return 'N/A';
  const dateObj = typeof d === 'string' ? parseFlexibleDate(d) : d;
  if (!dateObj || isNaN(dateObj.getTime())) return typeof d === 'string' ? d : 'N/A';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Compute start and end Date for a given preset
 */
export function getPresetDateRange(presetId: string, referenceDate = new Date()): { start: string; end: string } {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  let start = new Date(ref);
  let end = new Date(ref);

  switch (presetId) {
    case 'today':
      start = new Date(ref);
      end = new Date(ref);
      break;

    case 'yesterday':
      start.setDate(ref.getDate() - 1);
      end.setDate(ref.getDate() - 1);
      break;

    case 'this_week': {
      // Monday as start of week
      const day = ref.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      start.setDate(ref.getDate() + diffToMonday);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      break;
    }

    case 'last_7_days':
      start.setDate(ref.getDate() - 6);
      end = new Date(ref);
      break;

    case 'this_month':
      start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      break;

    case 'last_month':
      start = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      end = new Date(ref.getFullYear(), ref.getMonth(), 0);
      break;

    case 'this_year':
      start = new Date(ref.getFullYear(), 0, 1);
      end = new Date(ref.getFullYear(), 11, 31);
      break;

    case 'all':
    default:
      return { start: '', end: '' };
  }

  return {
    start: formatDateToYYYYMMDD(start),
    end: formatDateToYYYYMMDD(end),
  };
}

export const getDateRangePreset = getPresetDateRange;

/**
 * Check if a given date string falls within [startDateStr, endDateStr] inclusive
 */
export function isDateInRange(
  dateStr?: string,
  startDateStr?: string,
  endDateStr?: string
): boolean {
  if (!startDateStr && !endDateStr) return true; // No filter
  if (!dateStr) return false;

  const target = parseFlexibleDate(dateStr);
  if (!target) return false;
  target.setHours(0, 0, 0, 0);

  if (startDateStr) {
    const start = parseFlexibleDate(startDateStr);
    if (start) {
      start.setHours(0, 0, 0, 0);
      if (target.getTime() < start.getTime()) {
        return false;
      }
    }
  }

  if (endDateStr) {
    const end = parseFlexibleDate(endDateStr);
    if (end) {
      end.setHours(23, 59, 59, 999);
      if (target.getTime() > end.getTime()) {
        return false;
      }
    }
  }

  return true;
}

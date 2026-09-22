/**
 * Payment Status Utilities for Tickets & Visas
 * Provides robust, case-insensitive, normalized status checks
 * across the entire application and financial accounting ledger.
 */

export type NormalizedPaymentStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Unpaid';

/**
 * Checks if a payment status represents a paid/settled invoice.
 * Handles 'Paid', 'Fully Paid', 'paid', 'PAID', 'Settled', etc.
 */
export function isPaidPaymentStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toString().trim().toLowerCase();
  if (s.includes('unpaid') || s.includes('not paid') || s.includes('pending') || s.includes('part')) {
    return false;
  }
  return (
    s === 'paid' ||
    s === 'fully paid' ||
    s === 'full paid' ||
    s === 'full' ||
    s === 'settled' ||
    s.includes('paid')
  );
}

/**
 * Checks if a payment status is partially paid.
 */
export function isPartialPaymentStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toString().trim().toLowerCase();
  return s.includes('partial') || s.includes('part');
}

/**
 * Checks if a payment status is unpaid or pending collection.
 */
export function isUnpaidPaymentStatus(status?: string | null): boolean {
  if (!status) return true;
  return !isPaidPaymentStatus(status) && !isPartialPaymentStatus(status);
}

/**
 * Normalizes any payment status string to standard 3-tier presentation:
 * 'Paid' | 'Partially Paid' | 'Pending'
 */
export function normalizePaymentStatus(status?: string | null): 'Paid' | 'Partially Paid' | 'Pending' {
  if (isPaidPaymentStatus(status)) return 'Paid';
  if (isPartialPaymentStatus(status)) return 'Partially Paid';
  return 'Pending';
}

/**
 * Helper to get badge styling classes for payment status
 */
export function getPaymentStatusBadgeClass(status?: string | null): string {
  if (isPaidPaymentStatus(status)) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }
  if (isPartialPaymentStatus(status)) {
    return 'bg-amber-100 text-amber-800 border-amber-300';
  }
  return 'bg-red-100 text-red-800 border-red-300';
}

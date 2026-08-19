import { VisaFollowup } from '../types';

/**
 * Safe local storage utilities with automatic QuotaExceededError protection,
 * payload sanitization (stripping heavy attachments for local cache),
 * and automatic cleanup of oversized items.
 */

// Run immediate cleanup of bloated localStorage keys on module load to recover broken browser sessions
export function cleanupOversizedLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // Check if tf_visas is too large or causing issues
    const rawVisas = window.localStorage.getItem('tf_visas');
    if (rawVisas && rawVisas.length > 500000) { // > 500KB
      console.warn('tf_visas local cache exceeds 500KB. Clearing local cache to free quota.');
      window.localStorage.removeItem('tf_visas');
    }
  } catch (e) {
    try {
      window.localStorage.removeItem('tf_visas');
      window.localStorage.removeItem('tf_tickets');
      window.localStorage.removeItem('tf_comments');
    } catch {
      // Ignore if localStorage is completely blocked
    }
  }
}

// Immediately invoke on import
cleanupOversizedLocalStorage();

export function safeGetItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`SafeStorage: Failed to get or parse "${key}"`, err);
    return defaultValue;
  }
}

export function safeSetItem(key: string, value: any): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    console.warn(`SafeStorage: Failed to set "${key}" in localStorage (Quota or Security):`, err?.message || err);
    // If quota exceeded, clean up non-essential keys to free memory
    try {
      window.localStorage.removeItem('tf_visas');
      window.localStorage.removeItem('tf_tickets');
      window.localStorage.removeItem('tf_comments');
    } catch {
      // Ignore
    }
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`SafeStorage: Failed to remove "${key}"`, err);
  }
}

/**
 * Strips heavy base64 data URLs / image attachments before caching to localStorage.
 * Full data is safely preserved in Firestore and active React memory.
 */
export function sanitizeVisasForLocalCache(visas: VisaFollowup[]): any[] {
  if (!Array.isArray(visas)) return [];
  return visas.map(v => {
    // If passportAttachment or visaAttachment is a large base64 string, don't store in localStorage
    const { passportAttachment, visaAttachment, ...rest } = v;
    return rest;
  });
}

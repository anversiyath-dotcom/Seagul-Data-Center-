import { ALL_NATIONALITIES } from '../data/nationalities';

/**
 * Utility functions for handling GitHub URLs, raw image links, and Machine Readable Zone (MRZ) passport data
 */

/**
 * Normalizes any GitHub URL to a direct raw downloadable file URL
 * Handles:
 * - https://github.com/owner/repo/blob/main/path/to/image.jpg
 * - https://github.com/owner/repo/raw/main/path/to/image.jpg
 * - https://github.com/owner/repo/blob/main/path/to/image.jpg?raw=true
 * - https://raw.githubusercontent.com/owner/repo/main/path/to/image.jpg
 */
export function normalizeGitHubUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();

  // Clean surrounding quotes, markdown brackets or angle brackets
  cleaned = cleaned.replace(/^[<"'\s]+|[>"'\s]+$/g, '');
  const mdMatch = cleaned.match(/\((https?:\/\/[^\s)]+)\)/);
  if (mdMatch) cleaned = mdMatch[1];

  // Already a raw GitHub URL? Keep it
  if (cleaned.startsWith('https://raw.githubusercontent.com/')) {
    return cleaned;
  }

  // Pattern: https://github.com/:owner/:repo/blob/:branch/:path
  const blobMatch = cleaned.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(?:refs\/heads\/)?([^/]+)\/(.+)$/i);
  if (blobMatch) {
    const [, owner, repo, branch, filePath] = blobMatch;
    const cleanPath = filePath.split('?')[0];
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`;
  }

  // Pattern: https://github.com/:owner/:repo/raw/:branch/:path
  const rawMatch = cleaned.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/(?:refs\/heads\/)?([^/]+)\/(.+)$/i);
  if (rawMatch) {
    const [, owner, repo, branch, filePath] = rawMatch;
    const cleanPath = filePath.split('?')[0];
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`;
  }

  // Pattern: https://github.com/:owner/:repo/tree/:branch/:path
  const treeMatch = cleaned.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/(?:refs\/heads\/)?([^/]+)\/(.+)$/i);
  if (treeMatch) {
    const [, owner, repo, branch, filePath] = treeMatch;
    const cleanPath = filePath.split('?')[0];
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`;
  }

  // If github.com URL with ?raw=true
  if (cleaned.includes('github.com') && cleaned.includes('?raw=true')) {
    cleaned = cleaned.replace('/blob/', '/');
    cleaned = cleaned.replace('https://github.com/', 'https://raw.githubusercontent.com/');
    cleaned = cleaned.replace('http://github.com/', 'https://raw.githubusercontent.com/');
    cleaned = cleaned.split('?')[0];
  }

  return cleaned;
}

/**
 * Checks if a string is a valid web or GitHub URL
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

/**
 * Checks if a URL points to GitHub
 */
export function isGitHubUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('github.com') || lower.includes('githubusercontent.com');
}

/**
 * Country code to standard nationality name mapping (ICAO Doc 9303 codes)
 * Covers all world countries dynamically with fallback presets
 */
export const ICAO_COUNTRY_MAP: Record<string, string> = ALL_NATIONALITIES.reduce((acc, curr) => {
  acc[curr.code] = curr.nationality;
  return acc;
}, {
  LKA: 'SRI LANKAN',
  ARE: 'EMIRATI',
  IND: 'INDIAN',
  PAK: 'PAKISTANI',
  BGD: 'BANGLADESHI',
  NPL: 'NEPALESE',
  PHL: 'FILIPINO',
  EGY: 'EGYPTIAN',
  JOR: 'JORDANIAN',
  SYR: 'SYRIAN',
  LBN: 'LEBANESE',
  SAU: 'SAUDI',
  OMN: 'OMANI',
  QAT: 'QATARI',
  KWT: 'KUWAITI',
  BHR: 'BAHRAINI',
  MYS: 'MALAYSIAN',
  SGP: 'SINGAPOREAN',
  IDN: 'INDONESIAN',
  THA: 'THAI',
  TUR: 'TURKISH',
  GBR: 'BRITISH',
  USA: 'AMERICAN',
  CAN: 'CANADIAN',
  AUS: 'AUSTRALIAN',
} as Record<string, string>);

const MONTH_MAP: Record<string, string> = {
  JAN: '01', JANU: '01', JANUARY: '01',
  FEB: '02', FEBR: '02', FEBRUARY: '02',
  MAR: '03', MARC: '03', MARCH: '03',
  APR: '04', APRI: '04', APRIL: '04',
  MAY: '05',
  JUN: '06', JUNE: '06',
  JUL: '07', JULY: '07',
  AUG: '08', AUGU: '08', AUGUST: '08',
  SEP: '09', SEPT: '09', SEPTEMBER: '09',
  OCT: '10', OCTO: '10', OCTOBER: '10',
  NOV: '11', NOVE: '11', NOVEMBER: '11',
  DEC: '12', DECE: '12', DECEMBER: '12',
};

/**
 * Normalizes any date format into a full DD/MM/YYYY string with a 4-digit year.
 * Handles partial airline dates (25AUG, 25AUG26, 25/08), 2-digit years (21/02/35),
 * ISO strings (2026-08-25), and MRZ date strings (YYMMDD).
 */
export function normalizeToFullDate(raw?: string | null, isDob: boolean = false): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'N/A' || trimmed === 'Pending' || trimmed === 'undefined' || trimmed === 'null') {
    return trimmed === 'N/A' ? 'N/A' : '';
  }

  const currentYear = new Date().getFullYear();
  const currentYY = currentYear % 100;

  // 1. Standard DD/MM/YYYY
  const standardMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (standardMatch) {
    const d = standardMatch[1].padStart(2, '0');
    const m = standardMatch[2].padStart(2, '0');
    const y = standardMatch[3];
    return `${d}/${m}/${y}`;
  }

  // 2. DD/MM/YY (2-digit year)
  const dmyTwoMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (dmyTwoMatch) {
    const d = dmyTwoMatch[1].padStart(2, '0');
    const m = dmyTwoMatch[2].padStart(2, '0');
    const yy = parseInt(dmyTwoMatch[3], 10);
    const fullYear = isDob 
      ? (yy > currentYY ? 1900 + yy : 2000 + yy)
      : (yy > 70 ? 1900 + yy : 2000 + yy);
    return `${d}/${m}/${fullYear}`;
  }

  // 3. ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }

  // 4. DD-MM-YYYY or DD.MM.YYYY
  const dotDashMatch = trimmed.match(/^(\d{1,2})[-\.](\d{1,2})[-\.](\d{4})$/);
  if (dotDashMatch) {
    const d = dotDashMatch[1].padStart(2, '0');
    const m = dotDashMatch[2].padStart(2, '0');
    const y = dotDashMatch[3];
    return `${d}/${m}/${y}`;
  }

  // 5. DD-MM-YY or DD.MM.YY
  const dotDashTwoMatch = trimmed.match(/^(\d{1,2})[-\.](\d{1,2})[-\.](\d{2})$/);
  if (dotDashTwoMatch) {
    const d = dotDashTwoMatch[1].padStart(2, '0');
    const m = dotDashTwoMatch[2].padStart(2, '0');
    const yy = parseInt(dotDashTwoMatch[3], 10);
    const fullYear = isDob 
      ? (yy > currentYY ? 1900 + yy : 2000 + yy)
      : (yy > 70 ? 1900 + yy : 2000 + yy);
    return `${d}/${m}/${fullYear}`;
  }

  // 6. Airline ticket format: e.g. "25AUG", "25 AUG", "25-AUG", "25AUG26", "25AUG2026", "25-AUG-26", "25-AUG-2026"
  const airTicketMatch = trimmed.match(/^(\d{1,2})[\s\-\.]*([A-Za-z]{3,9})(?:[\s\-\.]*(\d{2,4}))?$/);
  if (airTicketMatch) {
    const d = airTicketMatch[1].padStart(2, '0');
    const monStr = airTicketMatch[2].toUpperCase();
    const m = MONTH_MAP[monStr] || MONTH_MAP[monStr.substring(0, 3)] || '01';
    let y = currentYear;
    if (airTicketMatch[3]) {
      const yStr = airTicketMatch[3];
      if (yStr.length === 2) {
        const yy = parseInt(yStr, 10);
        y = isDob ? (yy > currentYY ? 1900 + yy : 2000 + yy) : (yy > 70 ? 1900 + yy : 2000 + yy);
      } else {
        y = parseInt(yStr, 10);
      }
    }
    return `${d}/${m}/${y}`;
  }

  // 7. Month first format: "AUG 25", "AUG 25 2026", "Aug 25, 2026"
  const monFirstMatch = trimmed.match(/^([A-Za-z]{3,9})[\s\-\.]+(\d{1,2})(?:[,\s\-\.]+(\d{2,4}))?$/);
  if (monFirstMatch) {
    const monStr = monFirstMatch[1].toUpperCase();
    const m = MONTH_MAP[monStr] || MONTH_MAP[monStr.substring(0, 3)] || '01';
    const d = monFirstMatch[2].padStart(2, '0');
    let y = currentYear;
    if (monFirstMatch[3]) {
      const yStr = monFirstMatch[3];
      if (yStr.length === 2) {
        const yy = parseInt(yStr, 10);
        y = isDob ? (yy > currentYY ? 1900 + yy : 2000 + yy) : (yy > 70 ? 1900 + yy : 2000 + yy);
      } else {
        y = parseInt(yStr, 10);
      }
    }
    return `${d}/${m}/${y}`;
  }

  // 8. 6-digit MRZ YYMMDD e.g. "920815" or "350221"
  if (/^\d{6}$/.test(trimmed)) {
    const yy = parseInt(trimmed.substring(0, 2), 10);
    const m = trimmed.substring(2, 4);
    const d = trimmed.substring(4, 6);
    const fullYear = isDob ? (yy > currentYY ? 1900 + yy : 2000 + yy) : 2000 + yy;
    return `${d}/${m}/${fullYear}`;
  }

  // 9. Partial day/month only: "25/08" or "25-08" -> append currentYear
  const dmMatch = trimmed.match(/^(\d{1,2})[-\/.](\d{1,2})$/);
  if (dmMatch) {
    const d = dmMatch[1].padStart(2, '0');
    const m = dmMatch[2].padStart(2, '0');
    return `${d}/${m}/${currentYear}`;
  }

  // Fallback: native Date parsing
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const dt = new Date(parsed);
    const d = String(dt.getDate()).padStart(2, '0');
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const y = dt.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return trimmed;
}

export interface ParsedMRZ {
  documentType: string;
  issuingCountry: string;
  nationality: string;
  lastName: string;
  firstName: string;
  passportNo: string;
  dateOfBirth: string; // DD/MM/YYYY
  gender: string;
  expiryDate: string; // DD/MM/YYYY
  personalNo?: string;
}

/**
 * Parses ICAO 9303 2-line Passport Machine Readable Zone (MRZ)
 * Line 1 (44 chars): P<COUNTRY<LASTNAME<<FIRSTNAME<<<<<<<<<<<<<
 * Line 2 (44 chars): PASSPORT_NO<CHK<NAT<YYMMDD<CHK<SEX<YYMMDD<CHK<...
 */
export function parsePassportMRZ(mrzText: string): ParsedMRZ | null {
  if (!mrzText) return null;

  // Extract lines and clean up characters
  const rawLines = mrzText
    .split(/\r?\n/)
    .map((l) => l.trim().toUpperCase().replace(/[^A-Z0-9<]/g, ''))
    .filter((l) => l.length >= 30);

  // Look for 2 lines starting with P< or P
  let line1 = '';
  let line2 = '';

  for (let i = 0; i < rawLines.length; i++) {
    const cur = rawLines[i];
    if (cur.startsWith('P<') || cur.startsWith('P')) {
      line1 = cur.padEnd(44, '<').substring(0, 44);
      if (i + 1 < rawLines.length) {
        line2 = rawLines[i + 1].padEnd(44, '<').substring(0, 44);
        break;
      }
    }
  }

  if (!line1 || !line2) return null;

  try {
    // Parse Line 1
    const issuingCountryCode = line1.substring(2, 5).replace(/</g, '');
    const nameSection = line1.substring(5);
    const nameParts = nameSection.split('<<');
    const lastName = (nameParts[0] || '').replace(/</g, ' ').trim();
    const firstName = (nameParts[1] || '').replace(/</g, ' ').trim();

    // Parse Line 2
    const passportNo = line2.substring(0, 9).replace(/</g, '').trim();
    const nationalityCode = line2.substring(10, 13).replace(/</g, '').trim();

    // DOB YYMMDD -> DD/MM/YYYY
    const dobRaw = line2.substring(13, 19);
    let dateOfBirth = '';
    if (dobRaw.length === 6 && /^\d+$/.test(dobRaw)) {
      const yy = parseInt(dobRaw.substring(0, 2), 10);
      const mm = dobRaw.substring(2, 4);
      const dd = dobRaw.substring(4, 6);
      const currentYear = new Date().getFullYear() % 100;
      const fullYear = yy > currentYear ? 1900 + yy : 2000 + yy;
      dateOfBirth = `${dd}/${mm}/${fullYear}`;
    }

    const gender = line2.substring(20, 21);

    // Expiry YYMMDD -> DD/MM/YYYY
    const expRaw = line2.substring(21, 27);
    let expiryDate = '';
    if (expRaw.length === 6 && /^\d+$/.test(expRaw)) {
      const yy = parseInt(expRaw.substring(0, 2), 10);
      const mm = expRaw.substring(2, 4);
      const dd = expRaw.substring(4, 6);
      // Passports typically expire in future (2000s)
      const fullYear = 2000 + yy;
      expiryDate = `${dd}/${mm}/${fullYear}`;
    }

    const nationality = ICAO_COUNTRY_MAP[nationalityCode] || nationalityCode;

    return {
      documentType: 'Passport',
      issuingCountry: ICAO_COUNTRY_MAP[issuingCountryCode] || issuingCountryCode,
      nationality,
      lastName,
      firstName,
      passportNo,
      dateOfBirth,
      gender: gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender,
      expiryDate,
    };
  } catch (err) {
    console.error('Error parsing MRZ:', err);
    return null;
  }
}

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
 */
export const ICAO_COUNTRY_MAP: Record<string, string> = {
  LKA: 'SRI LANKAN',
  ARE: 'UNITED ARAB EMIRATES',
  IND: 'INDIAN',
  PAK: 'PAKISTANI',
  BGD: 'BANGLADESHI',
  NPL: 'NEPALESE',
  PHL: 'FILIPINO',
  EGY: 'EGYPTIAN',
  JOR: 'JORDANIAN',
  SYR: 'SYRIAN',
  LBN: 'LEBANESE',
  SAU: 'SAUDI ARABIAN',
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
};

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

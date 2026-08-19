export interface AirportInfo {
  code: string;
  name: string;
  cityCountry: string;
}

const AIRPORT_DATABASE: Record<string, AirportInfo> = {
  CMB: { code: 'CMB', name: 'Bandaranaike Intl Arpt', cityCountry: 'Colombo, Sri Lanka' },
  MLE: { code: 'MLE', name: 'Male Intl Arpt', cityCountry: 'Male, Maldives' },
  DXB: { code: 'DXB', name: 'Dubai Intl Arpt', cityCountry: 'Dubai, United Arab Emirates' },
  DWC: { code: 'DWC', name: 'Al Maktoum Intl Arpt', cityCountry: 'Dubai, United Arab Emirates' },
  SHJ: { code: 'SHJ', name: 'Sharjah Intl Arpt', cityCountry: 'Sharjah, United Arab Emirates' },
  AUH: { code: 'AUH', name: 'Zayed Intl Arpt', cityCountry: 'Abu Dhabi, United Arab Emirates' },
  DOH: { code: 'DOH', name: 'Hamad Intl Arpt', cityCountry: 'Doha, Qatar' },
  SIN: { code: 'SIN', name: 'Singapore Changi Arpt', cityCountry: 'Singapore' },
  KUL: { code: 'KUL', name: 'Kuala Lumpur Intl Arpt', cityCountry: 'Kuala Lumpur, Malaysia' },
  BKK: { code: 'BKK', name: 'Suvarnabhumi Arpt', cityCountry: 'Bangkok, Thailand' },
  DMK: { code: 'DMK', name: 'Don Mueang Intl Arpt', cityCountry: 'Bangkok, Thailand' },
  LHR: { code: 'LHR', name: 'Heathrow Arpt', cityCountry: 'London, United Kingdom' },
  LGW: { code: 'LGW', name: 'Gatwick Arpt', cityCountry: 'London, United Kingdom' },
  JFK: { code: 'JFK', name: 'John F Kennedy Intl Arpt', cityCountry: 'New York, USA' },
  ORD: { code: 'ORD', name: "O'Hare Intl Arpt", cityCountry: 'Chicago, USA' },
  YYZ: { code: 'YYZ', name: 'Toronto Pearson Intl Arpt', cityCountry: 'Toronto, Canada' },
  MAA: { code: 'MAA', name: 'Chennai Intl Arpt', cityCountry: 'Chennai, India' },
  BOM: { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl Arpt', cityCountry: 'Mumbai, India' },
  DEL: { code: 'DEL', name: 'Indira Gandhi Intl Arpt', cityCountry: 'Delhi, India' },
  BLR: { code: 'BLR', name: 'Kempegowda Intl Arpt', cityCountry: 'Bangalore, India' },
  TRV: { code: 'TRV', name: 'Trivandrum Intl Arpt', cityCountry: 'Thiruvananthapuram, India' },
  COK: { code: 'COK', name: 'Cochin Intl Arpt', cityCountry: 'Kochi, India' },
  JED: { code: 'JED', name: 'King Abdulaziz Intl Arpt', cityCountry: 'Jeddah, Saudi Arabia' },
  RUH: { code: 'RUH', name: 'King Khalid Intl Arpt', cityCountry: 'Riyadh, Saudi Arabia' },
  DMM: { code: 'DMM', name: 'King Fahd Intl Arpt', cityCountry: 'Dammam, Saudi Arabia' },
  MED: { code: 'MED', name: 'Prince Mohammad Bin Abdulaziz Arpt', cityCountry: 'Medina, Saudi Arabia' },
  KWI: { code: 'KWI', name: 'Kuwait Intl Arpt', cityCountry: 'Kuwait City, Kuwait' },
  BAH: { code: 'BAH', name: 'Bahrain Intl Arpt', cityCountry: 'Manama, Bahrain' },
  MCT: { code: 'MCT', name: 'Muscat Intl Arpt', cityCountry: 'Muscat, Oman' },
  IST: { code: 'IST', name: 'Istanbul Arpt', cityCountry: 'Istanbul, Turkey' },
  CDG: { code: 'CDG', name: 'Charles de Gaulle Arpt', cityCountry: 'Paris, France' },
  FRA: { code: 'FRA', name: 'Frankfurt Arpt', cityCountry: 'Frankfurt, Germany' },
  AMS: { code: 'AMS', name: 'Amsterdam Arpt Schiphol', cityCountry: 'Amsterdam, Netherlands' },
  MEL: { code: 'MEL', name: 'Melbourne Arpt', cityCountry: 'Melbourne, Australia' },
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith Arpt', cityCountry: 'Sydney, Australia' },
  NRT: { code: 'NRT', name: 'Narita Intl Arpt', cityCountry: 'Tokyo, Japan' },
  HND: { code: 'HND', name: 'Haneda Arpt', cityCountry: 'Tokyo, Japan' },
  ICN: { code: 'ICN', name: 'Incheon Intl Arpt', cityCountry: 'Seoul, South Korea' },
};

export const resolveAirport = (
  input: string | undefined,
  fallbackCode: string = 'CMB',
  fallbackName: string = 'Bandaranaike Intl Arpt',
  fallbackCity: string = 'Colombo, Sri Lanka'
): AirportInfo => {
  if (!input || !input.trim()) {
    return { code: fallbackCode, name: fallbackName, cityCountry: fallbackCity };
  }

  const clean = input.trim();

  // Try extracting 3-letter IATA code in parentheses e.g. "Colombo (CMB)" or direct "CMB"
  const match = clean.match(/\b([A-Z]{3})\b/);
  const detectedCode = match ? match[1].toUpperCase() : null;

  if (detectedCode && AIRPORT_DATABASE[detectedCode]) {
    return AIRPORT_DATABASE[detectedCode];
  }

  // Search by city name keyword
  const upper = clean.toUpperCase();
  for (const [code, info] of Object.entries(AIRPORT_DATABASE)) {
    if (upper.includes(code) || upper.includes(info.cityCountry.split(',')[0].toUpperCase())) {
      return info;
    }
  }

  // Fallback
  return {
    code: detectedCode || fallbackCode,
    name: clean.includes('Arpt') || clean.includes('Airport') ? clean : `${clean} Intl Arpt`,
    cityCountry: clean
  };
};

export const formatFlightDate = (dateStr: string | undefined): string => {
  if (!dateStr || dateStr === 'N/A') return '03 SEP 2026';
  
  // Try parsing DD/MM/YYYY or YYYY-MM-DD
  const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      const dayStr = String(day).padStart(2, '0');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${dayStr} ${monthNames[d.getMonth()]} ${year}`;
    }
  }

  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    const dayStr = String(isoDate.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${dayStr} ${monthNames[isoDate.getMonth()]} ${isoDate.getFullYear()}`;
  }

  return dateStr.toUpperCase();
};

export const calculateFlightDuration = (depTime?: string, arrTime?: string): string => {
  if (!depTime || !arrTime) return 'Duration: 01hrs 30mins';

  const parseMinutes = (t: string): number | null => {
    const clean = t.trim().toUpperCase();
    const match = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const depM = parseMinutes(depTime);
  const arrM = parseMinutes(arrTime);

  if (depM !== null && arrM !== null) {
    let diff = arrM - depM;
    if (diff < 0) diff += 24 * 60; // Next day arrival
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `Duration: ${String(hrs).padStart(2, '0')}hrs ${String(mins).padStart(2, '0')}mins`;
  }

  return 'Duration: 01hrs 30mins';
};

export const formatFlightTime = (timeStr?: string, defaultVal: string = '20:35'): string => {
  if (!timeStr || !timeStr.trim()) return defaultVal;
  const clean = timeStr.trim();
  // Strip "DEP", "ARR", "Time:", etc if present
  const stripped = clean.replace(/^(DEP|ARR|DEPARTURE|ARRIVAL|TIME:)\s*/i, '').trim();
  return stripped;
};

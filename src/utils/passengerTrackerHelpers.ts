import { TicketFollowup, VisaFollowup, Traveler, BranchOffice } from '../types';

export interface PassengerDossier {
  id: string; // unique key e.g. passport or normalized name
  passportNo: string;
  fullName: string;
  firstName: string;
  lastName: string;
  nationality?: string;
  dob?: string;
  passportExpiry?: string;
  unifiedNumber?: string;
  icpFileNo?: string;
  photoAttachment?: string;
  passportAttachment?: string;
  branches: BranchOffice[];
  visas: VisaFollowup[];
  tickets: Array<{
    ticket: TicketFollowup;
    travelerName: string;
    travelerPassport?: string;
    ticketNo?: string;
  }>;
  totalVisas: number;
  totalTickets: number;
  totalSpent: number;
  totalPaid: number;
  outstandingBalance: number;
  latestActivityDate: string;
  latestStatus: string;
  agencyOrCustomer?: string;
}

/**
 * Normalizes passport strings for safe matching (removes spaces, dashes, converts to uppercase)
 */
export function normalizePassport(passport?: string): string {
  if (!passport) return '';
  return passport.replace(/[\s\-_.]/g, '').trim().toUpperCase();
}

/**
 * Cleans name strings (removes honorifics, slashes, extra spaces, uppercase)
 */
export function normalizeName(name?: string): string {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/\b(MR|MRS|MS|MISS|MSTR|DR|PROF|HON|REV)\b/g, '')
    .replace(/[/\\,\-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if query matches a name loosely or exactly
 */
export function matchNameLoose(targetName?: string, queryName?: string): boolean {
  if (!targetName || !queryName) return false;
  const tNorm = normalizeName(targetName);
  const qNorm = normalizeName(queryName);
  if (!tNorm || !qNorm) return false;

  if (tNorm === qNorm) return true;
  if (tNorm.includes(qNorm) || qNorm.includes(tNorm)) return true;

  // Check token overlap (e.g. "MOHAMED FAROOK" vs "FAROOK MOHAMED")
  const tTokens = tNorm.split(' ').filter(Boolean);
  const qTokens = qNorm.split(' ').filter(Boolean);
  if (qTokens.length > 0 && qTokens.every(q => tTokens.some(t => t.includes(q) || q.includes(t)))) {
    return true;
  }
  return false;
}

/**
 * Checks if query matches a passport number
 */
export function matchPassport(targetPassport?: string, queryPassport?: string): boolean {
  if (!targetPassport || !queryPassport) return false;
  const tNorm = normalizePassport(targetPassport);
  const qNorm = normalizePassport(queryPassport);
  if (tNorm.length < 3 || qNorm.length < 3) return false;
  return tNorm === qNorm || tNorm.includes(qNorm) || qNorm.includes(tNorm);
}

/**
 * Groups all visas and tickets into comprehensive Passenger Dossiers across the entire database
 */
export function buildAllPassengerDossiers(
  visas: VisaFollowup[] = [],
  tickets: TicketFollowup[] = []
): PassengerDossier[] {
  const dossierMap = new Map<string, PassengerDossier>();

  // 1. Process Visas (including primary applicants and any group members)
  visas.forEach((v) => {
    if (!v) return;

    // Helper to incorporate an applicant
    const addVisaApplicant = (
      fName: string,
      lName: string,
      pNo: string,
      pExp?: string,
      nat?: string,
      dobVal?: string,
      uidVal?: string,
      icpVal?: string,
      photoUrl?: string,
      passDocUrl?: string
    ) => {
      const full = `${fName} ${lName}`.trim() || 'UNNAMED APPLICANT';
      const cleanPass = normalizePassport(pNo);
      const cleanName = normalizeName(full);
      // Unique key: prefer passport if present, otherwise clean name
      const dossierKey = cleanPass.length >= 4 ? `PASS_${cleanPass}` : `NAME_${cleanName}`;
      if (!dossierKey || dossierKey === 'NAME_') return;

      let dossier = dossierMap.get(dossierKey);
      if (!dossier && cleanPass.length >= 4) {
        // Look for matching name key to merge if previously added without passport
        const nameKey = `NAME_${cleanName}`;
        if (dossierMap.has(nameKey)) {
          dossier = dossierMap.get(nameKey)!;
          dossierMap.delete(nameKey);
        }
      }

      const branch = v.branch || 'Negombo';

      if (!dossier) {
        dossier = {
          id: dossierKey,
          passportNo: pNo ? pNo.trim().toUpperCase() : '',
          fullName: full,
          firstName: fName.trim(),
          lastName: lName.trim(),
          nationality: nat || v.nationality || 'SRI LANKAN',
          dob: dobVal || v.dob,
          passportExpiry: pExp || v.passportExpiry,
          unifiedNumber: uidVal || v.unifiedNumber,
          icpFileNo: icpVal || v.icpFileNo,
          photoAttachment: photoUrl || v.photoAttachment,
          passportAttachment: passDocUrl || v.passportAttachment,
          branches: [branch],
          visas: [],
          tickets: [],
          totalVisas: 0,
          totalTickets: 0,
          totalSpent: 0,
          totalPaid: 0,
          outstandingBalance: 0,
          latestActivityDate: v.submissionDate || v.createdAt || '',
          latestStatus: v.status || 'Active',
          agencyOrCustomer: v.customer || 'Direct Customer'
        };
        dossierMap.set(dossierKey, dossier);
      } else {
        // Fill missing fields
        if (!dossier.passportNo && pNo) dossier.passportNo = pNo.trim().toUpperCase();
        if (!dossier.nationality && nat) dossier.nationality = nat;
        if (!dossier.dob && dobVal) dossier.dob = dobVal;
        if (!dossier.passportExpiry && pExp) dossier.passportExpiry = pExp;
        if (!dossier.unifiedNumber && uidVal) dossier.unifiedNumber = uidVal;
        if (!dossier.icpFileNo && icpVal) dossier.icpFileNo = icpVal;
        if (!dossier.photoAttachment && photoUrl) dossier.photoAttachment = photoUrl;
        if (!dossier.passportAttachment && passDocUrl) dossier.passportAttachment = passDocUrl;
        if (!dossier.branches.includes(branch)) dossier.branches.push(branch);
      }

      // Add visa reference if not already included
      if (!dossier.visas.some((item) => item.id === v.id)) {
        dossier.visas.push(v);
        dossier.totalVisas += 1;
        const sell = Number(v.sellingPrice) || 0;
        dossier.totalSpent += sell;
        if (v.paymentStatus === 'Paid') {
          dossier.totalPaid += sell;
        } else if (v.paymentStatus === 'Partially Paid') {
          dossier.totalPaid += sell * 0.5; // estimated or half
          dossier.outstandingBalance += sell * 0.5;
        } else {
          dossier.outstandingBalance += sell;
        }
      }
    };

    // Primary applicant
    addVisaApplicant(
      v.firstName || '',
      v.lastName || '',
      v.passportNo || '',
      v.passportExpiry,
      v.nationality,
      v.dob,
      v.unifiedNumber,
      v.icpFileNo,
      v.photoAttachment,
      v.passportAttachment
    );

    // Group members if any
    if (v.isGroup && Array.isArray(v.groupMembers)) {
      v.groupMembers.forEach((gm) => {
        if (!gm) return;
        addVisaApplicant(
          gm.firstName || '',
          gm.lastName || '',
          gm.passportNo || '',
          gm.passportExpiry,
          gm.nationality,
          gm.dob,
          gm.unifiedNumber,
          gm.icpFileNo,
          gm.photoAttachment,
          gm.passportAttachment
        );
      });
    }
  });

  // 2. Process Air Tickets
  tickets.forEach((t) => {
    if (!t) return;
    const branch = t.branch || 'Dubai';

    // Check each traveler or primary customer
    const travelersToProcess: Array<{ name: string; passport?: string; ticketNo?: string }> = [];

    if (Array.isArray(t.travelers) && t.travelers.length > 0) {
      t.travelers.forEach((trv) => {
        travelersToProcess.push({
          name: trv.name,
          passport: trv.passportNo,
          ticketNo: trv.ticketNo
        });
      });
    } else if (Array.isArray(t.tickets) && t.tickets.length > 0) {
      t.tickets.forEach((tNum, idx) => {
        travelersToProcess.push({
          name: idx === 0 ? t.customer : `Traveler ${idx + 1}`,
          ticketNo: tNum
        });
      });
    } else {
      travelersToProcess.push({
        name: t.customer,
        ticketNo: t.pnr
      });
    }

    travelersToProcess.forEach((trv) => {
      const cleanPass = normalizePassport(trv.passport);
      const cleanName = normalizeName(trv.name);
      if (!cleanPass && !cleanName) return;

      // Try matching by passport first
      let matchedDossier: PassengerDossier | undefined;
      if (cleanPass.length >= 4) {
        matchedDossier = dossierMap.get(`PASS_${cleanPass}`);
      }

      // If not found by passport, try matching by name
      if (!matchedDossier && cleanName) {
        // Direct key
        matchedDossier = dossierMap.get(`NAME_${cleanName}`);

        // If not exact key, search existing dossiers with loose match
        if (!matchedDossier) {
          for (const d of dossierMap.values()) {
            if (matchNameLoose(d.fullName, trv.name)) {
              matchedDossier = d;
              break;
            }
          }
        }
      }

      if (!matchedDossier) {
        const key = cleanPass.length >= 4 ? `PASS_${cleanPass}` : `NAME_${cleanName}`;
        matchedDossier = {
          id: key,
          passportNo: trv.passport ? trv.passport.trim().toUpperCase() : '',
          fullName: trv.name.trim(),
          firstName: trv.name.split(' ')[0] || trv.name,
          lastName: trv.name.split(' ').slice(1).join(' ') || '',
          nationality: 'SRI LANKAN',
          branches: [branch],
          visas: [],
          tickets: [],
          totalVisas: 0,
          totalTickets: 0,
          totalSpent: 0,
          totalPaid: 0,
          outstandingBalance: 0,
          latestActivityDate: t.flyDate || t.requestDate || t.createdAt || '',
          latestStatus: t.status || 'Active',
          agencyOrCustomer: t.customer || 'Direct Customer'
        };
        dossierMap.set(key, matchedDossier);
      } else {
        if (!matchedDossier.branches.includes(branch)) {
          matchedDossier.branches.push(branch);
        }
        if (!matchedDossier.passportNo && trv.passport) {
          matchedDossier.passportNo = trv.passport.trim().toUpperCase();
        }
      }

      // Add ticket to dossier if not already attached
      if (!matchedDossier.tickets.some((item) => item.ticket.id === t.id && item.ticketNo === trv.ticketNo)) {
        matchedDossier.tickets.push({
          ticket: t,
          travelerName: trv.name,
          travelerPassport: trv.passport,
          ticketNo: trv.ticketNo
        });
        matchedDossier.totalTickets += 1;
        const sell = t.sellingPrice !== undefined ? t.sellingPrice : (t.totalRefundable || 0);
        matchedDossier.totalSpent += sell;
        if (t.paymentStatus === 'Paid' || t.paymentStatus === 'Fully Paid') {
          matchedDossier.totalPaid += sell;
        } else if (t.paymentStatus === 'Partially Paid' || t.paymentStatus === 'Partial Paid') {
          matchedDossier.totalPaid += sell * 0.5;
          matchedDossier.outstandingBalance += sell * 0.5;
        } else {
          matchedDossier.outstandingBalance += sell;
        }
      }
    });
  });

  return Array.from(dossierMap.values()).sort((a, b) => {
    // Sort by count of records or latest activity
    const countA = a.visas.length + a.tickets.length;
    const countB = b.visas.length + b.tickets.length;
    if (countB !== countA) return countB - countA;
    return a.fullName.localeCompare(b.fullName);
  });
}

/**
 * Real-time fast lookup for existing records by Full Name OR Passport Number
 * Used in AddVisaModal, AddTicketModal, and Global Search
 */
export function lookupExistingPassengerRecords({
  fullName,
  passportNo,
  visas = [],
  tickets = [],
  excludeVisaId,
  excludeTicketId
}: {
  fullName?: string;
  passportNo?: string;
  visas?: VisaFollowup[];
  tickets?: TicketFollowup[];
  excludeVisaId?: string;
  excludeTicketId?: string;
}): {
  found: boolean;
  matchingVisas: VisaFollowup[];
  matchingTickets: Array<{ ticket: TicketFollowup; travelerName: string; ticketNo?: string }>;
  bestDossierMatch?: {
    fullName: string;
    passportNo: string;
    nationality?: string;
    passportExpiry?: string;
    dob?: string;
    unifiedNumber?: string;
    icpFileNo?: string;
    photoAttachment?: string;
    passportAttachment?: string;
    customer?: string;
    branch?: BranchOffice;
  };
  reasons: string[];
} {
  const cleanPass = normalizePassport(passportNo);
  const cleanName = normalizeName(fullName);

  if (cleanPass.length < 3 && cleanName.length < 3) {
    return { found: false, matchingVisas: [], matchingTickets: [], reasons: [] };
  }

  const matchingVisas: VisaFollowup[] = [];
  const matchingTickets: Array<{ ticket: TicketFollowup; travelerName: string; ticketNo?: string }> = [];
  const reasons: string[] = [];

  // 1. Search Visas
  for (const v of visas) {
    if (!v) continue;
    if (excludeVisaId && v.id === excludeVisaId) continue;

    let isMatch = false;
    let reason = '';

    // Passport match
    if (cleanPass.length >= 3) {
      if (normalizePassport(v.passportNo) === cleanPass) {
        isMatch = true;
        reason = `Matching Passport (${cleanPass}) in Visa (${v.visaCategory} - ${v.status})`;
      } else if (v.isGroup && Array.isArray(v.groupMembers)) {
        const gmMatch = v.groupMembers.find(gm => normalizePassport(gm.passportNo) === cleanPass);
        if (gmMatch) {
          isMatch = true;
          reason = `Matching Group Member Passport (${cleanPass}) in Visa (${v.groupName || v.visaCategory})`;
        }
      }
    }

    // Name match
    if (!isMatch && cleanName.length >= 3) {
      const vFull = `${v.firstName || ''} ${v.lastName || ''}`.trim();
      if (matchNameLoose(vFull, cleanName)) {
        isMatch = true;
        reason = `Matching Name "${vFull}" in Visa (${v.visaCategory} - ${v.status})`;
      } else if (v.isGroup && Array.isArray(v.groupMembers)) {
        const gmMatch = v.groupMembers.find(gm => matchNameLoose(`${gm.firstName} ${gm.lastName}`, cleanName));
        if (gmMatch) {
          isMatch = true;
          reason = `Matching Group Member "${gmMatch.firstName} ${gmMatch.lastName}" in Visa (${v.groupName || v.visaCategory})`;
        }
      }
    }

    if (isMatch) {
      matchingVisas.push(v);
      if (!reasons.includes(reason)) reasons.push(reason);
    }
  }

  // 2. Search Tickets
  for (const t of tickets) {
    if (!t) continue;
    if (excludeTicketId && t.id === excludeTicketId) continue;

    let isMatch = false;
    let matchTravelerName = '';
    let matchTicketNo = '';

    if (Array.isArray(t.travelers) && t.travelers.length > 0) {
      for (const trv of t.travelers) {
        if (!trv) continue;
        if (cleanPass.length >= 3 && normalizePassport(trv.passportNo) === cleanPass) {
          isMatch = true;
          matchTravelerName = trv.name;
          matchTicketNo = trv.ticketNo;
          reasons.push(`Matching Passport (${cleanPass}) in Air Ticket (${t.airline} - PNR: ${t.pnr})`);
          break;
        }
        if (cleanName.length >= 3 && matchNameLoose(trv.name, cleanName)) {
          isMatch = true;
          matchTravelerName = trv.name;
          matchTicketNo = trv.ticketNo;
          reasons.push(`Matching Traveler Name "${trv.name}" in Air Ticket (${t.airline} - ${t.pnr})`);
          break;
        }
      }
    } else {
      if (cleanName.length >= 3 && matchNameLoose(t.customer, cleanName)) {
        isMatch = true;
        matchTravelerName = t.customer;
        matchTicketNo = t.tickets?.[0] || t.pnr;
        reasons.push(`Matching Customer Name "${t.customer}" in Air Ticket (${t.airline} - ${t.pnr})`);
      }
    }

    if (isMatch) {
      matchingTickets.push({
        ticket: t,
        travelerName: matchTravelerName || t.customer,
        ticketNo: matchTicketNo
      });
    }
  }

  const found = matchingVisas.length > 0 || matchingTickets.length > 0;

  // Best template match to autofill info
  let bestDossierMatch: any = undefined;
  if (found) {
    const primaryVisa = matchingVisas[0];
    if (primaryVisa) {
      bestDossierMatch = {
        fullName: `${primaryVisa.firstName} ${primaryVisa.lastName}`.trim(),
        passportNo: primaryVisa.passportNo,
        nationality: primaryVisa.nationality,
        passportExpiry: primaryVisa.passportExpiry,
        dob: primaryVisa.dob,
        unifiedNumber: primaryVisa.unifiedNumber,
        icpFileNo: primaryVisa.icpFileNo,
        photoAttachment: primaryVisa.photoAttachment,
        passportAttachment: primaryVisa.passportAttachment,
        customer: primaryVisa.customer,
        branch: primaryVisa.branch
      };
    } else if (matchingTickets.length > 0) {
      const primaryTicket = matchingTickets[0];
      bestDossierMatch = {
        fullName: primaryTicket.travelerName,
        passportNo: cleanPass || '',
        customer: primaryTicket.ticket.customer,
        branch: primaryTicket.ticket.branch
      };
    }
  }

  return {
    found,
    matchingVisas,
    matchingTickets,
    bestDossierMatch,
    reasons
  };
}

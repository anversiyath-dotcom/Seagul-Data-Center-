import { TicketFollowup, VisaFollowup, ActivityComment } from '../types';

export function getRelativeDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export const INITIAL_TICKETS: TicketFollowup[] = [];
export const INITIAL_VISAS: VisaFollowup[] = [];
export const INITIAL_COMMENTS: ActivityComment[] = [];

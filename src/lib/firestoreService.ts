import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  updateDoc
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, auth } from './firebase';
import {
  TicketFollowup,
  VisaFollowup,
  ActivityComment,
  CompanyProfile,
  DEFAULT_COMPANY_PROFILE,
  ExpenseItem,
  UserAccount,
  UserInvite,
  UserRole,
  UserBranchAccess,
  UserAccountStatus
} from '../types';

const TICKETS_COLLECTION = 'tickets';
const VISAS_COLLECTION = 'visas';
const COMMENTS_COLLECTION = 'comments';
const EXPENSES_COLLECTION = 'expenses';
const SETTINGS_COLLECTION = 'settings';
const USERS_COLLECTION = 'users';
const USER_INVITES_COLLECTION = 'userInvites';
const COMPANY_PROFILE_DOC = 'companyProfile';
const SYSTEM_INIT_DOC = 'systemInit';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'anversiyath@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function buildFirestoreErrorInfo(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function logFirestoreSnapshotError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Deterministic invite ID from normalized email (68 chars, matches ^[a-zA-Z0-9_-]+$)
export async function emailToInviteId(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `inv_${hex}`;
  }
  const safe = normalized.replace(/[^a-z0-9]/g, '_').slice(0, 120);
  return `inv_${safe}`;
}

// Recursive helper to strip `undefined` properties for Firestore
function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefined(value);
    }
  }
  return cleaned as T;
}

// Subscriptions for real-time live sync
export function subscribeToExpenses(
  onUpdate: (expenses: ExpenseItem[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(collection(db, EXPENSES_COLLECTION), (snapshot) => {
    const list: ExpenseItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ExpenseItem);
    });
    onUpdate(list);
  }, (error) => {
    logFirestoreSnapshotError(error, OperationType.LIST, EXPENSES_COLLECTION);
    if (onError) onError(error);
  });
}

export function subscribeToTickets(
  onUpdate: (tickets: TicketFollowup[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(collection(db, TICKETS_COLLECTION), (snapshot) => {
    const list: TicketFollowup[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as TicketFollowup);
    });
    onUpdate(list);
  }, (error) => {
    logFirestoreSnapshotError(error, OperationType.LIST, TICKETS_COLLECTION);
    if (onError) onError(error);
  });
}

export function subscribeToVisas(
  onUpdate: (visas: VisaFollowup[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(collection(db, VISAS_COLLECTION), (snapshot) => {
    const list: VisaFollowup[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as VisaFollowup);
    });
    onUpdate(list);
  }, (error) => {
    logFirestoreSnapshotError(error, OperationType.LIST, VISAS_COLLECTION);
    if (onError) onError(error);
  });
}

export function subscribeToComments(
  onUpdate: (comments: ActivityComment[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(collection(db, COMMENTS_COLLECTION), (snapshot) => {
    const list: ActivityComment[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ActivityComment);
    });
    onUpdate(list);
  }, (error) => {
    logFirestoreSnapshotError(error, OperationType.LIST, COMMENTS_COLLECTION);
    if (onError) onError(error);
  });
}

export function subscribeToCompanyProfile(
  onUpdate: (profile: CompanyProfile) => void,
  onError?: (err: Error) => void
) {
  const path = `${SETTINGS_COLLECTION}/${COMPANY_PROFILE_DOC}`;
  const docRef = doc(db, SETTINGS_COLLECTION, COMPANY_PROFILE_DOC);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as CompanyProfile);
    } else {
      onUpdate(DEFAULT_COMPANY_PROFILE);
    }
  }, (error) => {
    logFirestoreSnapshotError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
}

// --- User Accounts & Invites ---
export function subscribeToCurrentUserAccount(
  uid: string,
  onUpdate: (account: UserAccount | null) => void,
  onError?: (err: Error) => void
) {
  const path = `${USERS_COLLECTION}/${uid}`;
  const docRef = doc(db, USERS_COLLECTION, uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as UserAccount);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    logFirestoreSnapshotError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
}

export function subscribeToAllUserAccounts(
  onUpdate: (accounts: UserAccount[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(collection(db, USERS_COLLECTION), (snapshot) => {
    const list: UserAccount[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as UserAccount);
    });
    onUpdate(list);
  }, (error) => {
    logFirestoreSnapshotError(error, OperationType.LIST, USERS_COLLECTION);
    if (onError) onError(error);
  });
}

export function subscribeToAllUserInvites(
  onUpdate: (invites: UserInvite[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(collection(db, USER_INVITES_COLLECTION), (snapshot) => {
    const list: UserInvite[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as UserInvite);
    });
    onUpdate(list);
  }, (error) => {
    logFirestoreSnapshotError(error, OperationType.LIST, USER_INVITES_COLLECTION);
    if (onError) onError(error);
  });
}

export interface RegistrationFormData {
  displayName: string;
  phone?: string;
  jobTitle?: string;
  branchAccess: UserBranchAccess;
}

export function formatReadableFirestoreError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(raw) as Partial<FirestoreErrorInfo>;
    if (parsed && typeof parsed.error === 'string') {
      if (parsed.error.includes('Missing or insufficient permissions') || parsed.error.includes('permission-denied')) {
        return 'Permission denied by database security rules. Please verify you are signed in with an authorized, verified Google account.';
      }
      if (parsed.error.includes('client is offline') || parsed.error.includes('unavailable')) {
        return 'Unable to reach the database from this computer. Please check your internet connection or firewall and try again.';
      }
      return parsed.error;
    }
  } catch {
    // Not JSON, return original message
  }
  if (raw.includes('Missing or insufficient permissions') || raw.includes('permission-denied')) {
    return 'Permission denied by database security rules. Please verify your account permissions and try again.';
  }
  return raw;
}

export async function ensureOrCreateUserAccount(
  user: User,
  registrationData?: RegistrationFormData
): Promise<UserAccount> {
  const path = `${USERS_COLLECTION}/${user.uid}`;
  const rawEmail = user.email || user.providerData?.find(p => p?.email)?.email || '';
  const email = rawEmail.trim().toLowerCase().slice(0, 254);

  if (!email || !email.includes('@')) {
    throw new Error('Your Google account did not return an email address. Please sign in with a valid Google account.');
  }

  if (user.emailVerified === false) {
    throw new Error('Your Google email address is not verified. Please verify your email or use a standard verified Google account.');
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const existingSnap = await getDoc(userRef);

    if (existingSnap.exists()) {
      const existingAccount = existingSnap.data() as UserAccount;
      if (existingAccount.status === 'Pending' && registrationData?.displayName?.trim()) {
        const now = new Date().toISOString();
        const updatedFields = {
          displayName: registrationData.displayName.trim().slice(0, 120),
          phone: (registrationData.phone || existingAccount.phone || '').trim().slice(0, 40),
          jobTitle: (registrationData.jobTitle || existingAccount.jobTitle || '').trim().slice(0, 80),
          updatedAt: now,
        };
        await updateDoc(userRef, updatedFields);
        return { ...existingAccount, ...updatedFields };
      }
      return existingAccount;
    }

    const now = new Date().toISOString();
    const isBootstrappedAdmin = email === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

    // Check if an Admin pre-created an invite for this email
    const inviteId = await emailToInviteId(email);
    const inviteRef = doc(db, USER_INVITES_COLLECTION, inviteId);
    let pendingInvite: UserInvite | null = null;
    try {
      const inviteSnap = await getDoc(inviteRef);
      if (inviteSnap.exists()) {
        const inv = inviteSnap.data() as UserInvite;
        if (inv.status === 'Pending' && inv.email.toLowerCase() === email) {
          pendingInvite = inv;
        }
      }
    } catch {
      // No invite accessible or none exists
    }

    const fallbackName = email.split('@')[0] || 'Staff User';
    const rawName = (registrationData?.displayName || pendingInvite?.displayName || user.displayName || fallbackName).trim();
    const displayName = (rawName || fallbackName).slice(0, 120);
    const phone = (registrationData?.phone || pendingInvite?.phone || '').trim().slice(0, 40);
    const jobTitle = (registrationData?.jobTitle || pendingInvite?.jobTitle || '').trim().slice(0, 80);
    const photoURL = (user.photoURL || '').trim().slice(0, 1000);

    if (pendingInvite) {
      const newAccount: UserAccount = cleanUndefined({
        uid: user.uid,
        email,
        displayName,
        ...(phone ? { phone } : {}),
        ...(jobTitle ? { jobTitle } : {}),
        ...(photoURL ? { photoURL } : {}),
        role: pendingInvite.role,
        branchAccess: pendingInvite.branchAccess,
        status: 'Active',
        inviteId: pendingInvite.id,
        createdAt: now,
        updatedAt: now,
        createdBy: pendingInvite.createdBy,
      });

      const batch = writeBatch(db);
      batch.set(userRef, newAccount);
      batch.update(inviteRef, { status: 'Claimed', updatedAt: now });
      await batch.commit();
      return newAccount;
    }

    const newAccount: UserAccount = cleanUndefined({
      uid: user.uid,
      email,
      displayName,
      ...(phone ? { phone } : {}),
      ...(jobTitle ? { jobTitle } : {}),
      ...(photoURL ? { photoURL } : {}),
      role: isBootstrappedAdmin ? 'Admin' : 'Staff',
      branchAccess: isBootstrappedAdmin ? 'All' : (registrationData?.branchAccess || 'Negombo'),
      status: isBootstrappedAdmin ? 'Active' : 'Pending',
      createdAt: now,
      updatedAt: now,
      createdBy: user.uid,
    });

    await setDoc(userRef, newAccount);
    return newAccount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createUserAccountInvite(params: {
  email: string;
  displayName: string;
  phone?: string;
  jobTitle?: string;
  role: UserRole;
  branchAccess: UserBranchAccess;
  createdByUid: string;
}): Promise<UserInvite> {
  const email = params.email.trim().toLowerCase().slice(0, 254);
  const inviteId = await emailToInviteId(email);
  const path = `${USER_INVITES_COLLECTION}/${inviteId}`;
  const now = new Date().toISOString();
  const inviteRef = doc(db, USER_INVITES_COLLECTION, inviteId);

  try {
    let existingCreatedAt = now;
    let existingCreatedBy = params.createdByUid;
    let existingEmail = email;

    const existingSnap = await getDoc(inviteRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as Partial<UserInvite>;
      if (existingData.createdAt) existingCreatedAt = existingData.createdAt;
      if (existingData.createdBy) existingCreatedBy = existingData.createdBy;
      if (existingData.email) existingEmail = existingData.email;
    }

    const invite: UserInvite = cleanUndefined({
      id: inviteId,
      email: existingEmail,
      displayName: params.displayName.trim().slice(0, 120),
      ...(params.phone?.trim() ? { phone: params.phone.trim().slice(0, 40) } : {}),
      ...(params.jobTitle?.trim() ? { jobTitle: params.jobTitle.trim().slice(0, 80) } : {}),
      role: params.role,
      branchAccess: params.branchAccess,
      status: 'Pending',
      createdAt: existingCreatedAt,
      updatedAt: now,
      createdBy: existingCreatedBy,
    });

    await setDoc(inviteRef, invite);
    return invite;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserAccountByAdmin(
  uid: string,
  updates: {
    displayName?: string;
    phone?: string;
    jobTitle?: string;
    role?: UserRole;
    branchAccess?: UserBranchAccess;
    status?: UserAccountStatus;
  }
) {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const payload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (updates.displayName !== undefined) payload.displayName = updates.displayName.trim().slice(0, 120);
    if (updates.phone !== undefined) payload.phone = updates.phone.trim().slice(0, 40);
    if (updates.jobTitle !== undefined) payload.jobTitle = updates.jobTitle.trim().slice(0, 80);
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.branchAccess !== undefined) payload.branchAccess = updates.branchAccess;
    if (updates.status !== undefined) payload.status = updates.status;

    await updateDoc(doc(db, USERS_COLLECTION, uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOwnUserProfile(
  uid: string,
  updates: {
    displayName: string;
    phone?: string;
    jobTitle?: string;
  }
) {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      displayName: updates.displayName.trim().slice(0, 120),
      phone: (updates.phone || '').trim().slice(0, 40),
      jobTitle: (updates.jobTitle || '').trim().slice(0, 80),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteUserInvite(inviteId: string) {
  const path = `${USER_INVITES_COLLECTION}/${inviteId}`;
  try {
    await deleteDoc(doc(db, USER_INVITES_COLLECTION, inviteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteUserAccount(uid: string) {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Single Item Mutations
export async function saveTicketToFirestore(ticket: TicketFollowup) {
  const path = `${TICKETS_COLLECTION}/${ticket.id}`;
  try {
    const docRef = doc(db, TICKETS_COLLECTION, ticket.id);
    await setDoc(docRef, cleanUndefined(ticket), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTicketFromFirestore(id: string) {
  const path = `${TICKETS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, TICKETS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveVisaToFirestore(visa: VisaFollowup) {
  const path = `${VISAS_COLLECTION}/${visa.id}`;
  try {
    const docRef = doc(db, VISAS_COLLECTION, visa.id);
    await setDoc(docRef, cleanUndefined(visa), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteVisaFromFirestore(id: string) {
  const path = `${VISAS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, VISAS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveExpenseToFirestore(expense: ExpenseItem) {
  const path = `${EXPENSES_COLLECTION}/${expense.id}`;
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, expense.id);
    await setDoc(docRef, cleanUndefined(expense), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExpenseFromFirestore(id: string) {
  const path = `${EXPENSES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCommentToFirestore(comment: ActivityComment) {
  const path = `${COMMENTS_COLLECTION}/${comment.id}`;
  try {
    const docRef = doc(db, COMMENTS_COLLECTION, comment.id);
    await setDoc(docRef, cleanUndefined(comment), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCompanyProfileToFirestore(profile: CompanyProfile) {
  const path = `${SETTINGS_COLLECTION}/${COMPANY_PROFILE_DOC}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, COMPANY_PROFILE_DOC);
    await setDoc(docRef, cleanUndefined(profile), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Ensure database is initialized without demo data
export async function checkAndSeedInitialDataIfNeeded(
  _initialTickets: TicketFollowup[],
  _initialVisas: VisaFollowup[],
  _initialComments: ActivityComment[]
) {
  try {
    const initRef = doc(db, SETTINGS_COLLECTION, SYSTEM_INIT_DOC);
    await setDoc(initRef, { initialized: true, timestamp: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("Error setting system init:", error);
  }
}

// Helper to determine if a visa record belongs to Dubai branch
export function isLegitimateDubaiVisa(v: VisaFollowup): boolean {
  if (!v) return false;
  return v.branch === 'Dubai';
}

// Helper to determine if a ticket belongs to Dubai branch
export function isLegitimateDubaiTicket(t: TicketFollowup): boolean {
  if (!t) return false;
  return t.branch === 'Dubai';
}

// Safe no-op functions ensuring no automated background overwrite or reassignment occurs
export async function restoreAllSriLankaBranchRecords(): Promise<{ visasRestored: number; ticketsRestored: number }> {
  return { visasRestored: 0, ticketsRestored: 0 };
}

export async function restoreAndEnsureDubaiBranchData(): Promise<{ visasAdded: number; ticketsAdded: number; expensesAdded: number }> {
  return { visasAdded: 0, ticketsAdded: 0, expensesAdded: 0 };
}

// Batch Clear / Seed Operations
export async function clearAllFirestoreData() {
  try {
    const ticketSnap = await getDocs(collection(db, TICKETS_COLLECTION));
    const ticketBatch = writeBatch(db);
    ticketSnap.forEach(d => ticketBatch.delete(d.ref));
    await ticketBatch.commit();

    const visaSnap = await getDocs(collection(db, VISAS_COLLECTION));
    const visaBatch = writeBatch(db);
    visaSnap.forEach(d => visaBatch.delete(d.ref));
    await visaBatch.commit();

    const commentSnap = await getDocs(collection(db, COMMENTS_COLLECTION));
    const commentBatch = writeBatch(db);
    commentSnap.forEach(d => commentBatch.delete(d.ref));
    await commentBatch.commit();

    const expenseSnap = await getDocs(collection(db, EXPENSES_COLLECTION));
    const expenseBatch = writeBatch(db);
    expenseSnap.forEach(d => expenseBatch.delete(d.ref));
    await expenseBatch.commit();

    const initRef = doc(db, SETTINGS_COLLECTION, SYSTEM_INIT_DOC);
    await setDoc(initRef, { initialized: true, cleared: true, timestamp: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'all_collections');
  }
}

export async function seedDemoFirestoreData(
  tickets: TicketFollowup[],
  visas: VisaFollowup[],
  comments: ActivityComment[]
) {
  try {
    await clearAllFirestoreData();

    const ticketBatch = writeBatch(db);
    tickets.forEach(t => {
      const docRef = doc(db, TICKETS_COLLECTION, t.id);
      ticketBatch.set(docRef, cleanUndefined(t));
    });
    await ticketBatch.commit();

    const visaBatch = writeBatch(db);
    visas.forEach(v => {
      const docRef = doc(db, VISAS_COLLECTION, v.id);
      visaBatch.set(docRef, cleanUndefined(v));
    });
    await visaBatch.commit();

    const commentBatch = writeBatch(db);
    comments.forEach(c => {
      const docRef = doc(db, COMMENTS_COLLECTION, c.id);
      commentBatch.set(docRef, cleanUndefined(c));
    });
    await commentBatch.commit();

    const initRef = doc(db, SETTINGS_COLLECTION, SYSTEM_INIT_DOC);
    await setDoc(initRef, { initialized: true, timestamp: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed_demo');
  }
}

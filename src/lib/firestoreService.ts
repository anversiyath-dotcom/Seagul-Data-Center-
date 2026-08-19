import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { TicketFollowup, VisaFollowup, ActivityComment, CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../types';

const TICKETS_COLLECTION = 'tickets';
const VISAS_COLLECTION = 'visas';
const COMMENTS_COLLECTION = 'comments';
const SETTINGS_COLLECTION = 'settings';
const COMPANY_PROFILE_DOC = 'companyProfile';
const SYSTEM_INIT_DOC = 'systemInit';

// Subscriptions for real-time live sync
export function subscribeToTickets(onUpdate: (tickets: TicketFollowup[]) => void) {
  return onSnapshot(collection(db, TICKETS_COLLECTION), (snapshot) => {
    const list: TicketFollowup[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as TicketFollowup);
    });
    onUpdate(list);
  }, (error) => {
    console.error("Firestore tickets sync error:", error);
  });
}

export function subscribeToVisas(onUpdate: (visas: VisaFollowup[]) => void) {
  return onSnapshot(collection(db, VISAS_COLLECTION), (snapshot) => {
    const list: VisaFollowup[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as VisaFollowup);
    });
    onUpdate(list);
  }, (error) => {
    console.error("Firestore visas sync error:", error);
  });
}

export function subscribeToComments(onUpdate: (comments: ActivityComment[]) => void) {
  return onSnapshot(collection(db, COMMENTS_COLLECTION), (snapshot) => {
    const list: ActivityComment[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as ActivityComment);
    });
    onUpdate(list);
  }, (error) => {
    console.error("Firestore comments sync error:", error);
  });
}

export function subscribeToCompanyProfile(onUpdate: (profile: CompanyProfile) => void) {
  const docRef = doc(db, SETTINGS_COLLECTION, COMPANY_PROFILE_DOC);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as CompanyProfile);
    } else {
      onUpdate(DEFAULT_COMPANY_PROFILE);
    }
  }, (error) => {
    console.error("Firestore company profile sync error:", error);
  });
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

// Single Item Mutations
export async function saveTicketToFirestore(ticket: TicketFollowup) {
  try {
    const docRef = doc(db, TICKETS_COLLECTION, ticket.id);
    await setDoc(docRef, cleanUndefined(ticket), { merge: true });
  } catch (error) {
    console.error("Error saving ticket to Firestore:", error);
  }
}

export async function deleteTicketFromFirestore(id: string) {
  try {
    const docRef = doc(db, TICKETS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting ticket from Firestore:", error);
  }
}

export async function saveVisaToFirestore(visa: VisaFollowup) {
  try {
    const docRef = doc(db, VISAS_COLLECTION, visa.id);
    await setDoc(docRef, cleanUndefined(visa), { merge: true });
  } catch (error) {
    console.error("Error saving visa to Firestore:", error);
  }
}

export async function deleteVisaFromFirestore(id: string) {
  try {
    const docRef = doc(db, VISAS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting visa from Firestore:", error);
  }
}

export async function saveCommentToFirestore(comment: ActivityComment) {
  try {
    const docRef = doc(db, COMMENTS_COLLECTION, comment.id);
    await setDoc(docRef, cleanUndefined(comment), { merge: true });
  } catch (error) {
    console.error("Error saving comment to Firestore:", error);
  }
}

export async function saveCompanyProfileToFirestore(profile: CompanyProfile) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, COMPANY_PROFILE_DOC);
    await setDoc(docRef, cleanUndefined(profile), { merge: true });
  } catch (error) {
    console.error("Error saving company profile to Firestore:", error);
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

// Batch Clear / Seed Operations
export async function clearAllFirestoreData() {
  try {
    // Tickets
    const ticketSnap = await getDocs(collection(db, TICKETS_COLLECTION));
    const ticketBatch = writeBatch(db);
    ticketSnap.forEach(d => ticketBatch.delete(d.ref));
    await ticketBatch.commit();

    // Visas
    const visaSnap = await getDocs(collection(db, VISAS_COLLECTION));
    const visaBatch = writeBatch(db);
    visaSnap.forEach(d => visaBatch.delete(d.ref));
    await visaBatch.commit();

    // Comments
    const commentSnap = await getDocs(collection(db, COMMENTS_COLLECTION));
    const commentBatch = writeBatch(db);
    commentSnap.forEach(d => commentBatch.delete(d.ref));
    await commentBatch.commit();

    // Ensure system_init is set so reloads stay empty and never re-seed demo data
    const initRef = doc(db, SETTINGS_COLLECTION, SYSTEM_INIT_DOC);
    await setDoc(initRef, { initialized: true, cleared: true, timestamp: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("Error clearing Firestore data:", error);
  }
}

export async function seedDemoFirestoreData(
  tickets: TicketFollowup[],
  visas: VisaFollowup[],
  comments: ActivityComment[]
) {
  try {
    await clearAllFirestoreData();

    // Tickets batch
    const ticketBatch = writeBatch(db);
    tickets.forEach(t => {
      const docRef = doc(db, TICKETS_COLLECTION, t.id);
      ticketBatch.set(docRef, cleanUndefined(t));
    });
    await ticketBatch.commit();

    // Visas batch
    const visaBatch = writeBatch(db);
    visas.forEach(v => {
      const docRef = doc(db, VISAS_COLLECTION, v.id);
      visaBatch.set(docRef, cleanUndefined(v));
    });
    await visaBatch.commit();

    // Comments batch
    const commentBatch = writeBatch(db);
    comments.forEach(c => {
      const docRef = doc(db, COMMENTS_COLLECTION, c.id);
      commentBatch.set(docRef, cleanUndefined(c));
    });
    await commentBatch.commit();

    // Mark as initialized
    const initRef = doc(db, SETTINGS_COLLECTION, SYSTEM_INIT_DOC);
    await setDoc(initRef, { initialized: true, timestamp: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("Error seeding Firestore demo data:", error);
  }
}

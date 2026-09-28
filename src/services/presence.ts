import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, DEFAULT_CLASS_ID, handleFirestoreError, OperationType } from './firebase';
import { VisitorPresence, VisitorStats } from '../types';
import { getTodayDateStr } from './utils';

const VISITOR_ID_KEY = 'KAS_VISITOR_ID_V1';
const VISITOR_LABEL_KEY = 'KAS_VISITOR_LABEL_V1';

// Generate or retrieve persistent visitor ID
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server_session';
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    const randomHex = Math.random().toString(36).substring(2, 9);
    id = `wm_${randomHex}_${Date.now().toString(36)}`;
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

// Get or set optional custom alias/name (e.g. Wali Murid / Orang Tua)
export function getVisitorLabel(): string {
  if (typeof window === 'undefined') return 'Wali Murid';
  return localStorage.getItem(VISITOR_LABEL_KEY) || 'Wali Murid';
}

export function setVisitorLabel(label: string): void {
  if (typeof window !== 'undefined' && label.trim()) {
    localStorage.setItem(VISITOR_LABEL_KEY, label.trim());
  }
}

// Device detection helper
export function detectDeviceName(): string {
  if (typeof window === 'undefined') return 'Perangkat Tidak Diketahui';
  const ua = navigator.userAgent;

  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isAndroid) {
    return isPWA ? 'HP Android (PWA Terpasang)' : 'HP Android (Browser)';
  }
  if (isIOS) {
    return isPWA ? 'iPhone/iPad (PWA Terpasang)' : 'iPhone/iPad (Safari)';
  }
  if (/Windows/i.test(ua)) return 'Komputer / Laptop (Windows)';
  if (/Macintosh/i.test(ua)) return 'Komputer / Laptop (Mac)';
  if (/Linux/i.test(ua)) return 'Komputer / Laptop (Linux)';
  return 'Perangkat HP / Komputer';
}

// Send or update presence heartbeat in Firestore
export async function sendPresencePing(
  role: 'wali_murid' | 'pengurus' = 'wali_murid',
  isOnline: boolean = true,
  currentPage: string = 'Transparansi Kas',
  classId: string = DEFAULT_CLASS_ID
): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  const dateKey = getTodayDateStr();
  const docRef = doc(db, 'classes', classId, 'presence', visitorId);

  const payload: VisitorPresence = {
    visitorId,
    role,
    device: detectDeviceName(),
    openedAt: sessionStorage.getItem('KAS_SESSION_OPENED_AT') || new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    isOnline,
    dateKey,
    label: getVisitorLabel(),
    page: currentPage,
  };

  if (!sessionStorage.getItem('KAS_SESSION_OPENED_AT')) {
    sessionStorage.setItem('KAS_SESSION_OPENED_AT', payload.openedAt);
  }

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `classes/${classId}/presence/${visitorId}`);
  }
}

// Set offline when leaving or closing app
export async function sendOfflinePing(
  role: 'wali_murid' | 'pengurus' = 'wali_murid',
  classId: string = DEFAULT_CLASS_ID
): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  const docRef = doc(db, 'classes', classId, 'presence', visitorId);
  try {
    await setDoc(
      docRef,
      {
        visitorId,
        role,
        isOnline: false,
        lastSeen: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Graceful silent ignore on unload
  }
}

// Real-time listener for active and recent visitors
export function subscribeToVisitorPresence(
  classId: string = DEFAULT_CLASS_ID,
  onUpdate: (stats: VisitorStats) => void,
  onNewWaliMuridArrival?: (visitor: VisitorPresence) => void
): Unsubscribe {
  const presenceColRef = collection(db, 'classes', classId, 'presence');
  const myVisitorId = getOrCreateVisitorId();
  let knownActiveIds = new Set<string>();
  let hasInitialized = false;

  return onSnapshot(
    presenceColRef,
    (snapshot) => {
      const now = Date.now();
      const today = getTodayDateStr();
      const allVisitors: VisitorPresence[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as VisitorPresence;
        if (data && data.visitorId && data.lastSeen) {
          allVisitors.push(data);
        }
      });

      // Filter active visitors (active within last 90 seconds and isOnline !== false)
      const activeVisitors = allVisitors.filter((v) => {
        const lastSeenTime = new Date(v.lastSeen).getTime();
        const isRecent = now - lastSeenTime <= 90 * 1000;
        return isRecent && v.isOnline !== false;
      });

      // Sort by lastSeen descending
      activeVisitors.sort(
        (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );

      // Filter wali murid active sessions
      const activeWaliMurid = activeVisitors.filter((v) => v.role === 'wali_murid');
      const activePengurus = activeVisitors.filter((v) => v.role === 'pengurus');

      // Recent visitors today
      const recentVisitors = allVisitors
        .filter((v) => v.dateKey === today || (now - new Date(v.lastSeen).getTime() <= 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
        .slice(0, 15);

      // Latest wali murid open time
      const latestWaliMurid = allVisitors
        .filter((v) => v.role === 'wali_murid')
        .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())[0];

      // Check for new incoming wali murid
      const currentActiveWaliIds = new Set(activeWaliMurid.map((v) => v.visitorId));
      if (hasInitialized && onNewWaliMuridArrival) {
        for (const visitor of activeWaliMurid) {
          if (visitor.visitorId !== myVisitorId && !knownActiveIds.has(visitor.visitorId)) {
            onNewWaliMuridArrival(visitor);
          }
        }
      }
      knownActiveIds = currentActiveWaliIds;
      hasInitialized = true;

      const stats: VisitorStats = {
        onlineWaliMuridCount: activeWaliMurid.length,
        onlinePengurusCount: activePengurus.length,
        onlineTotalCount: activeVisitors.length,
        todayVisitCount: allVisitors.filter((v) => v.dateKey === today).length,
        lastWaliMuridOpenedAt: latestWaliMurid ? latestWaliMurid.lastSeen : null,
        activeVisitors,
        recentVisitors,
      };

      onUpdate(stats);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `classes/${classId}/presence`);
    }
  );
}

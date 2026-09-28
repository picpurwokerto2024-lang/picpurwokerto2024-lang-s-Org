import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppState } from '../types';

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
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const isOffline =
    error instanceof Error &&
    (error.message.includes('unavailable') ||
      error.message.includes('offline') ||
      error.message.includes('Could not reach Cloud Firestore backend'));

  if (!isOffline) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path,
    };
    console.warn('Firestore Error Notice:', JSON.stringify(errInfo));
  }
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with robust local persistent cache and long polling fallback support
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreInstance;

export const DEFAULT_CLASS_ID = 'kelas_utama';

// Test connection silently and gracefully
export async function testConnection(): Promise<boolean> {
  try {
    const docRef = doc(db, 'classes', DEFAULT_CLASS_ID);
    await getDoc(docRef);
    return true;
  } catch (error) {
    // Non-blocking: Firestore handles offline caching automatically
    return false;
  }
}

// Subscribe to real-time changes with cached snapshot fallback
export function subscribeToClassData(
  classId: string = DEFAULT_CLASS_ID,
  onData: (data: Partial<AppState>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'classes', classId);
  return onSnapshot(
    docRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppState;
        onData(data);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `classes/${classId}`);
      if (onError) onError(error);
    }
  );
}

// Save / Sync state to Firestore
export async function syncClassStateToFirestore(
  state: AppState,
  classId: string = DEFAULT_CLASS_ID
): Promise<void> {
  const docRef = doc(db, 'classes', classId);
  try {
    const updatedAt = state.updatedAt || new Date().toISOString();
    const payload = {
      classConfig: state.classConfig,
      students: state.students || [],
      jimpitanRecords: state.jimpitanRecords || [],
      transactions: state.transactions || [],
      savingsGoals: state.savingsGoals || [],
      lastBackupDate: state.lastBackupDate || new Date().toISOString(),
      updatedAt,
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `classes/${classId}`);
    throw error;
  }
}

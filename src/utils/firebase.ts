import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { BiodataContent } from '../types/biodata';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured database ID
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Initialize Auth & Storage
export const auth = getAuth(app);
export const storage = getStorage(app, (firebaseConfig as any).storageBucket);

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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore
 */
export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'biodata', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or internet connection.');
    }
  }
}

/**
 * Saves biodata content directly to Firestore under /biodata/nasir_biodata
 */
export async function saveBiodataToFirestore(biodata: BiodataContent): Promise<void> {
  const docPath = 'biodata/nasir_biodata';
  try {
    // Strip undefined properties which Firestore rejects with 'Unsupported field value: undefined'
    const cleanPayload = JSON.parse(JSON.stringify(biodata));
    await setDoc(doc(db, 'biodata', 'nasir_biodata'), {
      ...cleanPayload,
      updatedAt: new Date().toISOString(),
    });
    console.log('[Firestore] Successfully persisted biodata to Firestore (biodata/nasir_biodata)');
  } catch (error) {
    console.warn('[Firestore] Direct write notice:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch {}
  }
}

/**
 * Fetches biodata content from Firestore
 */
export async function loadBiodataFromFirestore(): Promise<BiodataContent | null> {
  const docPath = 'biodata/nasir_biodata';
  try {
    const snap = await getDoc(doc(db, 'biodata', 'nasir_biodata'));
    if (snap.exists()) {
      return snap.data() as BiodataContent;
    }
    return null;
  } catch (error) {
    console.warn('Could not read from Firestore directly (falling back to server API):', error);
    return null;
  }
}

import { initializeApp } from "firebase/app";

import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";

import {
  getFirestore,
  doc as fsDoc,
  getDoc as fsGetDoc,
} from "firebase/firestore";

import { getFunctions } from "firebase/functions";

import {
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  get as rtdbGet,
} from "firebase/database";

const firebaseConfig = {
  apiKey: (import.meta.env as any).VITE_FIREBASE_API_KEY,

  authDomain: (import.meta.env as any).VITE_FIREBASE_AUTH_DOMAIN,

  databaseURL: (import.meta.env as any).VITE_FIREBASE_DATABASE_URL,

  projectId: (import.meta.env as any).VITE_FIREBASE_PROJECT_ID,

  storageBucket: (import.meta.env as any).VITE_FIREBASE_STORAGE_BUCKET,

  messagingSenderId: (import.meta.env as any).VITE_FIREBASE_MESSAGING_SENDER_ID,

  appId: (import.meta.env as any).VITE_FIREBASE_APP_ID,
};

// 1. Initialize App (Exported immediately to avoid "missing export" errors)

export const app = initializeApp(firebaseConfig);

// 2. Initialize Services

export const auth = getAuth(app);

export const functions = getFunctions(app, "us-central1"); // Match your backend region here!

let anonymousAuthPromise: Promise<void> | undefined;

export function ensureAuthenticatedUser(): Promise<void> {
  if (auth.currentUser) return Promise.resolve();
  if (anonymousAuthPromise) return anonymousAuthPromise;

  anonymousAuthPromise = new Promise<void>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) {
          resolve();
        } else {
          signInAnonymously(auth).then(
            () => resolve(),
            (error) => reject(error),
          );
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  }).finally(() => {
    anonymousAuthPromise = undefined;
  });

  return anonymousAuthPromise;
}

// Firestore Logic

const disableFirestore =
  (import.meta.env as any).VITE_DISABLE_FIRESTORE === "true";

let _db: any = null;

if (!disableFirestore) {
  try {
    _db = getFirestore(app);
  } catch (e) {
    console.warn("Firestore initialization failed:", e);
  }
}

export const db = _db;

// RTDB Logic

let _rtdb: any = null;

if (firebaseConfig.databaseURL) {
  try {
    _rtdb = getDatabase(app);
  } catch (e) {
    console.warn("RTDB initialization failed:", e);
  }
}

export const rtdb = _rtdb;

// Helpers

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (!db) return false;

    const dref = fsDoc(db, "__ping__", "test");

    await fsGetDoc(dref);

    return true;
  } catch (e) {
    return false;
  }
}

export async function testRTDBConnection(): Promise<boolean> {
  try {
    if (!rtdb) return false;

    const p = rtdbRef(rtdb, "__ping__/test");

    await rtdbSet(p, { ts: Date.now() });

    await rtdbGet(p);

    return true;
  } catch (e) {
    return false;
  }
}

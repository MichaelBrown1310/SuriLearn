/**
 * Firebase Initialization & Configuration
 * SuriLearn - Spark Plan ($0 Cost) Optimization
 *
 * Configured with Multi-Tab Persistent IndexedDB Cache to minimize
 * Firestore read operations and stay well below the 50,000 daily read limit.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
} from 'firebase/firestore';

// Environment credentials with fallback sandbox defaults for Web/Local development
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'AIzaSyCDtHJjQeivF322K6Pp0tWvtEwCfNfiPMM',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'surilearn-9b60e.firebaseapp.com',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'surilearn-9b60e',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'surilearn-9b60e.firebasestorage.app',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '465579475637',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || '1:465579475637:web:50940768d36d44a9d4b4fc',
};

// Singleton pattern to prevent re-initialization during HMR (Hot Module Replacement)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Authentication Instance
export const auth: Auth = getAuth(app);

// Google Sign-In Provider configured for mobile and web
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// Firestore Instance with IndexedDB Persistent Local Cache
// Crucial for Spark Plan ($0): subsequent visits and repeated queries hit client IndexedDB
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // Fallback to standard getFirestore if persistent cache is already active or in SSR/test environment
  firestoreDb = getFirestore(app);
}

export const db: Firestore = firestoreDb;
export const firebaseApp: FirebaseApp = app;

export default app;

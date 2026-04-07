import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_PROJECT_ID + '.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_PROJECT_ID + '.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let app: any;
let auth: any;
let db: any;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    auth = null;
    db = null;
  }
} else {
  console.warn('Firebase configuration incomplete. Missing FIREBASE_API_KEY or FIREBASE_PROJECT_ID');
  auth = null;
  db = null;
}

export { app, auth, db, isFirebaseConfigured };

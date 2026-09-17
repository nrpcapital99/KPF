import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

/**
 * Shared Firebase app. Deliberately initialises nothing else: the public form
 * pulls in only the lightweight Firestore Lite SDK, and the team page pulls in
 * Auth and full Firestore, so a volunteer on a phone never downloads the
 * sign-in code.
 *
 * These values are not secrets — Firebase ships them in the client by design.
 * Who can read and write what is decided by firestore.rules.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function firebaseApp(): FirebaseApp {
  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error(
      "Firebase is not configured. Add the VITE_FIREBASE_* values to .env.",
    );
  }
  return getApps().length ? getApp() : initializeApp(config);
}

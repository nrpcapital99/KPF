import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let emulatorsConnected = false;

export function getFirebase() {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Copy .env.example to .env.local and add the Firebase web app values.",
    );
  }

  if (!app) {
    app = getApps().length ? getApp() : initializeApp(config);
    auth = getAuth(app);

    // Offline persistence matters here: volunteers open this on a phone at a
    // school or a community centre, often on a weak connection. With a
    // persistent cache the directory and their own commitments still render,
    // and writes queue until the device is back online.
    //
    // persistentMultipleTabManager keeps that cache coherent if someone has
    // the app open in more than one tab. If IndexedDB is unavailable — private
    // browsing, or a browser with site data blocked — initializeFirestore
    // throws, so fall back to an in-memory cache rather than failing to boot.
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      db = initializeFirestore(app, {});
    }
  }

  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" && !emulatorsConnected) {
    connectAuthEmulator(auth!, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db!, "127.0.0.1", 8080);
    emulatorsConnected = true;
  }

  return { app, auth: auth!, db: db! };
}

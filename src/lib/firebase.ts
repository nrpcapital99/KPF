import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase initialisation.
 *
 * Nothing in the app imports this yet — the UI runs entirely on seed data via
 * src/data/api.ts. Fill in .env.local and this becomes live in one step.
 *
 * These VITE_ values are bundled into the client. That is expected and safe
 * for Firebase: the API key identifies the project, it does not authorise
 * anything. Access is controlled by the @auth directives in
 * dataconnect/connector/*.gql, which are enforced server-side.
 */

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebase() {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Copy .env.example to .env.local and fill in your project values.",
    );
  }
  if (!app) {
    app = initializeApp(config);
    auth = getAuth(app);
  }
  return { app: app!, auth: auth! };
}

import { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { firebaseApp } from "../lib/firebase";
import type { Volunteer, VolunteerStatus } from "../types";

const auth = () => getAuth(firebaseApp());
const db = () => getFirestore(firebaseApp());

/* --- Auth ---------------------------------------------------------------- */

export type AuthState = { kind: "loading" } | { kind: "out" } | { kind: "in"; user: User };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ kind: "loading" });
  useEffect(
    () =>
      onAuthStateChanged(auth(), (user) =>
        setState(user ? { kind: "in", user } : { kind: "out" }),
      ),
    [],
  );
  return state;
}

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth(), email.trim(), password);

export const signOut = () => firebaseSignOut(auth());

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth(), email.trim());

export function describeAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password don't match.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes, or reset your password.";
    case "auth/network-request-failed":
      return "Can't reach the server. Please check your connection.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      return "Couldn't sign in. Please try again.";
  }
}

/* --- Responses ----------------------------------------------------------- */

export type ResponsesState =
  | { kind: "loading" }
  | { kind: "ready"; rows: Volunteer[] }
  | { kind: "denied" }
  | { kind: "error"; message: string };

const toDate = (value: unknown) =>
  value && typeof (value as Timestamp).toDate === "function"
    ? (value as Timestamp).toDate()
    : null;

function toVolunteer(id: string, data: DocumentData): Volunteer {
  return {
    id,
    fullName: data.fullName ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    city: data.city ?? null,
    interests: Array.isArray(data.interests) ? data.interests : [],
    commitment: data.commitment ?? null,
    preferredTimes: Array.isArray(data.preferredTimes) ? data.preferredTimes : [],
    message: data.message ?? null,
    consent: true,
    status: data.status ?? "NEW",
    note: data.note ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/**
 * Live list of responses, newest first. New submissions appear without a
 * refresh. Whether this account may see them is decided by firestore.rules —
 * a permission error here simply means "not a team member".
 */
export function useResponses(enabled: boolean): ResponsesState {
  const [state, setState] = useState<ResponsesState>({ kind: "loading" });

  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      query(collection(db(), "volunteers"), orderBy("createdAt", "desc")),
      (snapshot) =>
        setState({
          kind: "ready",
          rows: snapshot.docs.map((item) => toVolunteer(item.id, item.data())),
        }),
      (error) =>
        setState(
          error.code === "permission-denied"
            ? { kind: "denied" }
            : { kind: "error", message: error.message },
        ),
    );
  }, [enabled]);

  return state;
}

export const setStatus = (id: string, status: VolunteerStatus) =>
  updateDoc(doc(db(), "volunteers", id), { status, updatedAt: serverTimestamp() });

export const setNote = (id: string, note: string) =>
  updateDoc(doc(db(), "volunteers", id), {
    note: note.trim() || null,
    updatedAt: serverTimestamp(),
  });

export const deleteResponse = (id: string) => deleteDoc(doc(db(), "volunteers", id));

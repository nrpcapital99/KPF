import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore/lite";
import { firebaseApp } from "../lib/firebase";
import type { VolunteerInput } from "../types";

/**
 * Loaded on demand. Firestore Lite is a fraction of the size of the full SDK
 * and a one-shot write is all the public form needs — no realtime listeners,
 * no offline cache.
 */

const TIMEOUT_MS = 20_000;

export async function submitVolunteer(input: VolunteerInput): Promise<void> {
  const db = getFirestore(firebaseApp());

  const write = addDoc(collection(db, "volunteers"), {
    ...input,
    status: "NEW",
    createdAt: serverTimestamp(),
  });

  // On a weak mobile connection a request can hang rather than fail. Give up
  // after a while so the person can retry instead of watching a spinner.
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
  );

  await Promise.race([write, timeout]);
}

export function describeSubmitError(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : "";

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You seem to be offline. Please check your connection and try again — your answers are still here.";
  }
  if (message === "timeout" || code === "unavailable" || code === "deadline-exceeded") {
    return "We couldn't reach our server. Please check your connection and try again — your answers are still here.";
  }
  if (code === "permission-denied") {
    return "Something in the form wasn't accepted. Please check your details and try again.";
  }
  return "Something went wrong sending your details. Please try again in a moment.";
}

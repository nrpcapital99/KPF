import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebase } from "../lib/firebase";
import type {
  AccountRequest,
  Participant,
  Project,
  Slot,
  SlotSignup,
} from "../types";

/**
 * Small realtime cache over Cloud Firestore.
 *
 * Pages read synchronously from this snapshot, while Firestore listeners keep
 * it current and useSyncExternalStore triggers React renders. Firestore—not
 * localStorage—is the source of truth.
 */
export interface DB {
  participants: Participant[];
  accountRequests: AccountRequest[];
  slots: Slot[];
  signups: SlotSignup[];
  projects: Project[];
  authReady: boolean;
  profileReady: boolean;
  configured: boolean | null;
  authUser: User | null;
  me: Participant | null;
  myRequest: AccountRequest | null;
  error: string | null;
}

function emptyState(): DB {
  return {
    participants: [],
    accountRequests: [],
    slots: [],
    signups: [],
    projects: [],
    authReady: false,
    profileReady: false,
    configured: null,
    authUser: null,
    me: null,
    myRequest: null,
    error: null,
  };
}

let state = emptyState();
const listeners = new Set<() => void>();
let userListeners: Unsubscribe[] = [];
let collectionListeners: Unsubscribe[] = [];

function publish(patch: Partial<DB>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function read(): DB {
  return state;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function rows<T>(snapshot: QuerySnapshot<DocumentData>): T[] {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

function stop(list: Unsubscribe[]) {
  list.forEach((unsubscribe) => unsubscribe());
  list.length = 0;
}

function listenCollection<T>(name: string, key: keyof DB) {
  const { db } = getFirebase();
  return onSnapshot(
    collection(db, name),
    (snapshot) => publish({ [key]: rows<T>(snapshot) } as Partial<DB>),
    (error) => publish({ error: error.message }),
  );
}

function startAuthorizedCollections(role: Participant["role"]) {
  stop(collectionListeners);
  collectionListeners.push(
    listenCollection<Participant>("participants", "participants"),
    listenCollection<Slot>("slots", "slots"),
    listenCollection<SlotSignup>("signups", "signups"),
    listenCollection<Project>("projects", "projects"),
  );

  if (role === "ADMIN" || role === "COORDINATOR") {
    collectionListeners.push(
      listenCollection<AccountRequest>("accountRequests", "accountRequests"),
    );
  } else {
    publish({ accountRequests: [] });
  }
}

function start() {
  try {
    const { auth, db } = getFirebase();
    const startupTimer = globalThis.setTimeout(() => {
      if (state.configured === null) {
        publish({
          error:
            "Cloud Firestore did not respond. Create the Firestore database and deploy firestore.rules, then reload.",
        });
      }
    }, 8000);

    onSnapshot(
      doc(db, "config", "foundation"),
      (snapshot) => {
        globalThis.clearTimeout(startupTimer);
        publish({ configured: snapshot.exists(), error: null });
      },
      (error) => {
        globalThis.clearTimeout(startupTimer);
        publish({ error: error.message });
      },
    );

    onAuthStateChanged(auth, (user) => {
      stop(userListeners);
      stop(collectionListeners);
      publish({
        authReady: true,
        profileReady: !user,
        authUser: user,
        me: null,
        myRequest: null,
        participants: [],
        accountRequests: [],
        slots: [],
        signups: [],
        projects: [],
            error: null,
      });

      if (!user) return;

      userListeners.push(
        onSnapshot(
          doc(db, "participants", user.uid),
          (snapshot) => {
            const me = snapshot.exists()
              ? ({ id: snapshot.id, ...snapshot.data() } as Participant)
              : null;
            publish({ me, profileReady: true });
            if (me?.status === "ACTIVE") startAuthorizedCollections(me.role);
          },
          (error) => publish({ profileReady: true, error: error.message }),
        ),
        onSnapshot(
          doc(db, "accountRequests", user.uid),
          (snapshot) =>
            publish({
              myRequest: snapshot.exists()
                ? ({ id: snapshot.id, ...snapshot.data() } as AccountRequest)
                : null,
            }),
          (error) => publish({ error: error.message }),
        ),
      );
    });
  } catch (error) {
    publish({
      authReady: true,
      profileReady: true,
      configured: false,
      error: (error as Error).message,
    });
  }
}

start();

export function newId(prefix: string) {
  const rand = crypto.randomUUID().replaceAll("-", "").slice(0, 20);
  return `${prefix}_${rand}`;
}

export const nowIso = () => new Date().toISOString();
export const todayIso = () => new Date().toISOString().slice(0, 10);

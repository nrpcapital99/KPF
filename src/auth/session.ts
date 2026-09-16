import { useSyncExternalStore } from "react";
import type { User } from "firebase/auth";
import { read, subscribe } from "../data/store";
import type { AccountRequest, Participant } from "../types";

export function useStore() {
  return useSyncExternalStore(subscribe, read, read);
}

export type SessionState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "setup" }
  | { kind: "anonymous" }
  | { kind: "inactive"; user: Participant }
  | { kind: "pending"; authUser: User; request: AccountRequest | null }
  | { kind: "signedIn"; user: Participant };

export function useSession(): SessionState {
  const store = useStore();

  if (store.configured === null && store.error) {
    return { kind: "error", message: store.error };
  }

  if (
    store.configured === null ||
    !store.authReady ||
    (store.authUser && !store.profileReady)
  ) {
    return { kind: "loading" };
  }
  if (!store.configured) return { kind: "setup" };
  if (!store.authUser) return { kind: "anonymous" };
  if (store.me && store.me.status !== "ACTIVE") {
    return { kind: "inactive", user: store.me };
  }
  if (store.me) return { kind: "signedIn", user: store.me };
  return {
    kind: "pending",
    authUser: store.authUser,
    request: store.myRequest,
  };
}

export function useCurrentUser(): Participant {
  const session = useSession();
  if (session.kind !== "signedIn") {
    throw new Error("useCurrentUser called outside a signed-in route.");
  }
  return session.user;
}

export const isAdmin = (user: Participant) => user.role === "ADMIN";
export const isStaff = (user: Participant) =>
  user.role === "ADMIN" || user.role === "COORDINATOR";

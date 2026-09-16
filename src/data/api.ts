import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  doc,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebase } from "../lib/firebase";
import type {
  AccountRequest,
  AccountRequestInput,
  AccountRequestStatus,
  DashboardStats,
  MemberRole,
  NewParticipantInput,
  Participant,
  ParticipantFilters,
  ParticipantStatus,
  Project,
  SignupStatus,
  Slot,
  SlotInput,
  SlotSignup,
  SlotWithCounts,
  VolunteerStats,
} from "../types";
import { EXPERTISE_AREAS, LOCATIONS } from "./config";
import { newId, nowIso, read, todayIso } from "./store";

/* --- Config -------------------------------------------------------------- */

export const listExpertiseAreas = () => EXPERTISE_AREAS;
export const listLocations = () => LOCATIONS;

export function expertiseByIds(ids: string[]) {
  return EXPERTISE_AREAS.filter((area) => ids.includes(area.id));
}

/* --- Auth ---------------------------------------------------------------- */

export function needsSetup() {
  return read().configured === false;
}

export function currentUser(): Participant | null {
  return read().me;
}

export async function bootstrapFirstAdmin(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  location?: string;
}): Promise<Participant> {
  const { auth, db } = getFirebase();
  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email.trim().toLowerCase(),
    input.password,
  );
  const uid = credential.user.uid;
  const admin: Participant = {
    id: uid,
    authUid: uid,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    location: input.location || null,
    avatarUrl: null,
    about: null,
    role: "ADMIN",
    status: "ACTIVE",
    availabilityHoursPerWeek: 0,
    consentToContact: true,
    joinedOn: todayIso(),
    expertise: [],
  };

  try {
    await runTransaction(db, async (transaction) => {
      const configRef = doc(db, "config", "foundation");
      const config = await transaction.get(configRef);
      if (config.exists()) throw new Error("The foundation is already set up.");

      transaction.set(configRef, {
        configuredAt: nowIso(),
        bootstrapUid: uid,
        name: "Kanak Parakh Foundation",
      });
      transaction.set(doc(db, "participants", uid), admin);
    });
    return admin;
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  const { auth } = getFirebase();
  return signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function signOut() {
  const { auth } = getFirebase();
  await firebaseSignOut(auth);
}

/* --- Account requests ---------------------------------------------------- */

export async function submitAccountRequest(
  input: AccountRequestInput,
  password: string,
): Promise<AccountRequest> {
  const { auth, db } = getFirebase();
  const email = input.email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  const request: AccountRequest = {
    id: uid,
    authUid: uid,
    fullName: input.fullName.trim(),
    email,
    phone: input.phone.trim(),
    location: input.location || null,
    about: input.about?.trim() || null,
    expertiseIds: [...input.expertiseIds],
    availabilityHoursPerWeek: input.availabilityHoursPerWeek,
    consentToContact: input.consentToContact,
    status: "PENDING",
    requestedAt: nowIso(),
  };

  try {
    await setDoc(doc(db, "accountRequests", uid), request);
    return request;
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}

export function listAccountRequests(status?: AccountRequestStatus) {
  const requests = read().accountRequests;
  return status ? requests.filter((request) => request.status === status) : requests;
}

export function countPendingRequests() {
  return read().accountRequests.filter((request) => request.status === "PENDING").length;
}

export async function approveAccountRequest(
  requestId: string,
  adminId: string,
): Promise<Participant> {
  const request = read().accountRequests.find((item) => item.id === requestId);
  if (!request) throw new Error("Request not found.");
  if (request.status !== "PENDING") throw new Error("Already decided.");

  const person: Participant = {
    id: request.authUid,
    authUid: request.authUid,
    fullName: request.fullName,
    email: request.email,
    phone: request.phone,
    location: request.location,
    avatarUrl: null,
    about: request.about,
    role: "VOLUNTEER",
    status: "ACTIVE",
    availabilityHoursPerWeek: request.availabilityHoursPerWeek,
    consentToContact: request.consentToContact,
    joinedOn: todayIso(),
    expertise: expertiseByIds(request.expertiseIds),
  };

  const { db } = getFirebase();
  const batch = writeBatch(db);
  batch.set(doc(db, "participants", person.id), person);
  batch.update(doc(db, "accountRequests", requestId), {
    status: "APPROVED",
    decidedAt: nowIso(),
    decidedById: adminId,
  });
  await batch.commit();
  return person;
}

export async function rejectAccountRequest(
  requestId: string,
  adminId: string,
  note?: string,
) {
  const { db } = getFirebase();
  await updateDoc(doc(db, "accountRequests", requestId), {
    status: "REJECTED",
    decidedAt: nowIso(),
    decidedById: adminId,
    decisionNote: note || null,
  });
}

/* --- Participants -------------------------------------------------------- */

export function emailTaken(email: string) {
  const normalized = email.trim().toLowerCase();
  const db = read();
  return (
    db.participants.some((person) => person.email.toLowerCase() === normalized) ||
    db.accountRequests.some(
      (request) =>
        request.email.toLowerCase() === normalized && request.status === "PENDING",
    )
  );
}

export async function createParticipant(input: NewParticipantInput) {
  if (emailTaken(input.email)) throw new Error("EMAIL_TAKEN");
  const id = newId("p");
  const person: Participant = {
    id,
    authUid: null,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    location: input.location || null,
    avatarUrl: null,
    about: input.about?.trim() || null,
    role: "VOLUNTEER",
    status: "ACTIVE",
    availabilityHoursPerWeek: input.availabilityHoursPerWeek,
    consentToContact: input.consentToContact,
    joinedOn: todayIso(),
    expertise: expertiseByIds(input.expertiseIds),
  };
  const { db } = getFirebase();
  await setDoc(doc(db, "participants", id), person);
  return person;
}

const AVAILABILITY_RANGES: Record<
  ParticipantFilters["availability"],
  [number, number]
> = {
  ALL: [0, Infinity],
  "0-5": [0, 5],
  "5-10": [5, 10],
  "10-20": [10, 20],
  "20+": [20, Infinity],
};

export function listParticipants(filters: Partial<ParticipantFilters> = {}) {
  const {
    search = "",
    expertiseId = "ALL",
    availability = "ALL",
    location = "ALL",
    status = "ALL",
  } = filters;
  const query = search.trim().toLowerCase();
  const [minHours, maxHours] = AVAILABILITY_RANGES[availability];

  return read()
    .participants.filter((person) => {
      if (status !== "ALL" && person.status !== status) return false;
      if (location !== "ALL" && person.location !== location) return false;
      if (
        expertiseId !== "ALL" &&
        !person.expertise.some((area) => area.id === expertiseId)
      ) {
        return false;
      }
      if (
        person.availabilityHoursPerWeek < minHours ||
        person.availabilityHoursPerWeek > maxHours
      ) {
        return false;
      }
      if (!query) return true;
      return [
        person.fullName,
        person.email,
        person.location ?? "",
        ...person.expertise.map((area) => area.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function listRecentParticipants(limit = 5) {
  return [...read().participants]
    .sort((a, b) => b.joinedOn.localeCompare(a.joinedOn))
    .slice(0, limit);
}

export function getParticipant(id: string) {
  return read().participants.find((person) => person.id === id) ?? null;
}

export async function updateParticipant(id: string, patch: Partial<Participant>) {
  const current = getParticipant(id);
  if (!current) throw new Error("Participant not found.");
  const { db } = getFirebase();
  await updateDoc(doc(db, "participants", id), patch);
  return { ...current, ...patch };
}

export const setParticipantRole = (id: string, role: MemberRole) =>
  updateParticipant(id, { role });

export const setParticipantStatus = (id: string, status: ParticipantStatus) =>
  updateParticipant(id, { status });

/* --- Slots --------------------------------------------------------------- */

export async function createSlot(input: SlotInput, createdById: string) {
  const id = newId("slot");
  const slot: Slot = {
    id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    location: input.location || null,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    capacity: input.capacity,
    status: "OPEN",
    projectId: input.projectId ?? null,
    requiredExpertiseIds: [...input.requiredExpertiseIds],
    createdById,
    createdAt: nowIso(),
  };
  const { db } = getFirebase();
  await setDoc(doc(db, "slots", id), slot);
  return slot;
}

export async function updateSlot(id: string, patch: Partial<Slot>) {
  const current = read().slots.find((slot) => slot.id === id);
  if (!current) throw new Error("Slot not found.");
  const { db } = getFirebase();
  await updateDoc(doc(db, "slots", id), patch);
  return { ...current, ...patch };
}

export function getSlot(id: string) {
  return read().slots.find((slot) => slot.id === id) ?? null;
}

function decorate(slot: Slot, viewerId?: string): SlotWithCounts {
  const signups = read().signups.filter((signup) => signup.slotId === slot.id);
  return {
    ...slot,
    approvedCount: signups.filter(
      (signup) => signup.status === "APPROVED" || signup.status === "ATTENDED",
    ).length,
    requestedCount: signups.filter((signup) => signup.status === "REQUESTED").length,
    mySignup: viewerId
      ? signups.find(
          (signup) =>
            signup.participantId === viewerId &&
            signup.status !== "WITHDRAWN" &&
            signup.status !== "DECLINED",
        ) ?? null
      : null,
  };
}

export function listSlots(viewerId?: string): SlotWithCounts[] {
  return [...read().slots]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((slot) => decorate(slot, viewerId));
}

export function listOpenSlots(viewerId?: string) {
  const now = nowIso();
  return listSlots(viewerId).filter(
    (slot) => slot.status === "OPEN" && slot.endsAt >= now,
  );
}

/* --- Slot signups -------------------------------------------------------- */

export async function requestSlot(
  slotId: string,
  participantId: string,
  note?: string,
) {
  const slot = getSlot(slotId);
  if (!slot) throw new Error("Slot not found.");
  if (slot.status !== "OPEN" || slot.endsAt < nowIso()) throw new Error("SLOT_CLOSED");
  const existing = read().signups.find(
    (signup) =>
      signup.slotId === slotId &&
      signup.participantId === participantId &&
      signup.status !== "WITHDRAWN" &&
      signup.status !== "DECLINED",
  );
  if (existing) throw new Error("ALREADY_REQUESTED");

  const id = newId("su");
  const signup: SlotSignup = {
    id,
    slotId,
    participantId,
    status: "REQUESTED",
    note: note?.trim() || null,
    requestedAt: nowIso(),
  };
  const { db } = getFirebase();
  await setDoc(doc(db, "signups", id), signup);
  return signup;
}

async function setSignupStatus(
  id: string,
  status: SignupStatus,
  decidedById?: string,
  hoursLogged?: number,
) {
  const patch: Record<string, unknown> = { status, decidedAt: nowIso() };
  if (decidedById) patch.decidedById = decidedById;
  if (hoursLogged !== undefined) patch.hoursLogged = hoursLogged;
  const { db } = getFirebase();
  await updateDoc(doc(db, "signups", id), patch);
}

export async function approveSignup(id: string, adminId: string) {
  const signup = read().signups.find((item) => item.id === id);
  if (!signup) throw new Error("Signup not found.");
  if (signup.status !== "REQUESTED") throw new Error("Signup already decided.");
  const slot = getSlot(signup.slotId);
  if (slot && decorate(slot).approvedCount >= slot.capacity) {
    throw new Error("SLOT_FULL");
  }
  await setSignupStatus(id, "APPROVED", adminId);
}

export const declineSignup = (id: string, adminId: string) =>
  setSignupStatus(id, "DECLINED", adminId);

export async function withdrawSignup(id: string) {
  const signup = read().signups.find((item) => item.id === id);
  if (!signup) throw new Error("Signup not found.");
  if (signup.status !== "REQUESTED" && signup.status !== "APPROVED") {
    throw new Error("This signup can no longer be withdrawn.");
  }
  await setSignupStatus(id, "WITHDRAWN");
}

export const markAttended = (id: string, adminId: string, hours: number) =>
  setSignupStatus(id, "ATTENDED", adminId, hours);

export const markNoShow = (id: string, adminId: string) =>
  setSignupStatus(id, "NO_SHOW", adminId);

export function listSignupsForSlot(slotId: string) {
  const db = read();
  return db.signups
    .filter((signup) => signup.slotId === slotId)
    .map((signup) => ({
      ...signup,
      participant: db.participants.find(
        (participant) => participant.id === signup.participantId,
      ),
    }));
}

export function listPendingSignups() {
  const db = read();
  return db.signups
    .filter((signup) => signup.status === "REQUESTED")
    .map((signup) => ({
      ...signup,
      participant: db.participants.find(
        (participant) => participant.id === signup.participantId,
      ),
      slot: db.slots.find((slot) => slot.id === signup.slotId),
    }))
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}

export function listMySignups(participantId: string) {
  const db = read();
  return db.signups
    .filter((signup) => signup.participantId === participantId)
    .map((signup) => {
      const slot = db.slots.find((item) => item.id === signup.slotId);
      return { ...signup, slot: slot ? decorate(slot, participantId) : undefined };
    })
    .sort((a, b) =>
      (a.slot?.startsAt ?? "").localeCompare(b.slot?.startsAt ?? ""),
    );
}

/* --- Projects ------------------------------------------------------------ */

export function listProjects(): Project[] {
  return read().projects;
}

export async function createProject(
  input: Omit<Project, "id" | "memberIds"> & { memberIds?: string[] },
) {
  const id = newId("prj");
  const project: Project = { ...input, id, memberIds: input.memberIds ?? [] };
  const { db } = getFirebase();
  await setDoc(doc(db, "projects", id), project);
  return project;
}

export function participantsById(ids: string[]) {
  const db = read();
  return ids
    .map((id) => db.participants.find((participant) => participant.id === id))
    .filter((participant): participant is Participant => Boolean(participant));
}

/* --- Stats --------------------------------------------------------------- */

export function getAdminStats(): DashboardStats {
  const db = read();
  const active = db.participants.filter((person) => person.status === "ACTIVE");
  const now = nowIso();
  return {
    totalParticipants: db.participants.length,
    activeParticipants: active.length,
    pendingRequests: db.accountRequests.filter((request) => request.status === "PENDING")
      .length,
    openSlots: db.slots.filter((slot) => slot.status === "OPEN" && slot.endsAt >= now)
      .length,
    totalHoursCommitted: Math.round(
      db.signups.reduce((sum, signup) => sum + (signup.hoursLogged ?? 0), 0),
    ),
    activeExpertiseAreas: new Set(
      active.flatMap((person) => person.expertise.map((area) => area.id)),
    ).size,
  };
}

export function getVolunteerStats(participantId: string): VolunteerStats {
  const db = read();
  const now = nowIso();
  const mine = db.signups.filter((signup) => signup.participantId === participantId);
  return {
    upcomingCommitments: mine.filter((signup) => {
      const slot = db.slots.find((item) => item.id === signup.slotId);
      return signup.status === "APPROVED" && slot && slot.endsAt >= now;
    }).length,
    pendingRequests: mine.filter((signup) => signup.status === "REQUESTED").length,
    hoursLogged: Math.round(
      mine.reduce((sum, signup) => sum + (signup.hoursLogged ?? 0), 0),
    ),
    openOpportunities: db.slots.filter(
      (slot) => slot.status === "OPEN" && slot.endsAt >= now,
    ).length,
  };
}

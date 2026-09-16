import type {
  DashboardStats,
  NewParticipantInput,
  Participant,
  ParticipantFilters,
  Project,
  Resource,
} from "../types";
import * as seed from "./mock";

/**
 * The single seam between the UI and the database.
 *
 * Today every function below reads from the in-memory seed data. When the
 * Cloud SQL instance is live and `firebase dataconnect:sdk:generate` has run,
 * swap each body for the generated hook — the signatures are deliberately
 * shaped to match the operations in dataconnect/connector/*.gql. No component
 * imports mock data directly, so nothing else has to change.
 *
 * e.g. listParticipants() -> useSearchParticipants({ ... })
 *      getStats()         -> useDashboardStats()
 *      createParticipant()-> useCreateParticipant()
 */

const LATENCY_MS = 180;
const delay = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

// Mutable working copy so the Add Participant wizard has somewhere to write.
let people: Participant[] = [...seed.participants];

/* --- Reads --------------------------------------------------------------- */

export function getCurrentUser(): Participant {
  return seed.currentUser;
}

export function listExpertiseAreas() {
  return delay(seed.expertiseAreas);
}

export function listLocations() {
  return delay(seed.LOCATIONS);
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

/**
 * Backs both the People Directory and the Search & Filter screen.
 *
 * In Postgres this is one query with a WHERE across a join (see
 * SearchParticipants in queries.gql). Here it is the equivalent in memory.
 */
export function listParticipants(filters: Partial<ParticipantFilters> = {}) {
  const {
    search = "",
    expertiseId = "ALL",
    availability = "ALL",
    location = "ALL",
    status = "ALL",
  } = filters;

  const q = search.trim().toLowerCase();
  const [minH, maxH] = AVAILABILITY_RANGES[availability];

  const rows = people.filter((p) => {
    if (status !== "ALL" && p.status !== status) return false;
    if (location !== "ALL" && p.location !== location) return false;
    if (expertiseId !== "ALL" && !p.expertise.some((e) => e.id === expertiseId))
      return false;

    const h = p.availabilityHoursPerWeek;
    if (h < minH || h > maxH) return false;

    if (q) {
      const haystack = [
        p.fullName,
        p.email,
        p.location ?? "",
        ...p.expertise.map((e) => e.name),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return delay(rows.sort((a, b) => a.fullName.localeCompare(b.fullName)));
}

export function listRecentParticipants(limit = 5) {
  const rows = [...people]
    .sort((a, b) => b.joinedOn.localeCompare(a.joinedOn))
    .slice(0, limit);
  return delay(rows);
}

export function getParticipant(id: string) {
  return delay(people.find((p) => p.id === id) ?? null);
}

/** All four dashboard figures are derived, never hardcoded. */
export function getStats(): Promise<DashboardStats> {
  const active = people.filter((p) => p.status === "ACTIVE");
  const activeExpertise = new Set(
    active.flatMap((p) => p.expertise.map((e) => e.id)),
  );
  const hours = seed.hoursLogs.reduce((sum, h) => sum + h.hours, 0);

  return delay({
    totalParticipants: people.length,
    activeThisMonth: active.length,
    totalHoursCommitted: Math.round(hours),
    activeExpertiseAreas: activeExpertise.size,
    // Month-over-month movement. Static until there is history to compare.
    deltas: {
      totalParticipants: 12,
      activeThisMonth: 8,
      totalHoursCommitted: 15,
      activeExpertiseAreas: 2,
    },
  });
}

export function listProjects(): Promise<Project[]> {
  return delay(seed.projects);
}

export function listResources(): Promise<Resource[]> {
  return delay(seed.resources);
}

export function participantsById(ids: string[]): Participant[] {
  return ids
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Participant => Boolean(p));
}

/* --- Writes -------------------------------------------------------------- */

export function createParticipant(input: NewParticipantInput) {
  const record: Participant = {
    id: `p-new-${Date.now()}`,
    authUid: null,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    location: input.location ?? null,
    avatarUrl: null,
    about: input.about ?? null,
    role: "PARTICIPANT",
    status: "PENDING",
    availabilityHoursPerWeek: input.availabilityHoursPerWeek,
    consentToContact: input.consentToContact,
    joinedOn: new Date().toISOString().slice(0, 10),
    expertise: seed.expertiseAreas.filter((e) =>
      input.expertiseIds.includes(e.id),
    ),
  };
  people = [record, ...people];
  return delay(record);
}

export function updateParticipant(id: string, patch: Partial<Participant>) {
  people = people.map((p) => (p.id === id ? { ...p, ...patch } : p));
  return delay(people.find((p) => p.id === id)!);
}

/** True if this email is already in the directory — the wizard checks it. */
export function emailTaken(email: string, exceptId?: string) {
  const e = email.trim().toLowerCase();
  return people.some((p) => p.email.toLowerCase() === e && p.id !== exceptId);
}

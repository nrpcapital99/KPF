/**
 * Domain types stored in Cloud Firestore. Related IDs and small display data
 * are intentionally embedded where that keeps reads simple for the UI.
 */

export type MemberRole = "VOLUNTEER" | "COORDINATOR" | "ADMIN";

export type ParticipantStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ProjectStatus = "PLANNING" | "ACTIVE" | "COMPLETED" | "ON_HOLD";

export type TagColor = "blue" | "mint" | "lavender" | "amber" | "pink";

export interface ExpertiseArea {
  id: string;
  name: string;
  colorToken: TagColor;
}

/* --- People -------------------------------------------------------------- */

export interface Participant {
  id: string;
  authUid?: string | null;
  fullName: string;
  email: string;
  phone: string;
  location?: string | null;
  avatarUrl?: string | null;
  about?: string | null;
  role: MemberRole;
  status: ParticipantStatus;
  availabilityHoursPerWeek: number;
  consentToContact: boolean;
  joinedOn: string; // ISO date
  expertise: ExpertiseArea[];
}

/* --- Account requests ---------------------------------------------------- */

export type AccountRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Someone who has asked to join but is not yet a participant. An admin
 * approves the request, which is what creates the Participant record and
 * lets them sign in.
 */
export interface AccountRequest {
  id: string;
  authUid: string;
  fullName: string;
  email: string;
  phone: string;
  location?: string | null;
  about?: string | null;
  expertiseIds: string[];
  availabilityHoursPerWeek: number;
  consentToContact: boolean;
  status: AccountRequestStatus;
  requestedAt: string; // ISO datetime
  decidedAt?: string | null;
  decidedById?: string | null;
  decisionNote?: string | null;
}

/* --- Volunteering slots -------------------------------------------------- */

export type SlotStatus = "OPEN" | "CLOSED" | "COMPLETED" | "CANCELLED";

/** A concrete volunteering opportunity an admin opens up. */
export interface Slot {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string; // ISO datetime
  endsAt: string; // ISO datetime
  capacity: number;
  status: SlotStatus;
  projectId?: string | null;
  requiredExpertiseIds: string[];
  createdById?: string | null;
  createdAt: string;
}

export type SignupStatus =
  | "REQUESTED"
  | "APPROVED"
  | "DECLINED"
  | "WITHDRAWN"
  | "ATTENDED"
  | "NO_SHOW";

/** A volunteer asking for a slot, and the admin's answer. */
export interface SlotSignup {
  id: string;
  slotId: string;
  participantId: string;
  status: SignupStatus;
  note?: string | null;
  requestedAt: string;
  decidedAt?: string | null;
  decidedById?: string | null;
  hoursLogged?: number | null;
}

/** A slot joined with its signups — what the opportunity lists render. */
export interface SlotWithCounts extends Slot {
  approvedCount: number;
  requestedCount: number;
  mySignup?: SlotSignup | null;
}

/* --- Projects ------------------------------------------------------------ */

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startsOn?: string | null;
  endsOn?: string | null;
  leadId?: string | null;
  memberIds: string[];
}

/* --- Dashboard ----------------------------------------------------------- */

export interface DashboardStats {
  totalParticipants: number;
  activeParticipants: number;
  pendingRequests: number;
  openSlots: number;
  totalHoursCommitted: number;
  activeExpertiseAreas: number;
}

export interface VolunteerStats {
  upcomingCommitments: number;
  pendingRequests: number;
  hoursLogged: number;
  openOpportunities: number;
}

/* --- Filters ------------------------------------------------------------- */

export interface ParticipantFilters {
  search: string;
  expertiseId: string | "ALL";
  availability: "ALL" | "0-5" | "5-10" | "10-20" | "20+";
  location: string | "ALL";
  status: ParticipantStatus | "ALL";
}

export const EMPTY_FILTERS: ParticipantFilters = {
  search: "",
  expertiseId: "ALL",
  availability: "ALL",
  location: "ALL",
  status: "ALL",
};

/* --- Inputs -------------------------------------------------------------- */

export interface AccountRequestInput {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  about?: string;
  expertiseIds: string[];
  availabilityHoursPerWeek: number;
  consentToContact: boolean;
}

/** The same profile fields are used when staff add a participant directly. */
export type NewParticipantInput = AccountRequestInput;

export interface SlotInput {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  requiredExpertiseIds: string[];
  projectId?: string | null;
}

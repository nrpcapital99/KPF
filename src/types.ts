/**
 * Domain types. These mirror the Data Connect schema in
 * dataconnect/schema/schema.gql — when you generate the real SDK, the
 * generated types should be assignable to these.
 */

export type MemberRole = "PARTICIPANT" | "COORDINATOR" | "ADMIN";

export type ParticipantStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "ARCHIVED";

export type ProjectStatus = "PLANNING" | "ACTIVE" | "COMPLETED" | "ON_HOLD";

export type TagColor = "blue" | "mint" | "lavender" | "amber" | "pink";

export interface ExpertiseArea {
  id: string;
  name: string;
  colorToken: TagColor;
}

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

export interface Resource {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  category?: string | null;
  uploadedById?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalParticipants: number;
  activeThisMonth: number;
  totalHoursCommitted: number;
  activeExpertiseAreas: number;
  deltas: {
    totalParticipants: number;
    activeThisMonth: number;
    totalHoursCommitted: number;
    activeExpertiseAreas: number;
  };
}

/** Everything the Search & Filter screen can narrow on. */
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

/** Payload assembled by the three-step Add Participant wizard. */
export interface NewParticipantInput {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  about?: string;
  expertiseIds: string[];
  availabilityHoursPerWeek: number;
  consentToContact: boolean;
}

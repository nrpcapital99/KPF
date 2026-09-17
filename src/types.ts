import type { STATUSES } from "./config";

export type VolunteerStatus = (typeof STATUSES)[number]["id"];

/** Exactly what the public form writes. firestore.rules validates this shape. */
export interface VolunteerInput {
  fullName: string;
  phone: string;
  email: string;
  city: string | null;
  interests: string[];
  commitment: string | null;
  preferredTimes: string[];
  message: string | null;
  consent: true;
}

/** A stored response, as the team page reads it back. */
export interface Volunteer extends VolunteerInput {
  id: string;
  status: VolunteerStatus;
  note: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

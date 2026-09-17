import type { STATUSES } from "./config";

export type VolunteerStatus = (typeof STATUSES)[number]["id"];

/** Exactly what the public form writes. firestore.rules validates this shape. */
export interface VolunteerInput {
  fullName: string;
  phone: string;
  email: string;
  city: string | null;
  /** Option ids from HELP_CATEGORIES. */
  helpWith: string[];
  digitalSpecifics: string | null;
  techSpecifics: string | null;
  otherContribution: string | null;
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
  /** Only on responses collected with the first version of the form. */
  legacyInterests: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

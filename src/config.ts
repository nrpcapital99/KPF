/**
 * Everything the foundation might want to edit lives here.
 *
 * ⚠ The option ids below are ALSO listed in firestore.rules. Firestore rejects
 *   any value that isn't on that list, which keeps junk out of the database.
 *   If you add, remove or rename an option here, make the same change in
 *   firestore.rules and redeploy the rules — otherwise submissions that use
 *   the new option will be refused.
 */

export const FOUNDATION = {
  name: "Kanak Parakh Foundation",
  tagline: "Together we create impact",
} as const;

export const INTERESTS = [
  { id: "education", label: "Education" },
  { id: "training", label: "Training" },
  { id: "outreach", label: "Community Outreach" },
  { id: "events", label: "Event Management" },
  { id: "fundraising", label: "Fundraising" },
  { id: "social_media", label: "Social Media" },
  { id: "content", label: "Content Creation" },
  { id: "digital_marketing", label: "Digital Marketing" },
  { id: "design", label: "Design" },
  { id: "branding", label: "Branding" },
  { id: "research", label: "Research" },
  { id: "strategy", label: "Strategy" },
] as const;

export const COMMITMENTS = [
  { id: "month", label: "A few hours a month" },
  { id: "w1_3", label: "1–3 hrs a week" },
  { id: "w4_8", label: "4–8 hrs a week" },
  { id: "w8_plus", label: "8+ hrs a week" },
] as const;

export const TIMES = [
  { id: "weekday_mornings", label: "Weekday mornings" },
  { id: "weekday_evenings", label: "Weekday evenings" },
  { id: "weekends", label: "Weekends" },
  { id: "flexible", label: "I'm flexible" },
] as const;

/** Suggestions only — people can type any city. */
export const CITY_SUGGESTIONS = [
  "Pune",
  "Mumbai",
  "Bengaluru",
  "Delhi",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
];

export const STATUSES = [
  { id: "NEW", label: "New", tone: "blue" },
  { id: "CONTACTED", label: "Contacted", tone: "amber" },
  { id: "JOINED", label: "Joined", tone: "green" },
  { id: "ARCHIVED", label: "Archived", tone: "slate" },
] as const;

/** Mirrored in firestore.rules. */
export const LIMITS = {
  name: 100,
  email: 254,
  phone: 20,
  city: 80,
  message: 1000,
  note: 500,
} as const;

const labelMap = (list: ReadonlyArray<{ id: string; label: string }>) =>
  Object.fromEntries(list.map((item) => [item.id, item.label])) as Record<
    string,
    string
  >;

export const INTEREST_LABEL = labelMap(INTERESTS);
export const COMMITMENT_LABEL = labelMap(COMMITMENTS);
export const TIME_LABEL = labelMap(TIMES);

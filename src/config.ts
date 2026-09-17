/**
 * Everything the foundation might want to edit lives here.
 *
 * ⚠ The option ids below are ALSO listed in two other places:
 *     • firestore.rules          — rejects any value not on its list
 *     • google-sheets/Code.gs    — turns ids into readable labels in the Sheet
 *   If you add, remove or rename an option, change all three, then redeploy
 *   the rules and paste the updated Code.gs into the Sheet's Apps Script.
 */

export const FOUNDATION = {
  name: "Kanak Parakh Foundation",
  tagline: "Together we create impact",
} as const;

export interface HelpOption {
  id: string;
  label: string;
}

export interface HelpCategory {
  id: string;
  label: string;
  options: HelpOption[];
  /** Optional "What can you specifically help with?" box inside the category. */
  specifics?: {
    field: "digitalSpecifics" | "techSpecifics";
    hint: string;
  };
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "education",
    label: "Teaching & Education",
    options: [
      { id: "edu_teaching", label: "Teaching students" },
      { id: "edu_tutoring", label: "Academic tutoring" },
      { id: "edu_career_guidance", label: "Career guidance" },
      { id: "edu_subject_expertise", label: "Subject expertise" },
      { id: "edu_other", label: "Other education support" },
    ],
  },
  {
    id: "training",
    label: "Training & Workshops",
    options: [
      { id: "trn_soft_skills", label: "Soft skills" },
      { id: "trn_communication", label: "Communication skills" },
      { id: "trn_financial_literacy", label: "Financial literacy" },
      { id: "trn_career_readiness", label: "Career readiness" },
      { id: "trn_professional", label: "Professional skills" },
      { id: "trn_other", label: "Other training / workshop support" },
    ],
  },
  {
    id: "digital",
    label: "Digital Marketing & Social Media",
    options: [
      { id: "dm_linkedin", label: "LinkedIn" },
      { id: "dm_instagram", label: "Instagram" },
      { id: "dm_facebook", label: "Facebook" },
      { id: "dm_strategy", label: "Social media strategy" },
      { id: "dm_paid_ads", label: "Paid advertising / LinkedIn Ads" },
      { id: "dm_content_strategy", label: "Content strategy" },
      { id: "dm_seo", label: "SEO" },
      { id: "dm_other", label: "Other digital marketing skills" },
    ],
    specifics: {
      field: "digitalSpecifics",
      hint: "Please specify any platforms, tools, or skills you can contribute.",
    },
  },
  {
    id: "technology",
    label: "Website & Technology",
    options: [
      { id: "web_development", label: "Website development" },
      { id: "web_maintenance", label: "Website maintenance" },
      { id: "web_uiux", label: "UI/UX" },
      { id: "web_seo", label: "SEO / technical SEO" },
      { id: "web_content", label: "Website content" },
      { id: "web_support", label: "Troubleshooting / technical support" },
      { id: "web_other", label: "Other technology support" },
    ],
    specifics: {
      field: "techSpecifics",
      hint: "Please specify your technical skills, tools, or areas of expertise.",
    },
  },
  {
    id: "video",
    label: "Video & Content Production",
    options: [
      { id: "vid_shooting", label: "Video shooting" },
      { id: "vid_editing", label: "Video editing" },
      { id: "vid_reels", label: "Reels / short-form video" },
      { id: "vid_animation", label: "Animation / motion graphics" },
      { id: "vid_photography", label: "Photography" },
      { id: "vid_other", label: "Other video / content production" },
    ],
  },
  {
    id: "design",
    label: "Design & Creative",
    options: [
      { id: "des_graphic", label: "Graphic design" },
      { id: "des_posters", label: "Posters & creatives" },
      { id: "des_presentations", label: "Presentations" },
      { id: "des_branding", label: "Branding" },
      { id: "des_illustration", label: "Illustration" },
      { id: "des_tools", label: "Canva / Adobe tools" },
      { id: "des_other", label: "Other creative support" },
    ],
  },
  {
    id: "fundraising",
    label: "Fundraising & Partnerships",
    options: [
      { id: "fr_fundraising", label: "Fundraising" },
      { id: "fr_donor_outreach", label: "Donor outreach" },
      { id: "fr_corporate", label: "Corporate partnerships" },
      { id: "fr_csr", label: "CSR partnerships" },
      { id: "fr_sponsorships", label: "Sponsorships" },
      { id: "fr_events", label: "Fundraising events" },
      { id: "fr_networking", label: "Networking / introductions" },
    ],
  },
];

/** Pseudo-category id used by the admin filter for the free-text field. */
export const OTHER_CONTRIBUTION_ID = "other";

export const COMMITMENTS = [
  { id: "w1_2", label: "1 to 2 hrs a week" },
  { id: "w3_4", label: "3 to 4 hrs a week" },
] as const;

/** Time options offered by earlier versions of the form, kept so old responses stay readable. */
export const LEGACY_COMMITMENT_LABEL: Record<string, string> = {
  month: "A few hours a month",
  w1_3: "1–3 hrs a week",
  w4_8: "4–8 hrs a week",
  w8_plus: "8+ hrs a week",
};

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
  specifics: 500,
  otherContribution: 1000,
  message: 1000,
  note: 500,
} as const;

/**
 * The first version of the form offered a short list of "interests". A few
 * responses were collected with it; these labels keep them readable.
 */
export const LEGACY_INTEREST_LABEL: Record<string, string> = {
  education: "Education",
  training: "Training",
  outreach: "Community Outreach",
  events: "Event Management",
  fundraising: "Fundraising",
  social_media: "Social Media",
  content: "Content Creation",
  digital_marketing: "Digital Marketing",
  design: "Design",
  branding: "Branding",
  research: "Research",
  strategy: "Strategy",
};

const labelMap = (list: ReadonlyArray<{ id: string; label: string }>) =>
  Object.fromEntries(list.map((item) => [item.id, item.label])) as Record<
    string,
    string
  >;

export const HELP_OPTION_LABEL = labelMap(HELP_CATEGORIES.flatMap((c) => c.options));
export const COMMITMENT_LABEL = { ...LEGACY_COMMITMENT_LABEL, ...labelMap(COMMITMENTS) };
export const TIME_LABEL = labelMap(TIMES);

/** Which category each option belongs to. */
export const HELP_OPTION_CATEGORY: Record<string, string> = Object.fromEntries(
  HELP_CATEGORIES.flatMap((c) => c.options.map((o) => [o.id, c.id])),
);

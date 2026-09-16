import type {
  ExpertiseArea,
  Participant,
  Project,
  Resource,
  TagColor,
} from "../types";

/**
 * Seed data for local development.
 *
 * The five people from the approved design appear first and verbatim, so the
 * dashboard renders exactly like the mockup. The rest of the community is
 * generated from a fixed seed, which keeps the data stable across reloads
 * while still being large enough that pagination and filtering behave
 * realistically.
 *
 * Every dashboard number is COMPUTED from these records rather than
 * hardcoded — see selectors in ./api.ts.
 */

/* --- deterministic PRNG so the seed never shifts between reloads --------- */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rand = makeRng(20250412);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

/* --- Expertise vocabulary ------------------------------------------------ */
const E = (id: string, name: string, colorToken: TagColor): ExpertiseArea => ({
  id,
  name,
  colorToken,
});

export const expertiseAreas: ExpertiseArea[] = [
  E("ex-social", "Social Media", "blue"),
  E("ex-content", "Content Creation", "lavender"),
  E("ex-design", "Design", "mint"),
  E("ex-branding", "Branding", "amber"),
  E("ex-education", "Education", "blue"),
  E("ex-training", "Training", "mint"),
  E("ex-strategy", "Strategy", "lavender"),
  E("ex-research", "Research", "amber"),
  E("ex-events", "Event Management", "pink"),
  E("ex-digital", "Digital Marketing", "blue"),
];

const byId = (id: string) => expertiseAreas.find((e) => e.id === id)!;

export const LOCATIONS = [
  "Pune, India",
  "Mumbai, India",
  "Bengaluru, India",
  "Delhi, India",
  "Ahmedabad, India",
  "Hyderabad, India",
];

/* --- The five people visible in the design ------------------------------- */
const featured: Participant[] = [
  {
    id: "p-priya",
    authUid: null,
    fullName: "Priya Sharma",
    email: "priya@domain.com",
    phone: "+91 98765 43210",
    location: "Pune, India",
    avatarUrl: null,
    about:
      "Passionate about creating meaningful content and building strong online communities. Experienced in social media strategy, content planning and audience engagement.",
    role: "PARTICIPANT",
    status: "ACTIVE",
    availabilityHoursPerWeek: 10,
    consentToContact: true,
    joinedOn: "2025-04-12",
    expertise: [byId("ex-social"), byId("ex-content"), byId("ex-digital")],
  },
  {
    id: "p-rahul",
    authUid: null,
    fullName: "Rahul Mehta",
    email: "rahul@domain.com",
    phone: "+91 87654 32109",
    location: "Mumbai, India",
    avatarUrl: null,
    about:
      "Visual designer focused on brand identity for mission-driven organisations. Believes good design makes good causes legible.",
    role: "PARTICIPANT",
    status: "ACTIVE",
    availabilityHoursPerWeek: 8,
    consentToContact: true,
    joinedOn: "2025-04-08",
    expertise: [byId("ex-design"), byId("ex-branding")],
  },
  {
    id: "p-ananya",
    authUid: null,
    fullName: "Ananya Iyer",
    email: "ananya@domain.com",
    phone: "+91 91234 56789",
    location: "Bengaluru, India",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces",
    about:
      "Educator and curriculum designer. Runs teacher-training workshops across three districts.",
    role: "COORDINATOR",
    status: "ACTIVE",
    availabilityHoursPerWeek: 12,
    consentToContact: true,
    joinedOn: "2025-03-28",
    expertise: [byId("ex-education"), byId("ex-training")],
  },
  {
    id: "p-vikram",
    authUid: null,
    fullName: "Vikram Desai",
    email: "vikram@domain.com",
    phone: "+91 99887 66554",
    location: "Delhi, India",
    avatarUrl: null,
    about:
      "Strategy consultant volunteering on impact measurement and programme evaluation.",
    role: "PARTICIPANT",
    status: "ACTIVE",
    availabilityHoursPerWeek: 5,
    consentToContact: false,
    joinedOn: "2025-03-19",
    expertise: [byId("ex-strategy"), byId("ex-research")],
  },
  {
    id: "p-sneha",
    authUid: null,
    fullName: "Sneha Kapoor",
    email: "sneha@domain.com",
    phone: "+91 90123 45678",
    location: "Pune, India",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces",
    about:
      "Organises the foundation's community drives and annual gathering. Ten years in event operations.",
    role: "PARTICIPANT",
    status: "ACTIVE",
    availabilityHoursPerWeek: 10,
    consentToContact: true,
    joinedOn: "2025-03-11",
    expertise: [byId("ex-events")],
  },
];

/** The signed-in user in the mockup. */
export const currentUser: Participant = {
  id: "p-diya",
  authUid: "mock-auth-diya",
  fullName: "Diya Patel",
  email: "diya@domain.com",
  phone: "+91 98765 43210",
  location: "Pune, India",
  avatarUrl: null,
  about:
    "Working towards creating meaningful impact through community, education and sustainable growth.",
  role: "ADMIN",
  status: "ACTIVE",
  availabilityHoursPerWeek: 10,
  consentToContact: true,
  joinedOn: "2024-11-02",
  expertise: [byId("ex-strategy"), byId("ex-research"), byId("ex-social")],
};

/* --- The rest of the community ------------------------------------------- */
const FIRST = [
  "Aarav", "Ishita", "Kabir", "Meera", "Rohan", "Tara", "Arjun", "Nisha",
  "Dev", "Kavya", "Siddharth", "Aditi", "Manav", "Riya", "Neel", "Sanya",
  "Yash", "Pooja", "Aryan", "Lakshmi", "Varun", "Anika", "Karan", "Divya",
  "Rishi", "Shreya", "Nikhil", "Juhi", "Omar", "Fatima", "Zara", "Imran",
  "Gaurav", "Sunita", "Harsh", "Leela", "Pranav", "Maya", "Sameer", "Rhea",
  "Advait", "Trisha",
];
const LAST = [
  "Nair", "Reddy", "Bose", "Chopra", "Joshi", "Menon", "Verma", "Shah",
  "Rao", "Banerjee", "Malhotra", "Pillai", "Gupta", "Deshmukh", "Khan",
  "Sinha", "Kulkarni", "Agarwal", "Bhatt", "Chatterjee",
];

const STATUS_POOL = [
  "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE",
  "INACTIVE", "PENDING",
] as const;

const HOURS_POOL = [3, 4, 5, 5, 6, 8, 8, 10, 10, 10, 12, 15, 20];

function generated(count: number): Participant[] {
  const out: Participant[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    let first = pick(FIRST);
    let last = pick(LAST);
    let name = `${first} ${last}`;
    let guard = 0;
    while (used.has(name) && guard++ < 50) {
      first = pick(FIRST);
      last = pick(LAST);
      name = `${first} ${last}`;
    }
    used.add(name);

    // one or two skills each
    const skills = [pick(expertiseAreas)];
    if (rand() > 0.4) {
      const second = pick(expertiseAreas);
      if (second.id !== skills[0].id) skills.push(second);
    }

    // joined between Jan 2024 and Mar 2025
    const daysAgo = Math.floor(rand() * 430) + 60;
    const d = new Date("2025-04-12T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - daysAgo);

    out.push({
      id: `p-gen-${i}`,
      authUid: null,
      fullName: name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@domain.com`,
      phone: `+91 ${Math.floor(70000 + rand() * 29999)} ${Math.floor(
        10000 + rand() * 89999,
      )}`,
      location: pick(LOCATIONS),
      avatarUrl: null,
      about: null,
      role: "PARTICIPANT",
      status: pick(STATUS_POOL),
      availabilityHoursPerWeek: pick(HOURS_POOL),
      consentToContact: rand() > 0.2,
      joinedOn: d.toISOString().slice(0, 10),
      expertise: skills,
    });
  }
  return out;
}

/** 48 people total, matching the "Total Participants" figure in the design. */
export const participants: Participant[] = [
  ...featured,
  currentUser,
  ...generated(42),
];

/* --- Hours logged -------------------------------------------------------- */
export interface HoursEntry {
  id: string;
  participantId: string;
  hours: number;
  workedOn: string;
}

export const hoursLogs: HoursEntry[] = participants
  .filter((p) => p.status === "ACTIVE")
  .flatMap((p, i) => {
    const entries = Math.floor(rand() * 3) + 1;
    return Array.from({ length: entries }, (_, j) => ({
      id: `h-${i}-${j}`,
      participantId: p.id,
      hours: Math.round((rand() * 12 + 2) * 2) / 2,
      workedOn: "2025-04-0" + ((j % 9) + 1),
    }));
  });

/* --- Projects ------------------------------------------------------------ */
export const projects: Project[] = [
  {
    id: "pr-1",
    name: "Digital Literacy Drive",
    description:
      "Weekend computer-literacy sessions for students across four partner schools in Pune.",
    status: "ACTIVE",
    startsOn: "2025-02-01",
    endsOn: "2025-08-30",
    leadId: "p-ananya",
    memberIds: ["p-ananya", "p-priya", "p-sneha", "p-gen-1", "p-gen-4"],
  },
  {
    id: "pr-2",
    name: "Brand Refresh",
    description:
      "New visual identity and communication templates for the foundation's outreach material.",
    status: "ACTIVE",
    startsOn: "2025-03-10",
    endsOn: null,
    leadId: "p-rahul",
    memberIds: ["p-rahul", "p-priya", "p-gen-7"],
  },
  {
    id: "pr-3",
    name: "Impact Measurement Framework",
    description:
      "Defining the metrics the foundation reports against, and the data collection behind them.",
    status: "PLANNING",
    startsOn: "2025-05-01",
    endsOn: null,
    leadId: "p-vikram",
    memberIds: ["p-vikram", "p-diya"],
  },
  {
    id: "pr-4",
    name: "Annual Community Gathering",
    description:
      "The foundation's yearly in-person gathering for participants, partners and families.",
    status: "COMPLETED",
    startsOn: "2024-11-15",
    endsOn: "2024-12-14",
    leadId: "p-sneha",
    memberIds: ["p-sneha", "p-diya", "p-gen-2", "p-gen-9", "p-gen-12"],
  },
];

/* --- Resources ----------------------------------------------------------- */
export const resources: Resource[] = [
  {
    id: "r-1",
    title: "Participant Handbook 2025",
    description:
      "What every new participant should read first — how we work, what to expect, who to ask.",
    url: "#",
    category: "Onboarding",
    uploadedById: "p-diya",
    createdAt: "2025-01-14",
  },
  {
    id: "r-2",
    title: "Brand Guidelines",
    description: "Logo usage, colour palette, typography and tone of voice.",
    url: "#",
    category: "Brand",
    uploadedById: "p-rahul",
    createdAt: "2025-03-22",
  },
  {
    id: "r-3",
    title: "Field Safety Protocol",
    description:
      "Required reading before any on-site activity. Covers consent, child protection and escalation.",
    url: "#",
    category: "Policy",
    uploadedById: "p-diya",
    createdAt: "2024-09-30",
  },
  {
    id: "r-4",
    title: "Workshop Facilitation Toolkit",
    description: "Session plans, printable worksheets and feedback forms.",
    url: "#",
    category: "Programmes",
    uploadedById: "p-ananya",
    createdAt: "2025-02-08",
  },
];

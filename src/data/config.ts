import type { ExpertiseArea, TagColor } from "../types";

/**
 * Foundation configuration — NOT sample data.
 *
 * These are the controlled vocabularies the app needs to function: the skill
 * list people pick from, and the cities the foundation operates in. Edit them
 * to match how Kanak Parakh Foundation actually works.
 *
 * There are no seeded people, slots or requests anywhere in this app. Every
 * record comes from real use.
 */

const E = (id: string, name: string, colorToken: TagColor): ExpertiseArea => ({
  id,
  name,
  colorToken,
});

export const EXPERTISE_AREAS: ExpertiseArea[] = [
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
  E("ex-fundraising", "Fundraising", "mint"),
  E("ex-outreach", "Community Outreach", "pink"),
];

export const LOCATIONS = [
  "Pune, India",
  "Mumbai, India",
  "Bengaluru, India",
  "Delhi, India",
  "Ahmedabad, India",
  "Hyderabad, India",
  "Remote",
];

export const HOURS_CHOICES = [2, 4, 5, 8, 10, 12, 15, 20, 25];

export const FOUNDATION = {
  name: "Kanak Parakh Foundation",
  shortName: "Kanak Parakh",
  tagline: "Together we create impact",
};

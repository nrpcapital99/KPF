import { LIMITS } from "../config";
import type { VolunteerInput } from "../types";

export interface FormValues {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  helpWith: string[];
  digitalSpecifics: string;
  techSpecifics: string;
  otherContribution: string;
  commitment: string;
  preferredTimes: string[];
  message: string;
  consent: boolean;
  /** Honeypot. Hidden from people; bots that fill every field fill this. */
  website: string;
}

export type FieldName =
  | "fullName"
  | "phone"
  | "email"
  | "city"
  | "helpWith"
  | "digitalSpecifics"
  | "techSpecifics"
  | "otherContribution"
  | "message"
  | "consent";

export type FieldErrors = Partial<Record<FieldName, string>>;

/** Order errors are surfaced in, and the order focus moves through them. */
export const FIELD_ORDER: FieldName[] = [
  "fullName",
  "phone",
  "email",
  "city",
  "helpWith",
  "digitalSpecifics",
  "techSpecifics",
  "otherContribution",
  "message",
  "consent",
];

export const EMPTY_VALUES: FormValues = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  helpWith: [],
  digitalSpecifics: "",
  techSpecifics: "",
  otherContribution: "",
  commitment: "",
  preferredTimes: [],
  message: "",
  consent: false,
  website: "",
};

// Kept in step with firestore.rules. The client is allowed to be stricter than
// the rules (it rejects more), never looser — otherwise people would pass the
// form and then be refused by the database with no useful explanation.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_CHARS_RE = /^[0-9+() -]+$/;

export function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.fullName.trim();
  const phone = values.phone.trim();
  const email = values.email.trim();
  const digits = phone.replace(/\D/g, "");

  if (!name) errors.fullName = "Please tell us your name.";
  else if (name.length > LIMITS.name) errors.fullName = "That name is a little too long.";

  if (!phone) {
    errors.phone = "Please add a phone number so we can reach you.";
  } else if (
    !PHONE_CHARS_RE.test(phone) ||
    digits.length < 8 ||
    digits.length > 15 ||
    phone.length > LIMITS.phone
  ) {
    errors.phone = "Please enter a valid phone number, e.g. +91 98765 43210.";
  }

  if (!email) errors.email = "Please add your email address.";
  else if (!EMAIL_RE.test(email) || email.length > LIMITS.email) {
    errors.email = "That email address doesn't look right.";
  }

  if (values.city.trim().length > LIMITS.city) {
    errors.city = "Please shorten the city name.";
  }

  if (values.helpWith.length === 0 && !values.otherContribution.trim()) {
    errors.helpWith =
      "Please choose at least one way you'd like to help, or write something under Other ways to contribute.";
  }

  if (values.digitalSpecifics.trim().length > LIMITS.specifics) {
    errors.digitalSpecifics = `Please keep this under ${LIMITS.specifics} characters.`;
  }
  if (values.techSpecifics.trim().length > LIMITS.specifics) {
    errors.techSpecifics = `Please keep this under ${LIMITS.specifics} characters.`;
  }
  if (values.otherContribution.trim().length > LIMITS.otherContribution) {
    errors.otherContribution = `Please keep this under ${LIMITS.otherContribution} characters.`;
  }

  if (values.message.trim().length > LIMITS.message) {
    errors.message = `Please keep this under ${LIMITS.message} characters.`;
  }

  if (!values.consent) {
    errors.consent = "Please tick this so our team can get in touch with you.";
  }

  return errors;
}

/** Shapes form state into exactly the document firestore.rules accepts. */
export function toInput(values: FormValues): VolunteerInput {
  return {
    fullName: values.fullName.trim().replace(/\s+/g, " "),
    phone: values.phone.trim().replace(/\s+/g, " "),
    email: values.email.trim().toLowerCase(),
    city: values.city.trim() || null,
    helpWith: values.helpWith,
    digitalSpecifics: values.digitalSpecifics.trim() || null,
    techSpecifics: values.techSpecifics.trim() || null,
    otherContribution: values.otherContribution.trim() || null,
    commitment: values.commitment || null,
    preferredTimes: values.preferredTimes,
    message: values.message.trim() || null,
    consent: true,
  };
}

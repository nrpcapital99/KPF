import { COMMITMENT_LABEL, INTEREST_LABEL, STATUSES, TIME_LABEL } from "../config";
import type { Volunteer } from "../types";

const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]));

/**
 * Wraps a value for CSV. Anything a person typed into the public form is
 * untrusted: a name like "=HYPERLINK(...)" would run as a formula when the file
 * is opened in Excel or Sheets. Prefixing a quote neutralises it (OWASP CSV
 * injection guidance).
 */
function cell(value: string, untrusted = true): string {
  let text = value ?? "";
  if (untrusted && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function downloadCsv(rows: Volunteer[]) {
  const header = [
    "Submitted",
    "Name",
    "Phone",
    "Email",
    "City",
    "How they'd like to help",
    "Time they can give",
    "When they're free",
    "About them",
    "Status",
    "Team note",
  ];

  const lines = [
    header.map((h) => cell(h, false)).join(","),
    ...rows.map((r) =>
      [
        cell(r.createdAt ? r.createdAt.toLocaleString("en-IN") : "", false),
        cell(r.fullName),
        // Phone is restricted to digits, spaces, + ( ) - by firestore.rules, so
        // it can't carry a formula; left unprefixed so it stays readable.
        cell(r.phone, false),
        cell(r.email),
        cell(r.city ?? ""),
        cell(r.interests.map((id) => INTEREST_LABEL[id] ?? id).join("; "), false),
        cell(r.commitment ? (COMMITMENT_LABEL[r.commitment] ?? r.commitment) : "", false),
        cell(r.preferredTimes.map((id) => TIME_LABEL[id] ?? id).join("; "), false),
        cell(r.message ?? ""),
        cell(STATUS_LABEL[r.status] ?? r.status, false),
        cell(r.note ?? ""),
      ].join(","),
    ),
  ];

  // Byte-order mark so Excel opens Hindi / Marathi names correctly.
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kpf-volunteers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

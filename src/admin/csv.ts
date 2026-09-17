import { COMMITMENT_LABEL, HELP_CATEGORIES, STATUSES, TIME_LABEL } from "../config";
import type { Volunteer } from "../types";
import { legacyLabels } from "./helpSummary";

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

/** Same columns, in the same order, as the Google Sheet (google-sheets/Code.gs). */
export function downloadCsv(rows: Volunteer[]) {
  const header = [
    "Submitted",
    "Status",
    "Name",
    "Phone",
    "Email",
    "City",
    ...HELP_CATEGORIES.flatMap((c) =>
      c.specifics ? [c.label, `${c.label} — specifics`] : [c.label],
    ),
    "Other ways to contribute",
    "Time they can give",
    "When they're free",
    "Anything more",
    "Team note",
  ];

  const lines = [
    header.map((h) => cell(h, false)).join(","),
    ...rows.map((r) => {
      const legacy = legacyLabels(r);
      const other = [
        r.otherContribution ?? "",
        legacy.length ? `Earlier form: ${legacy.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      return [
        cell(r.createdAt ? r.createdAt.toLocaleString("en-IN") : "", false),
        cell(STATUS_LABEL[r.status] ?? r.status, false),
        cell(r.fullName),
        // Phone is restricted to digits, spaces, + ( ) - by firestore.rules, so
        // it can't carry a formula; left unprefixed so it stays readable.
        cell(r.phone, false),
        cell(r.email),
        cell(r.city ?? ""),
        ...HELP_CATEGORIES.flatMap((c) => {
          const chosen = c.options
            .filter((o) => r.helpWith.includes(o.id))
            .map((o) => o.label)
            .join("; ");
          return c.specifics
            ? [cell(chosen, false), cell(r[c.specifics.field] ?? "")]
            : [cell(chosen, false)];
        }),
        cell(other),
        cell(r.commitment ? (COMMITMENT_LABEL[r.commitment] ?? r.commitment) : "", false),
        cell(r.preferredTimes.map((id) => TIME_LABEL[id] ?? id).join("; "), false),
        cell(r.message ?? ""),
        cell(r.note ?? ""),
      ].join(",");
    }),
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

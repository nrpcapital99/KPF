import { useState } from "react";
import {
  CalendarIcon,
  ChatIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  NoteIcon,
  PhoneIcon,
  TrashIcon,
} from "../components/icons";
import { COMMITMENT_LABEL, LIMITS, STATUSES, TIME_LABEL } from "../config";
import type { Volunteer, VolunteerStatus } from "../types";
import { deleteResponse, setNote, setStatus } from "./data";
import { legacyLabels, summariseHelp } from "./helpSummary";

type Toast = { kind: "ok" | "error"; text: string };

const LONG_MESSAGE = 220;

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function timeAgo(date: Date | null) {
  if (!date) return "Just now";
  const diff = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "Just now";
}

/**
 * wa.me needs the number with country code and no symbols. Ten-digit numbers
 * are assumed to be Indian mobiles, which is who fills this form in.
 */
function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const full = digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, "");
  return `https://wa.me/${full}`;
}

export default function ResponseCard({
  row,
  onToast,
}: {
  row: Volunteer;
  onToast: (toast: Toast) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(row.note ?? "");
  const [savingNote, setSavingNote] = useState(false);

  // Start from the latest saved note, which may have been changed by a teammate.
  function startEditingNote() {
    setNoteDraft(row.note ?? "");
    setEditingNote(true);
  }

  const tone = STATUSES.find((s) => s.id === row.status)?.tone ?? "slate";
  const helpGroups = summariseHelp(row);
  const legacy = legacyLabels(row);
  const long = (row.message?.length ?? 0) > LONG_MESSAGE;

  async function changeStatus(next: VolunteerStatus) {
    try {
      await setStatus(row.id, next);
    } catch {
      onToast({ kind: "error", text: "Couldn't update the status. Please try again." });
    }
  }

  async function saveNote() {
    if (noteDraft.trim() === (row.note ?? "")) {
      setEditingNote(false);
      return;
    }
    setSavingNote(true);
    try {
      await setNote(row.id, noteDraft);
      setEditingNote(false);
      onToast({ kind: "ok", text: "Note saved." });
    } catch {
      onToast({ kind: "error", text: "Couldn't save the note. Please try again." });
    } finally {
      setSavingNote(false);
    }
  }

  async function remove() {
    const ok = window.confirm(
      `Delete ${row.fullName || "this"} response permanently? This can't be undone.`,
    );
    if (!ok) return;
    try {
      await deleteResponse(row.id);
      onToast({ kind: "ok", text: "Response deleted." });
    } catch {
      onToast({ kind: "error", text: "Couldn't delete the response. Please try again." });
    }
  }

  return (
    <article className={`rc${row.status === "NEW" ? " rc--new" : ""}`}>
      <header className="rc__head">
        <span className="rc__avatar" aria-hidden>
          {initials(row.fullName)}
        </span>
        <div className="rc__who">
          <h2 className="rc__name">{row.fullName}</h2>
          <p className="rc__when" title={row.createdAt?.toLocaleString("en-IN")}>
            {timeAgo(row.createdAt)}
          </p>
        </div>
        <label className="rc__status">
          <span className="sr-only">Status for {row.fullName}</span>
          <select
            className={`rc__status-select tone-${tone}`}
            value={row.status}
            onChange={(e) => void changeStatus(e.target.value as VolunteerStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="rc__actions">
        <a className="rc__action" href={`tel:${row.phone.replace(/[^\d+]/g, "")}`}>
          <PhoneIcon />
          Call
        </a>
        <a
          className="rc__action rc__action--wa"
          href={whatsappLink(row.phone)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ChatIcon />
          WhatsApp
        </a>
        <a className="rc__action" href={`mailto:${row.email}`}>
          <MailIcon />
          Email
        </a>
      </div>

      <dl className="rc__details">
        <div className="rc__detail">
          <dt>
            <PhoneIcon />
            <span className="sr-only">Phone</span>
          </dt>
          <dd>{row.phone}</dd>
        </div>
        <div className="rc__detail">
          <dt>
            <MailIcon />
            <span className="sr-only">Email</span>
          </dt>
          <dd>{row.email}</dd>
        </div>
        {row.city && (
          <div className="rc__detail">
            <dt>
              <MapPinIcon />
              <span className="sr-only">City</span>
            </dt>
            <dd>{row.city}</dd>
          </div>
        )}
        {row.commitment && (
          <div className="rc__detail">
            <dt>
              <ClockIcon />
              <span className="sr-only">Time they can give</span>
            </dt>
            <dd>{COMMITMENT_LABEL[row.commitment] ?? row.commitment}</dd>
          </div>
        )}
        {row.preferredTimes.length > 0 && (
          <div className="rc__detail">
            <dt>
              <CalendarIcon />
              <span className="sr-only">When they're free</span>
            </dt>
            <dd>{row.preferredTimes.map((id) => TIME_LABEL[id] ?? id).join(", ")}</dd>
          </div>
        )}
      </dl>

      {(helpGroups.length > 0 || row.otherContribution || legacy.length > 0) && (
        <section className="rc__help" aria-label="How they'd like to help">
          {helpGroups.map((group) => (
            <div key={group.categoryId} className="rc__help-group">
              <p className="rc__help-label">{group.label}</p>
              {group.options.length > 0 && (
                <ul className="rc__tags">
                  {group.options.map((label) => (
                    <li key={label} className="rc__tag">
                      {label}
                    </li>
                  ))}
                </ul>
              )}
              {group.specifics && <p className="rc__specifics">{group.specifics}</p>}
            </div>
          ))}
          {row.otherContribution && (
            <div className="rc__help-group">
              <p className="rc__help-label">Other ways to contribute</p>
              <p className="rc__specifics">{row.otherContribution}</p>
            </div>
          )}
          {legacy.length > 0 && (
            <div className="rc__help-group">
              <p className="rc__help-label">Interests (earlier form)</p>
              <ul className="rc__tags">
                {legacy.map((label) => (
                  <li key={label} className="rc__tag rc__tag--legacy">
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {row.message && (
        <div className="rc__message">
          <p className={long && !expanded ? "rc__message-text--clamped" : undefined}>
            {row.message}
          </p>
          {long && (
            <button
              type="button"
              className="rc__more"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {editingNote ? (
        <div className="rc__note-edit">
          <label className="sr-only" htmlFor={`note-${row.id}`}>
            Team note for {row.fullName}
          </label>
          <textarea
            id={`note-${row.id}`}
            className="textarea"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            maxLength={LIMITS.note}
            rows={3}
            placeholder="e.g. Called on Monday, keen on weekend teaching"
            autoFocus
          />
          <div className="rc__note-actions">
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => {
                setNoteDraft(row.note ?? "");
                setEditingNote(false);
              }}
              disabled={savingNote}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void saveNote()}
              disabled={savingNote}
              aria-busy={savingNote}
            >
              {savingNote ? "Saving…" : "Save note"}
            </button>
          </div>
        </div>
      ) : row.note ? (
        <button type="button" className="rc__note" onClick={startEditingNote}>
          <NoteIcon />
          <span>{row.note}</span>
        </button>
      ) : null}

      <footer className="rc__foot">
        {!editingNote && !row.note && (
          <button type="button" className="btn btn--quiet" onClick={startEditingNote}>
            <NoteIcon /> Add note
          </button>
        )}
        <button
          type="button"
          className="btn btn--danger rc__delete"
          onClick={() => void remove()}
          aria-label={`Delete ${row.fullName}'s response`}
        >
          <TrashIcon />
          <span className="ad__hide-sm">Delete</span>
        </button>
      </footer>
    </article>
  );
}

import type { ReactNode, SelectHTMLAttributes } from "react";
import type {
  ExpertiseArea,
  Participant,
  ParticipantStatus,
  SignupStatus,
  SlotStatus,
} from "../types";
import { ChevronDown } from "./icons";

/* --- Avatar -------------------------------------------------------------- */

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  person,
  size = "md",
}: {
  person: Pick<Participant, "fullName" | "avatarUrl">;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <span className={`avatar avatar--${size}`} aria-hidden>
      {person.avatarUrl ? (
        <img src={person.avatarUrl} alt="" loading="lazy" />
      ) : (
        initials(person.fullName)
      )}
    </span>
  );
}

/* --- Status pill --------------------------------------------------------- */

const STATUS_LABEL: Record<ParticipantStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

export function StatusPill({ status }: { status: ParticipantStatus }) {
  return (
    <span className={`pill pill--${status.toLowerCase()}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Generic pill for slot / signup / request states. */
export type PillTone = "active" | "pending" | "inactive" | "archived";

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={`pill pill--${tone}`}>{children}</span>;
}

const SIGNUP_PILL: Record<SignupStatus, { tone: PillTone; label: string }> = {
  REQUESTED: { tone: "pending", label: "Requested" },
  APPROVED: { tone: "active", label: "Confirmed" },
  DECLINED: { tone: "archived", label: "Declined" },
  WITHDRAWN: { tone: "inactive", label: "Withdrawn" },
  ATTENDED: { tone: "active", label: "Attended" },
  NO_SHOW: { tone: "archived", label: "No show" },
};

export function SignupPill({ status }: { status: SignupStatus }) {
  const { tone, label } = SIGNUP_PILL[status];
  return <Pill tone={tone}>{label}</Pill>;
}

const SLOT_PILL: Record<SlotStatus, { tone: PillTone; label: string }> = {
  OPEN: { tone: "active", label: "Open" },
  CLOSED: { tone: "inactive", label: "Closed" },
  COMPLETED: { tone: "inactive", label: "Completed" },
  CANCELLED: { tone: "archived", label: "Cancelled" },
};

export function SlotPill({ status }: { status: SlotStatus }) {
  const { tone, label } = SLOT_PILL[status];
  return <Pill tone={tone}>{label}</Pill>;
}

/** How full a slot is, as text plus a bar. */
export function Capacity({
  filled,
  capacity,
}: {
  filled: number;
  capacity: number;
}) {
  const pct = capacity > 0 ? Math.min(100, (filled / capacity) * 100) : 0;
  const full = filled >= capacity;
  return (
    <div className="capacity">
      <span>
        <strong>
          {filled} / {capacity}
        </strong>{" "}
        {capacity === 1 ? "volunteer" : "volunteers"}
      </span>
      <div className="capacity__bar">
        <div
          className={`capacity__fill${full ? " capacity__fill--full" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* --- Expertise tag ------------------------------------------------------- */

export function Tag({ area }: { area: ExpertiseArea }) {
  return <span className={`tag tag--${area.colorToken}`}>{area.name}</span>;
}

export function TagList({
  areas,
  max,
}: {
  areas: ExpertiseArea[];
  max?: number;
}) {
  const shown = max ? areas.slice(0, max) : areas;
  const extra = max ? areas.length - shown.length : 0;
  return (
    <span className="tags">
      {shown.map((a) => (
        <Tag key={a.id} area={a} />
      ))}
      {extra > 0 && <span className="tag tag--blue">+{extra}</span>}
    </span>
  );
}

/* --- Form primitives ----------------------------------------------------- */

export function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
  full,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`field${full ? " form-grid--full" : ""}`}>
      <label className="field__label" htmlFor={htmlFor}>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {error ? (
        <span className="field__error">{error}</span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function Select({
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="select-wrap">
      <select className="select" {...rest}>
        {children}
      </select>
      <ChevronDown className="select-wrap__caret" />
    </span>
  );
}

/* --- Stepper ------------------------------------------------------------- */

export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="stepper" role="list">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <div key={label} className="step" role="listitem" style={{ flex: i === steps.length - 1 ? "0 0 auto" : "1" }}>
            <span className={`step step--${state}`}>
              <span className="step__dot">{i + 1}</span>
              <span className="step__label">{label}</span>
            </span>
            {i < steps.length - 1 && <span className="step__line" />}
          </div>
        );
      })}
    </div>
  );
}

/* --- Empty / loading ----------------------------------------------------- */

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      <p>{message}</p>
      {action && <div style={{ marginTop: "var(--sp-5)" }}>{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ padding: "var(--sp-4) var(--sp-6)" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 44, marginBottom: 10 }}
        />
      ))}
    </div>
  );
}

/* --- Formatting ---------------------------------------------------------- */

export function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "12 Apr 2025, 9:00 AM - 1:00 PM" — collapses the date when it's the same day. */
export function formatSlotWhen(startsAt: string, endsAt: string) {
  const a = new Date(startsAt);
  const b = new Date(endsAt);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return `${startsAt} - ${endsAt}`;
  }
  const date = a.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const t = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  return a.toDateString() === b.toDateString()
    ? `${date}, ${t(a)} - ${t(b)}`
    : `${formatDateTime(startsAt)} - ${formatDateTime(endsAt)}`;
}

/** "in 3 days" / "2 hours ago" — for request queues. */
export function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = then - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000000],
    ["month", 2592000000],
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

/** Local datetime string suitable for <input type="datetime-local"> defaults. */
export function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

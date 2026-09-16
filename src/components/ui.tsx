import type { ReactNode, SelectHTMLAttributes } from "react";
import type { ExpertiseArea, Participant, ParticipantStatus } from "../types";
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
  PENDING: "Pending",
  ARCHIVED: "Archived",
};

export function StatusPill({ status }: { status: ParticipantStatus }) {
  return (
    <span className={`pill pill--${status.toLowerCase()}`}>
      {STATUS_LABEL[status]}
    </span>
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

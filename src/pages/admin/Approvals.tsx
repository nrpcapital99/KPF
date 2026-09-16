import { useState } from "react";
import { TopBar } from "../../components/Layout";
import { Notice } from "../../components/AuthShell";
import {
  Avatar,
  EmptyState,
  Pill,
  TagList,
  formatDateTime,
  relativeTime,
} from "../../components/ui";
import { ClockIcon, MailIcon, MapPin, PhoneIcon } from "../../components/icons";
import {
  approveAccountRequest,
  expertiseByIds,
  listAccountRequests,
  rejectAccountRequest,
} from "../../data/api";
import { useCurrentUser, useStore } from "../../auth/session";
import type { AccountRequestStatus } from "../../types";

const TABS: { value: AccountRequestStatus; label: string }[] = [
  { value: "PENDING", label: "Awaiting review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Declined" },
];

/**
 * The gate into the foundation. Approving a request is what creates the
 * participant record and unlocks their signed-in account.
 */
export default function Approvals() {
  useStore();
  const me = useCurrentUser();
  const [tab, setTab] = useState<AccountRequestStatus>("PENDING");
  const [flash, setFlash] = useState<string | null>(null);

  const rows = listAccountRequests(tab);
  const pendingCount = listAccountRequests("PENDING").length;

  async function approve(id: string, name: string) {
    try {
      await approveAccountRequest(id, me.id);
      setFlash(`${name} can now sign in and request volunteering slots.`);
    } catch (error) {
      setFlash((error as Error).message);
    }
  }

  async function decline(id: string, name: string) {
    try {
      await rejectAccountRequest(id, me.id);
      setFlash(`${name}'s request was declined.`);
    } catch (error) {
      setFlash((error as Error).message);
    }
  }

  return (
    <>
      <TopBar
        title="Account Requests"
        subtitle="People asking to volunteer with the foundation."
      />

      <div className="content">
        {flash && (
          <div style={{ marginBottom: "var(--sp-5)" }}>
            <Notice kind="ok">{flash}</Notice>
          </div>
        )}

        <section className="card panel">
          <div className="panel__head">
            <h2 className="panel__title">
              {pendingCount > 0
                ? `${pendingCount} awaiting review`
                : "Nothing awaiting review"}
            </h2>
            <div className="panel__actions">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  className={`btn ${tab === t.value ? "btn--primary" : "btn--ghost"}`}
                  onClick={() => setTab(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title={
                tab === "PENDING"
                  ? "No requests waiting"
                  : tab === "APPROVED"
                    ? "Nobody approved yet"
                    : "Nothing declined"
              }
              message={
                tab === "PENDING"
                  ? "When someone asks to volunteer, their request lands here for you to review."
                  : "Requests you've decided on will appear here."
              }
            />
          ) : (
            rows.map((r) => (
              <article key={r.id} className="review">
                <Avatar person={{ fullName: r.fullName, avatarUrl: null }} size="lg" />

                <div className="review__main">
                  <div className="detail__name">
                    <h3 style={{ fontSize: "var(--text-lg)" }}>{r.fullName}</h3>
                    {r.status === "PENDING" ? (
                      <Pill tone="pending">
                        Requested {relativeTime(r.requestedAt)}
                      </Pill>
                    ) : r.status === "APPROVED" ? (
                      <Pill tone="active">Approved</Pill>
                    ) : (
                      <Pill tone="archived">Declined</Pill>
                    )}
                  </div>

                  <div className="detail__rows" style={{ marginTop: "var(--sp-3)" }}>
                    <p className="detail__row" style={{ fontSize: "var(--text-sm)" }}>
                      <MailIcon />
                      <span>{r.email}</span>
                    </p>
                    <p className="detail__row" style={{ fontSize: "var(--text-sm)" }}>
                      <PhoneIcon />
                      <span>{r.phone}</span>
                    </p>
                    {r.location && (
                      <p className="detail__row" style={{ fontSize: "var(--text-sm)" }}>
                        <MapPin />
                        <span>{r.location}</span>
                      </p>
                    )}
                    <p className="detail__row" style={{ fontSize: "var(--text-sm)" }}>
                      <ClockIcon />
                      <span>
                        {r.availabilityHoursPerWeek} hrs / week (about{" "}
                        {r.availabilityHoursPerWeek * 4} hrs / month)
                      </span>
                    </p>
                  </div>

                  {r.expertiseIds.length > 0 && (
                    <div style={{ marginTop: "var(--sp-3)" }}>
                      <TagList areas={expertiseByIds(r.expertiseIds)} />
                    </div>
                  )}

                  {r.about && (
                    <p
                      className="detail__about"
                      style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-sm)" }}
                    >
                      {r.about}
                    </p>
                  )}

                  {r.decidedAt && (
                    <p
                      style={{
                        marginTop: "var(--sp-3)",
                        fontSize: "var(--text-xs)",
                        color: "var(--ink-3)",
                      }}
                    >
                      Decided {formatDateTime(r.decidedAt)}
                    </p>
                  )}
                </div>

                {r.status === "PENDING" && (
                  <div className="review__actions">
                    <button
                      className="btn btn--primary"
                      onClick={() => void approve(r.id, r.fullName)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn--ghost"
                      onClick={() => void decline(r.id, r.fullName)}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </>
  );
}

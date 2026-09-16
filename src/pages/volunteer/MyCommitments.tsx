import { Link } from "react-router-dom";
import { TopBar } from "../../components/Layout";
import {
  Capacity,
  EmptyState,
  SignupPill,
  formatSlotWhen,
  relativeTime,
} from "../../components/ui";
import { CalendarIcon, MapPin } from "../../components/icons";
import { listMySignups, withdrawSignup } from "../../data/api";
import { useCurrentUser, useStore } from "../../auth/session";

/** Everything this volunteer has asked for, split into upcoming and past. */
export default function MyCommitments() {
  useStore();
  const me = useCurrentUser();
  const signups = listMySignups(me.id);

  const now = new Date().toISOString();
  const upcoming = signups.filter(
    (s) =>
      s.slot &&
      s.slot.endsAt >= now &&
      (s.status === "REQUESTED" || s.status === "APPROVED"),
  );
  const past = signups.filter((s) => !upcoming.includes(s));

  return (
    <>
      <TopBar
        title="My Commitments"
        subtitle="The slots you've asked for and the ones you've done."
      />

      <div className="content">
        <section className="card panel" style={{ marginBottom: "var(--sp-5)" }}>
          <div className="panel__head">
            <h2 className="panel__title">
              {upcoming.length === 0
                ? "Nothing coming up"
                : `${upcoming.length} upcoming`}
            </h2>
            <Link to="/opportunities" className="btn btn--primary">
              Find a slot
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming commitments"
              message="Browse the open volunteering slots and put your hand up for one."
              action={
                <Link to="/opportunities" className="btn btn--primary">
                  Browse opportunities
                </Link>
              }
            />
          ) : (
            upcoming.map((s) => (
              <article key={s.id} className="slot">
                <div className="slot__main">
                  <div className="slot__head">
                    <h3 className="slot__title">{s.slot?.title}</h3>
                    <SignupPill status={s.status} />
                  </div>

                  {s.slot?.description && <p className="slot__desc">{s.slot.description}</p>}

                  <div className="slot__meta">
                    {s.slot && (
                      <p className="detail__row">
                        <CalendarIcon />
                        <span>{formatSlotWhen(s.slot.startsAt, s.slot.endsAt)}</span>
                      </p>
                    )}
                    {s.slot?.location && (
                      <p className="detail__row">
                        <MapPin />
                        <span>{s.slot.location}</span>
                      </p>
                    )}
                  </div>

                  {s.status === "REQUESTED" && (
                    <p
                      style={{
                        marginTop: "var(--sp-3)",
                        fontSize: "var(--text-sm)",
                        color: "var(--ink-2)",
                      }}
                    >
                      Requested {relativeTime(s.requestedAt)} — waiting for a
                      coordinator to confirm.
                    </p>
                  )}
                </div>

                <div className="slot__side">
                  {s.slot && (
                    <Capacity
                      filled={s.slot.approvedCount}
                      capacity={s.slot.capacity}
                    />
                  )}
                  <button
                    className="btn btn--ghost"
                    onClick={() => void withdrawSignup(s.id)}
                  >
                    Withdraw
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        {past.length > 0 && (
          <section className="card panel">
            <div className="panel__head">
              <h2 className="panel__title">History</h2>
            </div>
            {past.map((s) => (
              <article key={s.id} className="slot">
                <div className="slot__main">
                  <div className="slot__head">
                    <h3 className="slot__title">{s.slot?.title ?? "Removed slot"}</h3>
                    <SignupPill status={s.status} />
                  </div>
                  <div className="slot__meta">
                    {s.slot && (
                      <p className="detail__row">
                        <CalendarIcon />
                        <span>{formatSlotWhen(s.slot.startsAt, s.slot.endsAt)}</span>
                      </p>
                    )}
                  </div>
                  {s.hoursLogged ? (
                    <p
                      style={{
                        marginTop: "var(--sp-2)",
                        fontSize: "var(--text-sm)",
                        color: "var(--green)",
                        fontWeight: 600,
                      }}
                    >
                      {s.hoursLogged} hrs logged
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </>
  );
}

import { Link, useParams } from "react-router-dom";
import { useCurrentUser, useStore } from "../auth/session";
import { TopBar } from "../components/Layout";
import {
  Avatar,
  EmptyState,
  StatusPill,
  TagList,
  formatDate,
} from "../components/ui";
import {
  ArrowLeft,
  CalendarIcon,
  ClockIcon,
  MailIcon,
  MapPin,
  PhoneIcon,
} from "../components/icons";
import { getParticipant, setParticipantStatus } from "../data/api";

export default function ParticipantDetail() {
  useStore();
  const me = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  const person = id ? getParticipant(id) : null;

  if (person === null) {
    return (
      <>
        <TopBar title="Not found" />
        <div className="content">
          <div className="card">
            <EmptyState
              title="We couldn't find that person"
              message="They may have been removed from the directory."
              action={
                <Link to="/people" className="btn btn--primary">
                  Back to directory
                </Link>
              }
            />
          </div>
        </div>
      </>
    );
  }

  const monthly = person.availabilityHoursPerWeek * 4;
  // Top two skills read as a role ("Social Media & Content Creation");
  // chaining every skill with "&" gets unwieldy past two.
  const primaryRole = person.expertise
    .slice(0, 2)
    .map((e) => e.name)
    .join(" & ");

  return (
    <>
      <TopBar title={person.fullName} subtitle={primaryRole || undefined} />

      <div className="content">
        <Link to="/people" className="backlink">
          <ArrowLeft /> Back to List
        </Link>

        <article className="card">
          <header className="detail__head">
            <Avatar person={person} size="lg" />
            <div className="detail__ident">
              <div className="detail__name">
                <h2>{person.fullName}</h2>
                <StatusPill status={person.status} />
              </div>
              {primaryRole && <p className="detail__role">{primaryRole}</p>}
            </div>
            <div className="panel__actions">
              <a href={`mailto:${person.email}`} className="btn btn--primary">
                <MailIcon /> Contact
              </a>
              {me.role === "ADMIN" && me.id !== person.id && (
                <button
                  className="btn btn--ghost"
                  onClick={() =>
                    void setParticipantStatus(
                      person.id,
                      person.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                    )
                  }
                >
                  {person.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                </button>
              )}
            </div>
          </header>

          <div className="detail__body">
            <section className="detail__rows">
              <p className="detail__row">
                <MailIcon />
                <a href={`mailto:${person.email}`}>{person.email}</a>
              </p>
              <p className="detail__row">
                <PhoneIcon />
                <a href={`tel:${person.phone.replace(/\s/g, "")}`}>
                  {person.phone}
                </a>
              </p>
              {person.location && (
                <p className="detail__row">
                  <MapPin />
                  <span>{person.location}</span>
                </p>
              )}
            </section>

            <section>
              <h3 className="detail__section-label">Expertise</h3>
              {person.expertise.length ? (
                <TagList areas={person.expertise} />
              ) : (
                <p style={{ color: "var(--ink-3)" }}>No expertise recorded.</p>
              )}
            </section>

            <section>
              <h3 className="detail__section-label">Availability</h3>
              <p className="detail__row">
                <ClockIcon />
                <span>
                  {person.availabilityHoursPerWeek} hrs / week
                  <br />
                  <span style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>
                    (or {monthly} hrs / month)
                  </span>
                </span>
              </p>
            </section>

            {person.about && (
              <section>
                <h3 className="detail__section-label">About</h3>
                <p className="detail__about">{person.about}</p>
              </section>
            )}

            <section>
              <h3 className="detail__section-label">Joined On</h3>
              <p className="detail__row">
                <CalendarIcon />
                <span>{formatDate(person.joinedOn)}</span>
              </p>
            </section>
          </div>
        </article>
      </div>
    </>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { isStaff, useCurrentUser, useStore } from "../auth/session";
import { TopBar } from "../components/Layout";
import PeopleTable from "../components/PeopleTable";
import { EmptyState } from "../components/ui";
import {
  ArrowRight,
  CalendarIcon,
  ClockIcon,
  FilterIcon,
  HandIcon,
  InboxIcon,
  PlusIcon,
  UsersIcon,
} from "../components/icons";
import {
  getAdminStats,
  getVolunteerStats,
  listRecentParticipants,
} from "../data/api";

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  useStore();
  const me = useCurrentUser();
  const navigate = useNavigate();
  const staff = isStaff(me);
  const stats = staff ? getAdminStats() : getVolunteerStats(me.id);
  const recent = staff ? listRecentParticipants(5) : [];
  const firstName = me.fullName.split(" ")[0];

  const cards = staff
    ? [
        {
          label: "Total participants",
          value: "totalParticipants" in stats ? stats.totalParticipants : 0,
          tile: "var(--tile-blue)",
          color: "var(--tag-blue-fg)",
          Icon: UsersIcon,
        },
        {
          label: "Active participants",
          value: "activeParticipants" in stats ? stats.activeParticipants : 0,
          tile: "var(--tile-green)",
          color: "var(--green)",
          Icon: UsersIcon,
        },
        {
          label: "Account requests",
          value: "pendingRequests" in stats ? stats.pendingRequests : 0,
          tile: "var(--tile-amber)",
          color: "var(--amber)",
          Icon: InboxIcon,
        },
        {
          label: "Open slots",
          value: "openSlots" in stats ? stats.openSlots : 0,
          tile: "var(--tile-pink)",
          color: "var(--red)",
          Icon: CalendarIcon,
        },
      ]
    : [
        {
          label: "Upcoming commitments",
          value: "upcomingCommitments" in stats ? stats.upcomingCommitments : 0,
          tile: "var(--tile-blue)",
          color: "var(--tag-blue-fg)",
          Icon: CalendarIcon,
        },
        {
          label: "Requests awaiting review",
          value: "pendingRequests" in stats ? stats.pendingRequests : 0,
          tile: "var(--tile-amber)",
          color: "var(--amber)",
          Icon: InboxIcon,
        },
        {
          label: "Hours logged",
          value: "hoursLogged" in stats ? `${stats.hoursLogged} hrs` : "0 hrs",
          tile: "var(--tile-green)",
          color: "var(--green)",
          Icon: ClockIcon,
        },
        {
          label: "Open opportunities",
          value: "openOpportunities" in stats ? stats.openOpportunities : 0,
          tile: "var(--tile-pink)",
          color: "var(--red)",
          Icon: HandIcon,
        },
      ];

  return (
    <>
      <TopBar
        title={`${greeting()}, ${firstName}`}
        subtitle={
          staff
            ? "Here's a snapshot of the foundation community."
            : "Here's what is happening with your volunteering."
        }
        search=""
        onSearch={(value) => {
          if (value.trim().length > 1) {
            navigate(`/people?q=${encodeURIComponent(value.trim())}`);
          }
        }}
      />

      <div className="content">
        <section className="stats" aria-label="Summary">
          {cards.map((card) => (
            <article key={card.label} className="card stat">
              <span
                className="stat__tile"
                style={{ background: card.tile, color: card.color }}
              >
                <card.Icon />
              </span>
              <div>
                <p className="stat__label">{card.label}</p>
                <p className="stat__value">{card.value}</p>
              </div>
            </article>
          ))}
        </section>

        {staff ? (
          <section className="card panel" aria-label="Our people">
            <div className="panel__head">
              <h2 className="panel__title">Recently joined</h2>
              <div className="panel__actions">
                <Link to="/people/new" className="btn btn--primary">
                  <PlusIcon /> Add participant
                </Link>
                <Link to="/people" className="btn btn--ghost">
                  <FilterIcon /> Directory
                </Link>
              </div>
            </div>

            {recent.length === 0 ? (
              <EmptyState
                title="No participants yet"
                message="Approve a volunteer request or add the first participant directly."
                action={
                  <Link to="/approvals" className="btn btn--primary">
                    Review account requests
                  </Link>
                }
              />
            ) : (
              <PeopleTable people={recent} compact />
            )}

            <div
              style={{
                padding: "var(--sp-4) var(--sp-6)",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Link to="/people" className="btn btn--text">
                View all <ArrowRight />
              </Link>
            </div>
          </section>
        ) : (
          <section className="card panel">
            <div className="panel__head">
              <h2 className="panel__title">Ready to help?</h2>
              <Link to="/opportunities" className="btn btn--primary">
                <HandIcon /> Browse opportunities
              </Link>
            </div>
            <EmptyState
              title="Choose work that fits your time and skills"
              message="Open opportunities show the date, location, skills needed, and available capacity."
              action={
                <Link to="/commitments" className="btn btn--ghost">
                  View my commitments
                </Link>
              }
            />
          </section>
        )}
      </div>
    </>
  );
}

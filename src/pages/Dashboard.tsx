import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "../components/Layout";
import PeopleTable from "../components/PeopleTable";
import { EmptyState, SkeletonRows } from "../components/ui";
import {
  ArrowRight,
  ClockIcon,
  FilterIcon,
  HeartIcon,
  PlusIcon,
  SparkIcon,
  TrendUp,
  UsersIcon,
} from "../components/icons";
import { getCurrentUser, getStats, listRecentParticipants } from "../data/api";
import type { DashboardStats, Participant } from "../types";

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const me = getCurrentUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Participant[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getStats().then(setStats);
    listRecentParticipants(5).then(setRecent);
  }, []);

  const firstName = useMemo(() => me.fullName.split(" ")[0], [me.fullName]);

  // Typing in the header search jumps straight to the directory.
  function onSearch(value: string) {
    setSearch(value);
    if (value.trim().length > 1) {
      navigate(`/people?q=${encodeURIComponent(value.trim())}`);
    }
  }

  const cards = [
    {
      label: "Total Participants",
      value: stats?.totalParticipants,
      delta: stats?.deltas.totalParticipants,
      tile: "var(--tile-blue)",
      color: "var(--tag-blue-fg)",
      Icon: UsersIcon,
    },
    {
      label: "Active This Month",
      value: stats?.activeThisMonth,
      delta: stats?.deltas.activeThisMonth,
      tile: "var(--tile-amber)",
      color: "var(--amber)",
      Icon: SparkIcon,
    },
    {
      label: "Total Hours Committed",
      value: stats ? `${stats.totalHoursCommitted} hrs` : undefined,
      delta: stats?.deltas.totalHoursCommitted,
      tile: "var(--tile-green)",
      color: "var(--green)",
      Icon: ClockIcon,
    },
    {
      label: "Active Expertise Areas",
      value: stats?.activeExpertiseAreas,
      delta: stats?.deltas.activeExpertiseAreas,
      deltaLabel: "new this month",
      tile: "var(--tile-pink)",
      color: "var(--red)",
      Icon: HeartIcon,
    },
  ];

  return (
    <>
      <TopBar
        title={`${greeting()}, ${firstName}`}
        subtitle="Here's a snapshot of our foundation community."
        search={search}
        onSearch={onSearch}
      />

      <div className="content">
        <section className="stats" aria-label="Community summary">
          {cards.map((c) => (
            <article key={c.label} className="card stat">
              <span className="stat__tile" style={{ background: c.tile, color: c.color }}>
                <c.Icon />
              </span>
              <div>
                <p className="stat__label">{c.label}</p>
                {c.value === undefined ? (
                  <div className="skeleton" style={{ height: 34, width: 72, margin: "4px 0 6px" }} />
                ) : (
                  <p className="stat__value">{c.value}</p>
                )}
                {c.delta !== undefined && (
                  <p className="stat__delta">
                    <TrendUp />
                    {c.deltaLabel
                      ? `${c.delta} ${c.deltaLabel}`
                      : `${c.delta}% from last month`}
                  </p>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="card panel" aria-label="Our people">
          <div className="panel__head">
            <h2 className="panel__title">Our People</h2>
            <div className="panel__actions">
              <Link to="/people/new" className="btn btn--primary">
                <PlusIcon /> Add Participant
              </Link>
              <Link to="/people" className="btn btn--ghost">
                <FilterIcon /> Filters
              </Link>
            </div>
          </div>

          {recent === null ? (
            <SkeletonRows rows={5} />
          ) : recent.length === 0 ? (
            <EmptyState
              title="No participants yet"
              message="Add the first member of the community to get started."
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
      </div>
    </>
  );
}

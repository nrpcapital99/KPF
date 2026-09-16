import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "../components/Layout";
import { Avatar, EmptyState, SkeletonRows, formatDate } from "../components/ui";
import { CalendarIcon, PlusIcon } from "../components/icons";
import { listProjects, participantsById } from "../data/api";
import type { Project, ProjectStatus } from "../types";

const STATUS_STYLE: Record<ProjectStatus, { label: string; cls: string }> = {
  ACTIVE: { label: "Active", cls: "pill--active" },
  PLANNING: { label: "Planning", cls: "pill--pending" },
  COMPLETED: { label: "Completed", cls: "pill--inactive" },
  ON_HOLD: { label: "On hold", cls: "pill--archived" },
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    listProjects().then(setProjects);
  }, []);

  return (
    <>
      <TopBar
        title="Projects / Teams"
        subtitle="What the community is working on right now."
      />

      <div className="content">
        <section className="card panel">
          <div className="panel__head">
            <h2 className="panel__title">
              {projects ? `${projects.length} projects` : "Loading..."}
            </h2>
            <button className="btn btn--primary">
              <PlusIcon /> New Project
            </button>
          </div>

          {projects === null ? (
            <SkeletonRows rows={4} />
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              message="Create the first project to start assigning people to it."
            />
          ) : (
            <div>
              {projects.map((p) => {
                const members = participantsById(p.memberIds);
                const lead = p.leadId ? participantsById([p.leadId])[0] : null;
                const status = STATUS_STYLE[p.status];

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: "var(--sp-5) var(--sp-6)",
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      gap: "var(--sp-5)",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--sp-3)",
                          flexWrap: "wrap",
                        }}
                      >
                        <h3 style={{ fontSize: "var(--text-lg)" }}>{p.name}</h3>
                        <span className={`pill ${status.cls}`}>{status.label}</span>
                      </div>
                      {p.description && (
                        <p
                          style={{
                            color: "var(--ink-2)",
                            fontSize: "var(--text-md)",
                            marginTop: 6,
                            maxWidth: "62ch",
                          }}
                        >
                          {p.description}
                        </p>
                      )}
                      {p.startsOn && (
                        <p className="detail__row" style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-sm)" }}>
                          <CalendarIcon />
                          <span>
                            {formatDate(p.startsOn)}
                            {p.endsOn ? ` — ${formatDate(p.endsOn)}` : " — ongoing"}
                          </span>
                        </p>
                      )}
                    </div>

                    <div style={{ flex: "0 0 auto" }}>
                      <p
                        className="detail__section-label"
                        style={{ marginBottom: "var(--sp-2)" }}
                      >
                        Team ({members.length})
                      </p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {members.slice(0, 6).map((m) => (
                          <Link key={m.id} to={`/people/${m.id}`} title={m.fullName}>
                            <Avatar person={m} size="sm" />
                          </Link>
                        ))}
                        {members.length > 6 && (
                          <span className="tag tag--blue" style={{ alignSelf: "center" }}>
                            +{members.length - 6}
                          </span>
                        )}
                      </div>
                      {lead && (
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--ink-2)",
                            marginTop: "var(--sp-2)",
                          }}
                        >
                          Lead: {lead.fullName}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

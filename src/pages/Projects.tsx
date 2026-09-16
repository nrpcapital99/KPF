import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../auth/session";
import { TopBar } from "../components/Layout";
import { Avatar, EmptyState, Field, Select, formatDate } from "../components/ui";
import { CalendarIcon, CheckIcon, PlusIcon, XIcon } from "../components/icons";
import {
  createProject,
  listParticipants,
  listProjects,
  participantsById,
} from "../data/api";
import type { ProjectStatus } from "../types";

const STATUS_STYLE: Record<ProjectStatus, { label: string; cls: string }> = {
  ACTIVE: { label: "Active", cls: "pill--active" },
  PLANNING: { label: "Planning", cls: "pill--pending" },
  COMPLETED: { label: "Completed", cls: "pill--inactive" },
  ON_HOLD: { label: "On hold", cls: "pill--archived" },
};

const EMPTY_FORM = {
  name: "",
  description: "",
  status: "PLANNING" as ProjectStatus,
  startsOn: "",
  endsOn: "",
  leadId: "",
  memberIds: [] as string[],
};

export default function Projects() {
  useStore();
  const projects = listProjects();
  const people = listParticipants({ status: "ACTIVE" });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  function toggleMember(id: string) {
    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(id)
        ? current.memberIds.filter((memberId) => memberId !== id)
        : [...current.memberIds, id],
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Give the project a name.");
      return;
    }
    if (form.startsOn && form.endsOn && form.endsOn < form.startsOn) {
      setError("The end date cannot be before the start date.");
      return;
    }

    const memberIds = form.leadId
      ? Array.from(new Set([...form.memberIds, form.leadId]))
      : form.memberIds;
    try {
      await createProject({
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        startsOn: form.startsOn || null,
        endsOn: form.endsOn || null,
        leadId: form.leadId || null,
        memberIds,
      });
      setForm(EMPTY_FORM);
      setError("");
      setCreating(false);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <TopBar
        title="Projects / Teams"
        subtitle="What the community is working on right now."
      />

      <div className="content">
        {creating && (
          <section
            className="card"
            style={{ padding: "var(--sp-6)", marginBottom: "var(--sp-5)" }}
          >
            <div className="panel__head" style={{ padding: 0, marginBottom: "var(--sp-5)" }}>
              <h2 className="panel__title">New project</h2>
              <button
                className="btn btn--text"
                onClick={() => setCreating(false)}
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            <form className="form-grid" onSubmit={submit} noValidate>
              <Field label="Project name" required htmlFor="project-name" error={error}>
                <input
                  id="project-name"
                  className="input"
                  value={form.name}
                  onChange={(event) => {
                    setForm({ ...form, name: event.target.value });
                    setError("");
                  }}
                  placeholder="e.g. Community literacy programme"
                />
              </Field>

              <Field label="Status" htmlFor="project-status">
                <Select
                  id="project-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as ProjectStatus })
                  }
                >
                  {Object.entries(STATUS_STYLE).map(([value, status]) => (
                    <option key={value} value={value}>
                      {status.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Description" htmlFor="project-description" full>
                <textarea
                  id="project-description"
                  className="textarea"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="What is this project trying to achieve?"
                />
              </Field>

              <Field label="Starts" htmlFor="project-start">
                <input
                  id="project-start"
                  className="input"
                  type="date"
                  value={form.startsOn}
                  onChange={(event) => setForm({ ...form, startsOn: event.target.value })}
                />
              </Field>

              <Field label="Ends" htmlFor="project-end">
                <input
                  id="project-end"
                  className="input"
                  type="date"
                  value={form.endsOn}
                  onChange={(event) => {
                    setForm({ ...form, endsOn: event.target.value });
                    setError("");
                  }}
                />
              </Field>

              <Field label="Project lead" htmlFor="project-lead" full>
                <Select
                  id="project-lead"
                  value={form.leadId}
                  onChange={(event) => setForm({ ...form, leadId: event.target.value })}
                >
                  <option value="">No lead assigned</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullName}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Team members"
                full
                hint={people.length ? "Select everyone assigned to this project." : "Add participants before building a team."}
              >
                <div className="tags" style={{ paddingTop: 4 }}>
                  {people.map((person) => {
                    const selected = form.memberIds.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        type="button"
                        className="tag tag--blue tag--toggle"
                        aria-pressed={selected}
                        onClick={() => toggleMember(person.id)}
                        style={{ padding: "6px 14px", fontSize: "var(--text-sm)" }}
                      >
                        {selected && <CheckIcon style={{ width: 13, height: 13, marginRight: 5 }} />}
                        {person.fullName}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div
                className="form-grid--full"
                style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "flex-end" }}
              >
                <button type="button" className="btn btn--ghost" onClick={() => setCreating(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Create project
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="card panel">
          <div className="panel__head">
            <h2 className="panel__title">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </h2>
            {!creating && (
              <button className="btn btn--primary" onClick={() => setCreating(true)}>
                <PlusIcon /> New project
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              message="Create the first project to start assigning people to it."
              action={
                <button className="btn btn--primary" onClick={() => setCreating(true)}>
                  <PlusIcon /> Create the first project
                </button>
              }
            />
          ) : (
            <div>
              {projects.map((project) => {
                const members = participantsById(project.memberIds);
                const lead = project.leadId ? participantsById([project.leadId])[0] : null;
                const status = STATUS_STYLE[project.status];

                return (
                  <article
                    key={project.id}
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
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "var(--text-lg)" }}>{project.name}</h3>
                        <span className={`pill ${status.cls}`}>{status.label}</span>
                      </div>
                      {project.description && (
                        <p style={{ color: "var(--ink-2)", fontSize: "var(--text-md)", marginTop: 6, maxWidth: "62ch" }}>
                          {project.description}
                        </p>
                      )}
                      {project.startsOn && (
                        <p className="detail__row" style={{ marginTop: "var(--sp-3)", fontSize: "var(--text-sm)" }}>
                          <CalendarIcon />
                          <span>
                            {formatDate(project.startsOn)}
                            {project.endsOn ? ` — ${formatDate(project.endsOn)}` : " — ongoing"}
                          </span>
                        </p>
                      )}
                    </div>

                    <div style={{ flex: "0 0 auto" }}>
                      <p className="detail__section-label" style={{ marginBottom: "var(--sp-2)" }}>
                        Team ({members.length})
                      </p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {members.map((member) => (
                          <Link key={member.id} to={`/people/${member.id}`} title={member.fullName}>
                            <Avatar person={member} size="sm" />
                          </Link>
                        ))}
                      </div>
                      {lead && (
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)", marginTop: "var(--sp-2)" }}>
                          Lead: {lead.fullName}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

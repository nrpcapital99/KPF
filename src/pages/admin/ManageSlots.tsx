import { useState } from "react";
import { TopBar } from "../../components/Layout";
import { Notice } from "../../components/AuthShell";
import {
  Avatar,
  Capacity,
  EmptyState,
  Field,
  Select,
  SignupPill,
  SlotPill,
  TagList,
  formatSlotWhen,
  relativeTime,
  toLocalInput,
} from "../../components/ui";
import {
  CalendarIcon,
  CalendarPlus,
  CheckIcon,
  MapPin,
  PlusIcon,
  XIcon,
} from "../../components/icons";
import {
  approveSignup,
  createSlot,
  declineSignup,
  expertiseByIds,
  listExpertiseAreas,
  listLocations,
  listSignupsForSlot,
  listSlots,
  markAttended,
  markNoShow,
  updateSlot,
} from "../../data/api";
import { useCurrentUser, useStore } from "../../auth/session";
import type { SlotInput } from "../../types";

const SIGNUP_ERRORS: Record<string, string> = {
  SLOT_FULL: "This slot is already at capacity. Raise the capacity first, or decline.",
};

function defaultSlot(): SlotInput {
  const start = new Date();
  start.setDate(start.getDate() + 7);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(13, 0, 0, 0);

  return {
    title: "",
    description: "",
    location: "",
    startsAt: toLocalInput(start),
    endsAt: toLocalInput(end),
    capacity: 5,
    requiredExpertiseIds: [],
  };
}

export default function ManageSlots() {
  useStore();
  const me = useCurrentUser();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SlotInput>(defaultSlot);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const slots = listSlots();
  const areas = listExpertiseAreas();

  function set<K extends keyof SlotInput>(key: K, value: SlotInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function submitSlot(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Give the slot a title.";
    if (!form.startsAt) next.startsAt = "Pick a start time.";
    if (!form.endsAt) next.endsAt = "Pick an end time.";
    if (form.startsAt && form.endsAt && form.endsAt <= form.startsAt) {
      next.endsAt = "The end time has to be after the start time.";
    }
    if (!form.capacity || form.capacity < 1) {
      next.capacity = "Capacity has to be at least 1.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await createSlot(
        {
          ...form,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
        },
        me.id,
      );
      setForm(defaultSlot());
      setCreating(false);
      setFlash("Slot opened. Volunteers can request it now.");
    } catch (error) {
      setFlash((error as Error).message);
    }
  }

  async function decide(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      setFlash(message);
    } catch (err) {
      setFlash(SIGNUP_ERRORS[(err as Error).message] ?? (err as Error).message);
    }
  }

  return (
    <>
      <TopBar
        title="Volunteering Slots"
        subtitle="Open up work, then review who puts their hand up."
      />

      <div className="content">
        {flash && (
          <div style={{ marginBottom: "var(--sp-5)" }}>
            <Notice kind="ok">{flash}</Notice>
          </div>
        )}

        {creating && (
          <section className="card" style={{ padding: "var(--sp-6)", marginBottom: "var(--sp-5)" }}>
            <div className="panel__head" style={{ padding: 0, marginBottom: "var(--sp-5)" }}>
              <h2 className="panel__title">New slot</h2>
              <button
                className="btn btn--text"
                onClick={() => setCreating(false)}
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            <form className="form-grid" onSubmit={submitSlot} noValidate>
              <Field label="Title" required htmlFor="title" error={errors.title} full>
                <input
                  id="title"
                  className="input"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Saturday literacy session at Ganesh Nagar school"
                  aria-invalid={Boolean(errors.title)}
                />
              </Field>

              <Field label="Description" htmlFor="description" full>
                <textarea
                  id="description"
                  className="textarea"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="What will volunteers be doing? What should they bring or know?"
                />
              </Field>

              <Field label="Starts" required htmlFor="startsAt" error={errors.startsAt}>
                <input
                  id="startsAt"
                  type="datetime-local"
                  className="input"
                  value={form.startsAt}
                  onChange={(e) => set("startsAt", e.target.value)}
                  aria-invalid={Boolean(errors.startsAt)}
                />
              </Field>

              <Field label="Ends" required htmlFor="endsAt" error={errors.endsAt}>
                <input
                  id="endsAt"
                  type="datetime-local"
                  className="input"
                  value={form.endsAt}
                  onChange={(e) => set("endsAt", e.target.value)}
                  aria-invalid={Boolean(errors.endsAt)}
                />
              </Field>

              <Field label="Location" htmlFor="location">
                <Select
                  id="location"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                >
                  <option value="">Select a location</option>
                  {listLocations().map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Volunteers needed"
                required
                htmlFor="capacity"
                error={errors.capacity}
              >
                <input
                  id="capacity"
                  type="number"
                  min={1}
                  className="input"
                  value={form.capacity}
                  onChange={(e) => set("capacity", Number(e.target.value))}
                  aria-invalid={Boolean(errors.capacity)}
                />
              </Field>

              <Field
                label="Skills needed (optional)"
                full
                hint="Leave empty if anyone can help."
              >
                <div className="tags" style={{ paddingTop: 4 }}>
                  {areas.map((a) => {
                    const on = form.requiredExpertiseIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`tag tag--${a.colorToken} tag--toggle`}
                        aria-pressed={on}
                        onClick={() =>
                          set(
                            "requiredExpertiseIds",
                            on
                              ? form.requiredExpertiseIds.filter((x) => x !== a.id)
                              : [...form.requiredExpertiseIds, a.id],
                          )
                        }
                        style={{ padding: "6px 14px", fontSize: "var(--text-sm)" }}
                      >
                        {on && <CheckIcon style={{ width: 13, height: 13, marginRight: 5 }} />}
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div
                className="form-grid--full"
                style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  <CalendarPlus /> Open this slot
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="card panel">
          <div className="panel__head">
            <h2 className="panel__title">
              {slots.length === 0
                ? "No slots yet"
                : `${slots.length} ${slots.length === 1 ? "slot" : "slots"}`}
            </h2>
            {!creating && (
              <button className="btn btn--primary" onClick={() => setCreating(true)}>
                <PlusIcon /> New Slot
              </button>
            )}
          </div>

          {slots.length === 0 ? (
            <EmptyState
              title="No volunteering slots yet"
              message="Open a slot and approved volunteers will be able to request it."
              action={
                <button className="btn btn--primary" onClick={() => setCreating(true)}>
                  <PlusIcon /> Create the first slot
                </button>
              }
            />
          ) : (
            slots.map((slot) => {
              const signups = listSignupsForSlot(slot.id);
              const pending = signups.filter((s) => s.status === "REQUESTED");
              const isOpen = expanded === slot.id;
              const past = new Date(slot.endsAt) < new Date();

              return (
                <article key={slot.id} className="slot">
                  <div className="slot__main">
                    <div className="slot__head">
                      <h3 className="slot__title">{slot.title}</h3>
                      <SlotPill status={slot.status} />
                      {pending.length > 0 && (
                        <span className="pill pill--pending">
                          {pending.length} awaiting review
                        </span>
                      )}
                    </div>

                    {slot.description && <p className="slot__desc">{slot.description}</p>}

                    <div className="slot__meta">
                      <p className="detail__row">
                        <CalendarIcon />
                        <span>{formatSlotWhen(slot.startsAt, slot.endsAt)}</span>
                      </p>
                      {slot.location && (
                        <p className="detail__row">
                          <MapPin />
                          <span>{slot.location}</span>
                        </p>
                      )}
                    </div>

                    {slot.requiredExpertiseIds.length > 0 && (
                      <div style={{ marginTop: "var(--sp-3)" }}>
                        <TagList areas={expertiseByIds(slot.requiredExpertiseIds)} />
                      </div>
                    )}

                    {isOpen && (
                      <div style={{ marginTop: "var(--sp-5)" }}>
                        <h4 className="detail__section-label">
                          Volunteers ({signups.length})
                        </h4>
                        {signups.length === 0 ? (
                          <p style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>
                            Nobody has requested this slot yet.
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                            {signups.map((s) => (
                              <div
                                key={s.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "var(--sp-3)",
                                  flexWrap: "wrap",
                                  padding: "var(--sp-3)",
                                  background: "var(--surface-alt)",
                                  borderRadius: "var(--r-md)",
                                }}
                              >
                                {s.participant && (
                                  <Avatar person={s.participant} size="sm" />
                                )}
                                <span style={{ flex: 1, minWidth: 140 }}>
                                  <strong style={{ display: "block", fontSize: "var(--text-base)" }}>
                                    {s.participant?.fullName ?? "Unknown"}
                                  </strong>
                                  <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>
                                    Requested {relativeTime(s.requestedAt)}
                                    {s.hoursLogged ? ` · ${s.hoursLogged} hrs logged` : ""}
                                  </span>
                                </span>
                                <SignupPill status={s.status} />

                                {s.status === "REQUESTED" && (
                                  <span style={{ display: "flex", gap: "var(--sp-2)" }}>
                                    <button
                                      className="btn btn--primary"
                                      onClick={() =>
                                        void decide(
                                          () => approveSignup(s.id, me.id),
                                          `${s.participant?.fullName} is confirmed for this slot.`,
                                        )
                                      }
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="btn btn--ghost"
                                      onClick={() =>
                                        void decide(
                                          () => declineSignup(s.id, me.id),
                                          "Request declined.",
                                        )
                                      }
                                    >
                                      Decline
                                    </button>
                                  </span>
                                )}

                                {s.status === "APPROVED" && past && (
                                  <span style={{ display: "flex", gap: "var(--sp-2)" }}>
                                    <button
                                      className="btn btn--primary"
                                      onClick={() => {
                                        const hrs =
                                          (new Date(slot.endsAt).getTime() -
                                            new Date(slot.startsAt).getTime()) /
                                          3600000;
                                        void decide(
                                          () =>
                                            markAttended(
                                              s.id,
                                              me.id,
                                              Math.round(hrs * 2) / 2,
                                            ),
                                          "Attendance recorded.",
                                        );
                                      }}
                                    >
                                      Mark attended
                                    </button>
                                    <button
                                      className="btn btn--ghost"
                                      onClick={() =>
                                        void decide(
                                          () => markNoShow(s.id, me.id),
                                          "Recorded as a no-show.",
                                        )
                                      }
                                    >
                                      No show
                                    </button>
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="slot__side">
                    <Capacity filled={slot.approvedCount} capacity={slot.capacity} />
                    <button
                      className="btn btn--ghost"
                      onClick={() => setExpanded(isOpen ? null : slot.id)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? "Hide" : "Review"}
                      {pending.length > 0 && !isOpen ? ` (${pending.length})` : ""}
                    </button>
                    {slot.status === "OPEN" ? (
                      <button
                        className="btn btn--text"
                        onClick={async () => {
                          await updateSlot(slot.id, { status: "CLOSED" });
                          setFlash("Slot closed to new requests.");
                        }}
                      >
                        Close slot
                      </button>
                    ) : slot.status === "CLOSED" ? (
                      <button
                        className="btn btn--text"
                        onClick={async () => {
                          await updateSlot(slot.id, { status: "OPEN" });
                          setFlash("Slot reopened.");
                        }}
                      >
                        Reopen
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </>
  );
}

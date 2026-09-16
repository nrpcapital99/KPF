import { useEffect, useState } from "react";
import { TopBar } from "../components/Layout";
import {
  Avatar,
  Field,
  Select,
  StatusPill,
  TagList,
  formatDate,
} from "../components/ui";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  MailIcon,
  MapPin,
  PencilIcon,
  PhoneIcon,
} from "../components/icons";
import {
  getCurrentUser,
  listExpertiseAreas,
  listLocations,
  updateParticipant,
} from "../data/api";
import type { ExpertiseArea, Participant } from "../types";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  COORDINATOR: "Coordinator",
  PARTICIPANT: "Participant",
};

const HOURS_CHOICES = [2, 4, 5, 8, 10, 12, 15, 20, 25];

export default function MyProfile() {
  const [me, setMe] = useState<Participant>(getCurrentUser());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [areas, setAreas] = useState<ExpertiseArea[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [draft, setDraft] = useState<Participant>(me);

  useEffect(() => {
    listExpertiseAreas().then(setAreas);
    listLocations().then(setLocations);
  }, []);

  function startEdit() {
    setDraft(me);
    setEditing(true);
  }

  function toggleExpertise(area: ExpertiseArea) {
    setDraft((d) => ({
      ...d,
      expertise: d.expertise.some((e) => e.id === area.id)
        ? d.expertise.filter((e) => e.id !== area.id)
        : [...d.expertise, area],
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await updateParticipant(me.id, {
        fullName: draft.fullName,
        phone: draft.phone,
        location: draft.location,
        about: draft.about,
        availabilityHoursPerWeek: draft.availabilityHoursPerWeek,
        expertise: draft.expertise,
      });
      setMe(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const monthly = me.availabilityHoursPerWeek * 4;

  return (
    <>
      <TopBar title="My Profile" subtitle="How the rest of the community sees you." />

      <div className="content">
        <article className="card" style={{ maxWidth: 880 }}>
          <header className="detail__head">
            <Avatar person={me} size="lg" />
            <div className="detail__ident">
              <div className="detail__name">
                <h2>{me.fullName}</h2>
                <StatusPill status={me.status} />
              </div>
              <p className="detail__role">{ROLE_LABEL[me.role] ?? me.role}</p>
            </div>
            {!editing ? (
              <button className="btn btn--ghost" onClick={startEdit}>
                <PencilIcon /> Edit
              </button>
            ) : (
              <div className="panel__actions">
                <button
                  className="btn btn--ghost"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className="btn btn--primary" onClick={save} disabled={saving}>
                  <CheckIcon /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </header>

          <div className="detail__body">
            {!editing ? (
              <>
                <section className="detail__rows">
                  <p className="detail__row">
                    <MailIcon />
                    <span>{me.email}</span>
                  </p>
                  <p className="detail__row">
                    <PhoneIcon />
                    <span>{me.phone}</span>
                  </p>
                  {me.location && (
                    <p className="detail__row">
                      <MapPin />
                      <span>{me.location}</span>
                    </p>
                  )}
                </section>

                <section>
                  <h3 className="detail__section-label">My Expertise</h3>
                  <TagList areas={me.expertise} />
                </section>

                <section>
                  <h3 className="detail__section-label">Availability</h3>
                  <p className="detail__row">
                    <ClockIcon />
                    <span>
                      {me.availabilityHoursPerWeek} hrs / week
                      <br />
                      <span style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>
                        (or {monthly} hrs / month)
                      </span>
                    </span>
                  </p>
                </section>

                {me.about && (
                  <section>
                    <h3 className="detail__section-label">About</h3>
                    <p className="detail__about">{me.about}</p>
                  </section>
                )}

                <section>
                  <h3 className="detail__section-label">Joined On</h3>
                  <p className="detail__row">
                    <CalendarIcon />
                    <span>{formatDate(me.joinedOn)}</span>
                  </p>
                </section>
              </>
            ) : (
              <div className="form-grid">
                <Field label="Full Name" htmlFor="p-name" required>
                  <input
                    id="p-name"
                    className="input"
                    value={draft.fullName}
                    onChange={(e) =>
                      setDraft({ ...draft, fullName: e.target.value })
                    }
                  />
                </Field>

                <Field
                  label="Email Address"
                  htmlFor="p-email"
                  hint="Contact an admin to change the email on your account."
                >
                  <input id="p-email" className="input" value={draft.email} disabled />
                </Field>

                <Field label="Phone Number" htmlFor="p-phone" required>
                  <input
                    id="p-phone"
                    className="input"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  />
                </Field>

                <Field label="Location" htmlFor="p-location">
                  <Select
                    id="p-location"
                    value={draft.location ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, location: e.target.value })
                    }
                  >
                    <option value="">Select a location</option>
                    {locations.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Availability" htmlFor="p-hours" required>
                  <Select
                    id="p-hours"
                    value={draft.availabilityHoursPerWeek}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        availabilityHoursPerWeek: Number(e.target.value),
                      })
                    }
                  >
                    {HOURS_CHOICES.map((h) => (
                      <option key={h} value={h}>
                        {h} hrs / week
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="My Expertise" full>
                  <div className="tags" style={{ paddingTop: 4 }}>
                    {areas.map((a) => {
                      const on = draft.expertise.some((e) => e.id === a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          className={`tag tag--${a.colorToken} tag--toggle`}
                          aria-pressed={on}
                          onClick={() => toggleExpertise(a)}
                          style={{ padding: "6px 14px", fontSize: "var(--text-sm)" }}
                        >
                          {on && (
                            <CheckIcon
                              style={{ width: 13, height: 13, marginRight: 5 }}
                            />
                          )}
                          {a.name}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="About" full>
                  <textarea
                    className="textarea"
                    value={draft.about ?? ""}
                    onChange={(e) => setDraft({ ...draft, about: e.target.value })}
                    placeholder="Tell the community about yourself..."
                  />
                </Field>
              </div>
            )}
          </div>
        </article>
      </div>
    </>
  );
}

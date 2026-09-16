import { useState } from "react";
import { TopBar } from "../../components/Layout";
import { Notice } from "../../components/AuthShell";
import {
  Capacity,
  EmptyState,
  SignupPill,
  TagList,
  formatSlotWhen,
} from "../../components/ui";
import { CalendarIcon, HandIcon, MapPin } from "../../components/icons";
import {
  expertiseByIds,
  listOpenSlots,
  requestSlot,
  withdrawSignup,
} from "../../data/api";
import { useCurrentUser, useStore } from "../../auth/session";

const ERRORS: Record<string, string> = {
  ALREADY_REQUESTED: "You've already put your hand up for this slot.",
  SLOT_CLOSED: "This slot is no longer taking requests.",
};

/** What a volunteer sees: open slots they can put their hand up for. */
export default function Opportunities() {
  useStore();
  const me = useCurrentUser();
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [onlyMySkills, setOnlyMySkills] = useState(false);

  const mySkillIds = me.expertise.map((e) => e.id);
  const all = listOpenSlots(me.id);
  const slots = onlyMySkills
    ? all.filter(
        (s) =>
          s.requiredExpertiseIds.length === 0 ||
          s.requiredExpertiseIds.some((id) => mySkillIds.includes(id)),
      )
    : all;

  async function request(slotId: string, title: string) {
    try {
      await requestSlot(slotId, me.id);
      setFlash({
        kind: "ok",
        text: `Your request for "${title}" has been sent. A coordinator will confirm it.`,
      });
    } catch (err) {
      const code = (err as Error).message;
      setFlash({ kind: "error", text: ERRORS[code] ?? "Something went wrong." });
    }
  }

  return (
    <>
      <TopBar
        title="Volunteering Opportunities"
        subtitle="Open slots you can put your hand up for."
      />

      <div className="content">
        {flash && (
          <div style={{ marginBottom: "var(--sp-5)" }}>
            <Notice kind={flash.kind}>{flash.text}</Notice>
          </div>
        )}

        <section className="card panel">
          <div className="panel__head">
            <h2 className="panel__title">
              {slots.length === 0
                ? "Nothing open right now"
                : `${slots.length} open ${slots.length === 1 ? "slot" : "slots"}`}
            </h2>
            {mySkillIds.length > 0 && all.length > 0 && (
              <button
                className={`btn ${onlyMySkills ? "btn--primary" : "btn--ghost"}`}
                onClick={() => setOnlyMySkills((v) => !v)}
                aria-pressed={onlyMySkills}
              >
                Matching my skills
              </button>
            )}
          </div>

          {slots.length === 0 ? (
            <EmptyState
              title={
                onlyMySkills && all.length > 0
                  ? "Nothing matching your skills"
                  : "No open slots at the moment"
              }
              message={
                onlyMySkills && all.length > 0
                  ? "Turn off the filter to see everything that's open."
                  : "When coordinators open up volunteering work, it will show up here."
              }
              action={
                onlyMySkills && all.length > 0 ? (
                  <button className="btn btn--ghost" onClick={() => setOnlyMySkills(false)}>
                    Show all open slots
                  </button>
                ) : undefined
              }
            />
          ) : (
            slots.map((slot) => {
              const full = slot.approvedCount >= slot.capacity;
              const mine = slot.mySignup;

              return (
                <article key={slot.id} className="slot">
                  <div className="slot__main">
                    <div className="slot__head">
                      <h3 className="slot__title">{slot.title}</h3>
                      {mine && <SignupPill status={mine.status} />}
                      {!mine && full && <span className="pill pill--inactive">Full</span>}
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
                  </div>

                  <div className="slot__side">
                    <Capacity filled={slot.approvedCount} capacity={slot.capacity} />

                    {mine ? (
                      mine.status === "REQUESTED" || mine.status === "APPROVED" ? (
                        <button
                          className="btn btn--ghost"
                          onClick={() => {
                            void withdrawSignup(mine.id)
                              .then(() =>
                                setFlash({
                                  kind: "ok",
                                  text: "You've withdrawn from that slot.",
                                }),
                              )
                              .catch((error) =>
                                setFlash({ kind: "error", text: (error as Error).message }),
                              );
                          }}
                        >
                          Withdraw
                        </button>
                      ) : null
                    ) : (
                      <button
                        className="btn btn--primary"
                        disabled={full}
                        onClick={() => void request(slot.id, slot.title)}
                      >
                        <HandIcon /> {full ? "Slot full" : "Request this slot"}
                      </button>
                    )}
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

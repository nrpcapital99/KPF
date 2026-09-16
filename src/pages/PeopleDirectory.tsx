import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TopBar } from "../components/Layout";
import PeopleTable from "../components/PeopleTable";
import { EmptyState, Field, Select } from "../components/ui";
import { FilterIcon, PlusIcon } from "../components/icons";
import { listExpertiseAreas, listLocations, listParticipants } from "../data/api";
import { EMPTY_FILTERS, type ParticipantFilters } from "../types";
import { isStaff, useCurrentUser, useStore } from "../auth/session";

const AVAILABILITY_OPTIONS: {
  value: ParticipantFilters["availability"];
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "0-5", label: "Up to 5 hrs/week" },
  { value: "5-10", label: "5 - 10 hrs/week" },
  { value: "10-20", label: "10 - 20 hrs/week" },
  { value: "20+", label: "20+ hrs/week" },
];

export default function PeopleDirectory() {
  useStore();
  const me = useCurrentUser();
  const staff = isStaff(me);
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get("q") ?? "";

  const [filters, setFilters] = useState<ParticipantFilters>({
    ...EMPTY_FILTERS,
    search: initialQuery,
  });
  // `applied` is what actually drives the query, so the dropdowns don't refetch
  // on every keystroke — only the search box is live.
  const [applied, setApplied] = useState<ParticipantFilters>({
    ...EMPTY_FILTERS,
    search: initialQuery,
  });
  const [showFilters, setShowFilters] = useState(false);
  const areas = listExpertiseAreas();
  const locations = listLocations();

  // Debounce the free-text search; dropdowns apply on button press.
  useEffect(() => {
    const t = setTimeout(
      () => setApplied((a) => ({ ...a, search: filters.search })),
      250,
    );
    return () => clearTimeout(t);
  }, [filters.search]);

  const people = listParticipants(applied);

  function set<K extends keyof ParticipantFilters>(
    key: K,
    value: ParticipantFilters[K],
  ) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function applyFilters() {
    setApplied(filters);
    setShowFilters(false);
  }

  function clearAll() {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setParams({});
  }

  const activeFilterCount = (
    ["expertiseId", "availability", "location", "status"] as const
  ).filter((k) => applied[k] !== "ALL").length;

  return (
    <>
      <TopBar
        title="People Directory"
        subtitle="Everyone who makes the foundation's work possible."
        search={filters.search}
        onSearch={(v) => set("search", v)}
      />

      <div className="content">
        <section className="card panel">
          <div className="panel__head">
            <h2 className="panel__title">
              {`${people.length} ${people.length === 1 ? "person" : "people"}`}
            </h2>
            <div className="panel__actions">
              {staff && (
                <Link to="/people/new" className="btn btn--primary">
                  <PlusIcon /> Add Participant
                </Link>
              )}
              <button
                className="btn btn--ghost"
                onClick={() => setShowFilters((s) => !s)}
                aria-expanded={showFilters}
              >
                <FilterIcon /> Filters
                {activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>
            </div>
          </div>

          {showFilters && (
            <>
              <div className="filters">
                <Field label="Expertise" htmlFor="f-expertise">
                  <Select
                    id="f-expertise"
                    value={filters.expertiseId}
                    onChange={(e) => set("expertiseId", e.target.value)}
                  >
                    <option value="ALL">All</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Availability" htmlFor="f-availability">
                  <Select
                    id="f-availability"
                    value={filters.availability}
                    onChange={(e) =>
                      set(
                        "availability",
                        e.target.value as ParticipantFilters["availability"],
                      )
                    }
                  >
                    {AVAILABILITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Location" htmlFor="f-location">
                  <Select
                    id="f-location"
                    value={filters.location}
                    onChange={(e) => set("location", e.target.value)}
                  >
                    <option value="ALL">All</option>
                    {locations.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Status" htmlFor="f-status">
                  <Select
                    id="f-status"
                    value={filters.status}
                    onChange={(e) =>
                      set("status", e.target.value as ParticipantFilters["status"])
                    }
                  >
                    <option value="ALL">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ARCHIVED">Archived</option>
                  </Select>
                </Field>
              </div>

              <div className="filters__actions">
                <button className="btn btn--primary btn--block" onClick={applyFilters}>
                  Apply Filters
                </button>
                <button className="btn btn--text" onClick={clearAll}>
                  Clear all
                </button>
              </div>
            </>
          )}

          {people.length === 0 ? (
            <EmptyState
              title="No one matches those filters"
              message="Try widening the search, or clear the filters to see everyone."
              action={
                <button className="btn btn--ghost" onClick={clearAll}>
                  Clear all filters
                </button>
              }
            />
          ) : (
            <PeopleTable people={people} />
          )}
        </section>
      </div>
    </>
  );
}

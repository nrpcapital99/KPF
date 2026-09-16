import { useNavigate } from "react-router-dom";
import type { Participant } from "../types";
import { Avatar, StatusPill, TagList } from "./ui";

/**
 * The "Our People" table. Renders as a real table on desktop and as a stacked
 * list on phones — same data, two presentations, switched in CSS so there is
 * no layout flash and no duplicate data fetching.
 */
export default function PeopleTable({
  people,
  compact = false,
}: {
  people: Participant[];
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const open = (id: string) => navigate(`/people/${id}`);

  return (
    <>
      <div className="table-wrap">
        <table className="dt">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Phone</th>
              <th scope="col">Expertise</th>
              <th scope="col">Availability</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr
                key={p.id}
                onClick={() => open(p.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open(p.id);
                  }
                }}
              >
                <td>
                  <span className="dt__person">
                    <Avatar person={p} size="md" />
                    <span className="dt__name">{p.fullName}</span>
                  </span>
                </td>
                <td className="dt__muted">{p.email}</td>
                <td className="dt__muted">{p.phone}</td>
                <td>
                  <TagList areas={p.expertise} max={compact ? 2 : 3} />
                </td>
                <td className="dt__muted">
                  {p.availabilityHoursPerWeek} hrs/week
                </td>
                <td>
                  <StatusPill status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-list">
        {people.map((p) => (
          <button
            key={p.id}
            className="mobile-list__row"
            onClick={() => open(p.id)}
          >
            <Avatar person={p} size="md" />
            <span className="mobile-list__meta">
              <span className="mobile-list__name">{p.fullName}</span>
              <span className="mobile-list__sub">
                {p.expertise.map((e) => e.name).join(", ") || "No expertise set"}
              </span>
            </span>
            <span className="mobile-list__right">
              <span className="mobile-list__hours">
                {p.availabilityHoursPerWeek} hrs/week
              </span>
              <StatusPill status={p.status} />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

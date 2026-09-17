import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import Brand from "../components/Brand";
import {
  AlertIcon,
  ArrowUpRightIcon,
  CheckIcon,
  DownloadIcon,
  InboxIcon,
  LinkIcon,
  LogOutIcon,
  SearchIcon,
} from "../components/icons";
import { HELP_CATEGORIES, HELP_OPTION_LABEL, OTHER_CONTRIBUTION_ID, STATUSES } from "../config";
import type { Volunteer, VolunteerStatus } from "../types";
import ResponseCard from "./ResponseCard";
import { downloadCsv } from "./csv";
import { signOut, useResponses } from "./data";
import { categoriesOf, legacyLabels } from "./helpSummary";

type StatusFilter = "ALL" | VolunteerStatus;
type Toast = { kind: "ok" | "error"; text: string } | null;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const NO_ROWS: Volunteer[] = [];

export default function Responses({ user }: { user: User }) {
  const state = useResponses(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [interest, setInterest] = useState("ALL");
  const [toast, setToast] = useState<Toast>(null);
  // "Last 7 days" is measured from when the page was opened.
  const [openedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const rows = state.kind === "ready" ? state.rows : NO_ROWS;

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = { ALL: rows.length };
    for (const s of STATUSES) byStatus[s.id] = 0;
    for (const row of rows) byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    return byStatus;
  }, [rows]);

  const thisWeek = useMemo(() => {
    const cutoff = openedAt - WEEK_MS;
    return rows.filter((row) => row.createdAt && row.createdAt.getTime() >= cutoff).length;
  }, [rows, openedAt]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "ALL" && row.status !== status) return false;
      if (interest === OTHER_CONTRIBUTION_ID) {
        if (!row.otherContribution) return false;
      } else if (interest !== "ALL" && !categoriesOf(row).has(interest)) {
        return false;
      }
      if (!q) return true;
      return [
        row.fullName,
        row.email,
        row.phone,
        row.city ?? "",
        row.message ?? "",
        row.note ?? "",
        row.digitalSpecifics ?? "",
        row.techSpecifics ?? "",
        row.otherContribution ?? "",
        ...row.helpWith.map((id) => HELP_OPTION_LABEL[id] ?? id),
        ...legacyLabels(row),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, status, interest]);

  const filtersActive = search.trim() !== "" || status !== "ALL" || interest !== "ALL";

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
    setInterest("ALL");
  }

  async function copyText(text: string, success: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ kind: "ok", text: success });
    } catch {
      setToast({ kind: "error", text: `Couldn't copy automatically: ${text}` });
    }
  }

  const copyFormLink = () =>
    copyText(`${window.location.origin}/`, "Form link copied — paste it anywhere to share.");

  return (
    <div className="ad">
      <header className="ad__bar">
        <div className="ad__bar-inner">
          <Brand size="sm" href="/admin" />
          <div className="ad__bar-actions">
            <a className="btn btn--quiet" href="/" target="_blank" rel="noopener">
              <ArrowUpRightIcon />
              <span className="ad__hide-sm">Open form</span>
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => downloadCsv(filtered)}
              disabled={filtered.length === 0}
              title={
                filtersActive
                  ? "Download the responses matching your filters"
                  : "Download all responses"
              }
            >
              <DownloadIcon />
              <span className="ad__hide-sm">Export CSV</span>
            </button>
            <button
              type="button"
              className="btn btn--quiet btn--icon"
              onClick={() => void signOut()}
              aria-label={`Sign out ${user.email ?? ""}`}
              title={`Signed in as ${user.email ?? "team member"} — sign out`}
            >
              <LogOutIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="ad__main">
        <div className="ad__head">
          <h1 className="ad__title">Volunteer responses</h1>
          <p className="ad__subtitle">New submissions appear here automatically.</p>
        </div>

        {state.kind === "denied" ? (
          <div className="ad__state">
            <AlertIcon />
            <h2>This account isn't on the team yet</h2>
            <p>
              You're signed in as <strong>{user.email}</strong>, but this account hasn't
              been added as a team member, so it can't see responses.
            </p>
            <ol className="ad__steps">
              <li>
                Open the Firebase console → <strong>Firestore Database</strong>.
              </li>
              <li>
                In the <strong>admins</strong> collection, add a document whose ID is this
                account's ID:
                <span className="ad__uid">
                  <code>{user.uid}</code>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => void copyText(user.uid, "Account ID copied.")}
                  >
                    Copy
                  </button>
                </span>
              </li>
              <li>Reload this page.</li>
            </ol>
            <button type="button" className="btn btn--quiet" onClick={() => void signOut()}>
              Sign in with a different account
            </button>
          </div>
        ) : state.kind === "error" ? (
          <div className="ad__state">
            <AlertIcon />
            <h2>Couldn't load responses</h2>
            <p>Please check your connection and reload the page.</p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        ) : (
          <>
            <section className="ad__stats" aria-label="Summary">
              <Stat label="Total responses" value={state.kind === "ready" ? counts.ALL : null} />
              <Stat label="New — not contacted" value={state.kind === "ready" ? counts.NEW : null} accent />
              <Stat label="In the last 7 days" value={state.kind === "ready" ? thisWeek : null} />
            </section>

            <div className="ad__toolbar">
              <label className="ad__search">
                <span className="sr-only">Search responses</span>
                <SearchIcon />
                <input
                  className="input"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone, email, city…"
                  enterKeyHint="search"
                />
              </label>
              <label className="ad__filter">
                <span className="sr-only">Filter by how they'd like to help</span>
                <select
                  className="select"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                >
                  <option value="ALL">All areas</option>
                  {HELP_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                  <option value={OTHER_CONTRIBUTION_ID}>Other ways to contribute</option>
                </select>
              </label>
            </div>

            <div className="ad__tabs" role="group" aria-label="Filter by status">
              {(["ALL", ...STATUSES.map((s) => s.id)] as StatusFilter[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className="ad__tab"
                  aria-pressed={status === id}
                  onClick={() => setStatus(id)}
                >
                  {id === "ALL" ? "All" : STATUSES.find((s) => s.id === id)?.label}
                  <span className="ad__tab-count">{counts[id] ?? 0}</span>
                </button>
              ))}
            </div>

            {state.kind === "loading" ? (
              <div className="ad__grid" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rc rc--skeleton" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="ad__state">
                <InboxIcon />
                <h2>No responses yet</h2>
                <p>When someone fills in the volunteer form, they'll show up here straight away.</p>
                <button type="button" className="btn btn--primary" onClick={copyFormLink}>
                  <LinkIcon /> Copy form link
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ad__state">
                <SearchIcon />
                <h2>Nothing matches</h2>
                <p>Try a different search, or clear the filters.</p>
                <button type="button" className="btn btn--ghost" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                {filtersActive && (
                  <p className="ad__result-count">
                    Showing {filtered.length} of {rows.length}
                    <button type="button" className="ad__clear" onClick={clearFilters}>
                      Clear filters
                    </button>
                  </p>
                )}
                <div className="ad__grid">
                  {filtered.map((row) => (
                    <ResponseCard key={row.id} row={row} onToast={setToast} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {toast && (
        <div
          className={`ad__toast ad__toast--${toast.kind}`}
          role={toast.kind === "error" ? "alert" : "status"}
        >
          {toast.kind === "ok" ? <CheckIcon /> : <AlertIcon />}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | null;
  accent?: boolean;
}) {
  return (
    <div className={`ad__stat${accent ? " ad__stat--accent" : ""}`}>
      <p className="ad__stat-label">{label}</p>
      {value === null ? (
        <span className="ad__stat-skeleton" aria-hidden />
      ) : (
        <p className="ad__stat-value">{value}</p>
      )}
    </div>
  );
}

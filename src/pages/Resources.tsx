import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/Layout";
import { EmptyState, SkeletonRows, formatDate } from "../components/ui";
import { ArrowRight, PlusIcon, ResourcesIcon } from "../components/icons";
import { listResources } from "../data/api";
import type { Resource } from "../types";

export default function Resources() {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [category, setCategory] = useState<string>("ALL");

  useEffect(() => {
    listResources().then(setResources);
  }, []);

  const categories = useMemo(() => {
    if (!resources) return [];
    return Array.from(
      new Set(resources.map((r) => r.category).filter(Boolean) as string[]),
    ).sort();
  }, [resources]);

  const shown = useMemo(() => {
    if (!resources) return null;
    return category === "ALL"
      ? resources
      : resources.filter((r) => r.category === category);
  }, [resources, category]);

  return (
    <>
      <TopBar
        title="Resources"
        subtitle="Handbooks, policies and toolkits for the community."
      />

      <div className="content">
        <section className="card panel">
          <div className="panel__head">
            <h2 className="panel__title">Shared Library</h2>
            <button className="btn btn--primary">
              <PlusIcon /> Add Resource
            </button>
          </div>

          {categories.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "var(--sp-2)",
                padding: "0 var(--sp-6) var(--sp-4)",
                flexWrap: "wrap",
              }}
            >
              {["ALL", ...categories].map((c) => (
                <button
                  key={c}
                  className={`tag tag--${c === category ? "lavender" : "blue"} tag--toggle`}
                  aria-pressed={c === category}
                  onClick={() => setCategory(c)}
                  style={{ padding: "5px 12px" }}
                >
                  {c === "ALL" ? "All" : c}
                </button>
              ))}
            </div>
          )}

          {shown === null ? (
            <SkeletonRows rows={4} />
          ) : shown.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              message="Resources added by coordinators will appear in this library."
            />
          ) : (
            <div>
              {shown.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  className="mobile-list__row"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "var(--sp-4)",
                    padding: "var(--sp-4) var(--sp-6)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <span
                    className="stat__tile"
                    style={{
                      background: "var(--tile-blue)",
                      color: "var(--tag-blue-fg)",
                      width: 38,
                      height: 38,
                      flex: "0 0 38px",
                    }}
                  >
                    <ResourcesIcon />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--sp-3)",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong style={{ fontSize: "var(--text-md)" }}>{r.title}</strong>
                      {r.category && <span className="tag tag--mint">{r.category}</span>}
                    </span>
                    {r.description && (
                      <span
                        style={{
                          display: "block",
                          color: "var(--ink-2)",
                          fontSize: "var(--text-sm)",
                          marginTop: 3,
                        }}
                      >
                        {r.description}
                      </span>
                    )}
                    <span
                      style={{
                        display: "block",
                        color: "var(--ink-3)",
                        fontSize: "var(--text-xs)",
                        marginTop: 5,
                      }}
                    >
                      Added {formatDate(r.createdAt)}
                    </span>
                  </span>
                  <ArrowRight
                    style={{ width: 16, height: 16, color: "var(--ink-3)", marginTop: 10 }}
                  />
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

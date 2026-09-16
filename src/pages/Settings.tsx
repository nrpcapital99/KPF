import { Link } from "react-router-dom";
import { isStaff, useCurrentUser } from "../auth/session";
import { TopBar } from "../components/Layout";
import { Avatar } from "../components/ui";
import {
  ArrowRight,
  UserIcon,
  UsersIcon,
} from "../components/icons";

/**
 * Doubles as the "More" destination in the mobile tab bar, which is why it
 * links out to the sidebar items that don't fit in four tabs.
 */
export default function Settings() {
  const me = useCurrentUser();

  const links = [
    { to: "/profile", label: "My Profile", hint: "Your details and availability", Icon: UserIcon },
    { to: "/people", label: "People Directory", hint: "Everyone in the community", Icon: UsersIcon },
    ...(isStaff(me)
      ? [{ to: "/projects", label: "Projects / Teams", hint: "Current foundation work", Icon: UsersIcon }]
      : []),
  ];

  return (
    <>
      <TopBar title="Settings" subtitle="Your account and foundation preferences." />

      <div className="content">
        <section className="card" style={{ maxWidth: 720, marginBottom: "var(--sp-5)" }}>
          <div className="detail__head">
            <Avatar person={me} size="lg" />
            <div className="detail__ident">
              <div className="detail__name">
                <h2>{me.fullName}</h2>
              </div>
              <p className="detail__role">{me.email}</p>
            </div>
            <Link to="/profile" className="btn btn--ghost">
              Edit profile
            </Link>
          </div>

          <div>
            {links.map(({ to, label, hint, Icon }) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-4)",
                  padding: "var(--sp-4) var(--sp-6)",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span
                  className="stat__tile"
                  style={{
                    background: "var(--surface-alt)",
                    color: "var(--ink-2)",
                    width: 36,
                    height: 36,
                    flex: "0 0 36px",
                  }}
                >
                  <Icon />
                </span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: "block", fontSize: "var(--text-md)" }}>
                    {label}
                  </strong>
                  <span style={{ color: "var(--ink-2)", fontSize: "var(--text-sm)" }}>
                    {hint}
                  </span>
                </span>
                <ArrowRight style={{ width: 16, height: 16, color: "var(--ink-3)" }} />
              </Link>
            ))}
          </div>
        </section>

        <section
          className="card"
          style={{
            maxWidth: 720,
            padding: "var(--sp-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--sp-5)",
            flexWrap: "wrap",
          }}
        >
          <p className="tagline">
            Together<br />we create<br /><span>impact</span>
          </p>
          <p style={{ color: "var(--ink-2)", fontSize: "var(--text-sm)", maxWidth: "36ch" }}>
            Kanak Parakh Foundation participant directory.
            <br />
            Live data is secured by Firebase Authentication and stored in Cloud Firestore.
          </p>
        </section>
      </div>
    </>
  );
}

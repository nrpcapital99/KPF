import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { countPendingRequests, listPendingSignups, signOut } from "../data/api";
import { useCurrentUser, useStore, isStaff } from "../auth/session";
import { Avatar } from "./ui";
import {
  CalendarIcon,
  HandIcon,
  HomeIcon,
  InboxIcon,
  Logo,
  LogOutIcon,
  MenuIcon,
  ProjectsIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from "./icons";

interface NavEntry {
  to: string;
  label: string;
  short?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
  badge?: number;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  COORDINATOR: "Coordinator",
  VOLUNTEER: "Volunteer",
};

/**
 * Navigation is role-driven: staff review requests and open slots, volunteers
 * find work and track what they've signed up for. Nobody sees a link to a page
 * their role can't use.
 */
function useNav(): { primary: NavEntry[]; mobile: NavEntry[] } {
  const me = useCurrentUser();

  if (isStaff(me)) {
    const pendingAccounts = countPendingRequests();
    const pendingSignups = listPendingSignups().length;

    const primary: NavEntry[] = [
      { to: "/", label: "Home", Icon: HomeIcon, end: true },
      {
        to: "/approvals",
        label: "Account Requests",
        short: "Requests",
        Icon: InboxIcon,
        badge: pendingAccounts,
      },
      {
        to: "/slots",
        label: "Volunteering Slots",
        short: "Slots",
        Icon: CalendarIcon,
        badge: pendingSignups,
      },
      { to: "/people", label: "People Directory", short: "People", Icon: UsersIcon },
      { to: "/projects", label: "Projects / Teams", short: "Projects", Icon: ProjectsIcon },
      { to: "/profile", label: "My Profile", Icon: UserIcon },
      { to: "/settings", label: "Settings", Icon: SettingsIcon },
    ];

    return {
      primary,
      mobile: [
        primary[0],
        primary[1],
        primary[2],
        { to: "/settings", label: "More", Icon: MenuIcon },
      ],
    };
  }

  const primary: NavEntry[] = [
    { to: "/", label: "Home", Icon: HomeIcon, end: true },
    { to: "/opportunities", label: "Opportunities", Icon: HandIcon },
    { to: "/commitments", label: "My Commitments", short: "Mine", Icon: CalendarIcon },
    { to: "/people", label: "People Directory", short: "People", Icon: UsersIcon },
    { to: "/profile", label: "My Profile", Icon: UserIcon },
    { to: "/settings", label: "Settings", Icon: SettingsIcon },
  ];

  return {
    primary,
    mobile: [
      primary[0],
      primary[1],
      primary[2],
      { to: "/settings", label: "More", Icon: MenuIcon },
    ],
  };
}

export default function Layout() {
  useStore();
  const me = useCurrentUser();
  const { primary, mobile } = useNav();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Logo className="sidebar__mark" />
          <div>
            <div className="sidebar__wordmark">KANAK PARAKH</div>
            <div className="sidebar__sub" style={{ textAlign: "center" }}>
              FOUNDATION
            </div>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Main">
          {primary.map(({ to, label, Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `navitem${isActive ? " navitem--active" : ""}`
              }
            >
              <Icon />
              <span>{label}</span>
              {badge ? <span className="navitem__badge">{badge}</span> : null}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/profile" className="sidebar__user">
          <Avatar person={me} size="md" />
          <span className="sidebar__user-meta">
            <span className="sidebar__user-name">{me.fullName}</span>
            <span className="sidebar__user-role">
              {ROLE_LABEL[me.role] ?? me.role}
            </span>
          </span>
        </NavLink>
      </aside>

      <div className="main">
        <MobileTopBar />
        <Outlet />
      </div>

      <nav className="mobilenav" aria-label="Primary">
        {mobile.map(({ to, label, short, Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mobilenav__item${isActive ? " mobilenav__item--active" : ""}`
            }
          >
            <span style={{ position: "relative" }}>
              <Icon />
              {badge ? (
                <span
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -7,
                    minWidth: 15,
                    height: 15,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: "var(--red)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {badge}
                </span>
              ) : null}
            </span>
            <span>{short ?? label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function MobileTopBar() {
  const me = useCurrentUser();
  const navigate = useNavigate();
  return (
    <header className="mobile-topbar">
      <div className="mobile-topbar__brand">
        <Logo />
        <span className="mobile-topbar__wordmark">KANAK PARAKH</span>
      </div>
      <div className="mobile-topbar__actions">
        <button
          className="bell"
          aria-label="Sign out"
          title="Sign out"
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
        >
          <LogOutIcon />
        </button>
        <NavLink to="/profile" aria-label="My profile">
          <Avatar person={me} size="sm" />
        </NavLink>
      </div>
    </header>
  );
}

export function TopBar({
  title,
  subtitle,
  search,
  onSearch,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  search?: string;
  onSearch?: (value: string) => void;
  children?: ReactNode;
}) {
  const me = useCurrentUser();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar__greeting">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar__actions">
        {onSearch && (
          <div className="search">
            <SearchIcon />
            <input
              type="search"
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search by name, expertise, or keyword..."
              aria-label="Search"
            />
          </div>
        )}
        {children}
        <button
          className="bell"
          aria-label="Sign out"
          title="Sign out"
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
        >
          <LogOutIcon />
        </button>
        <button onClick={() => navigate("/profile")} aria-label="My profile">
          <Avatar person={me} size="md" />
        </button>
      </div>
    </header>
  );
}

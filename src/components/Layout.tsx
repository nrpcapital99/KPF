import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getCurrentUser } from "../data/api";
import { Avatar } from "./ui";
import {
  BellIcon,
  ChevronDown,
  HomeIcon,
  Logo,
  MenuIcon,
  ProjectsIcon,
  ResourcesIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from "./icons";

const NAV = [
  { to: "/", label: "Home", Icon: HomeIcon, end: true },
  { to: "/people", label: "People Directory", Icon: UsersIcon },
  { to: "/profile", label: "My Profile", Icon: UserIcon },
  { to: "/projects", label: "Projects / Teams", Icon: ProjectsIcon },
  { to: "/resources", label: "Resources", Icon: ResourcesIcon },
  { to: "/settings", label: "Settings", Icon: SettingsIcon },
];

/** Bottom tab bar on phones — the four primary destinations plus More. */
const MOBILE_NAV = [
  { to: "/", label: "Home", Icon: HomeIcon, end: true },
  { to: "/people", label: "People", Icon: UsersIcon },
  { to: "/projects", label: "Projects", Icon: ProjectsIcon },
  { to: "/settings", label: "More", Icon: MenuIcon },
];

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  COORDINATOR: "Coordinator",
  PARTICIPANT: "Participant",
};

export default function Layout() {
  const me = getCurrentUser();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Logo className="sidebar__mark" />
          <div>
            <div className="sidebar__wordmark">
              KANAK PARAKH
            </div>
            <div className="sidebar__sub" style={{ textAlign: "center" }}>
              FOUNDATION
            </div>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Main">
          {NAV.map(({ to, label, Icon, end }) => (
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
          <ChevronDown className="sidebar__user-caret" />
        </NavLink>
      </aside>

      <div className="main">
        <MobileTopBar />
        <Outlet />
      </div>

      <nav className="mobilenav" aria-label="Primary">
        {MOBILE_NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mobilenav__item${isActive ? " mobilenav__item--active" : ""}`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function MobileTopBar() {
  const me = getCurrentUser();
  return (
    <header className="mobile-topbar">
      <div className="mobile-topbar__brand">
        <Logo />
        <span className="mobile-topbar__wordmark">KANAK PARAKH</span>
      </div>
      <div className="mobile-topbar__actions">
        <button className="bell" aria-label="Notifications">
          <BellIcon />
          <span className="bell__dot" />
        </button>
        <NavLink to="/profile" aria-label="My profile">
          <Avatar person={me} size="sm" />
        </NavLink>
      </div>
    </header>
  );
}

/**
 * Page header. On desktop it carries search, notifications and the avatar;
 * on phones those move to MobileTopBar and only the greeting remains.
 */
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
  const me = getCurrentUser();
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
        <button className="bell" aria-label="Notifications">
          <BellIcon />
          <span className="bell__dot" />
        </button>
        <button onClick={() => navigate("/profile")} aria-label="My profile">
          <Avatar person={me} size="md" />
        </button>
      </div>
    </header>
  );
}

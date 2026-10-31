import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ChevronRight, FileText, LayoutDashboard, LogOut, Menu, MessagesSquare, ShieldCheck, Users, Workflow } from "lucide-react";
import { useAuth } from "../auth";
import { Avatar, Monogram, ThemeToggle } from "../ui";

const MAIN_NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/ask", label: "Ask the advisors", icon: MessagesSquare },
  { to: "/documents", label: "Documents", icon: FileText },
];
const ADMIN_NAV = [
  { to: "/admin/automations", label: "Automations", icon: Workflow },
  { to: "/admin/users", label: "Users & roles", icon: Users },
  { to: "/admin/audit", label: "Audit log", icon: ShieldCheck },
];
const PAGES = {
  "/": ["Workspace", "Overview"],
  "/ask": ["Workspace", "Ask the advisors"],
  "/documents": ["Workspace", "Documents"],
  "/admin/automations": ["Administration", "Automations"],
  "/admin/users": ["Administration", "Users & roles"],
  "/admin/audit": ["Administration", "Audit log"],
};

function NavItems({ items }) {
  return items.map(({ to, label, icon: Icon, end }) => (
    <NavLink key={to} to={to} end={end} className="nav-link">
      <Icon /> {label}
    </NavLink>
  ));
}

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [thread, setThread] = useState([]); // advisor conversation, kept while navigating, gone on sign-out
  const location = useLocation();
  const [section, page] = PAGES[location.pathname] || ["Workspace", ""];

  useEffect(() => setNavOpen(false), [location.pathname]);

  return (
    <div className={`shell${navOpen ? " nav-open" : ""}`}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand">
          <Monogram />
          <div>
            <div className="brand-name">Executive Advisory</div>
            <div className="brand-sub">AI advisory suite</div>
          </div>
        </div>

        <div className="nav-label eyebrow">Workspace</div>
        <NavItems items={MAIN_NAV} />
        {isAdmin && (
          <>
            <div className="nav-label eyebrow">Administration</div>
            <NavItems items={ADMIN_NAV} />
          </>
        )}

        <div className="sidebar-foot">
          <p className="phase-note"><b>Prototype, phase 1.</b> Static AI answers and a JSON store; access rules are already enforced by the API.</p>
          <div className="user-card">
            <Avatar name={user.name} />
            <div className="who">
              <div className="name">{user.name}</div>
              <div className="role">{isAdmin ? "Administrator" : "Standard user"}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut /></button>
          </div>
        </div>
      </aside>
      <div className="scrim" onClick={() => setNavOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon menu-btn" onClick={() => setNavOpen(true)} aria-label="Open menu"><Menu /></button>
          <nav className="crumbs" aria-label="Breadcrumb">
            <span className="crumb-root">{section}</span>
            <ChevronRight className="crumb-root" />
            <b>{page}</b>
          </nav>
          <div className="topbar-right">
            <span className={`badge ${isAdmin ? "badge-admin" : ""} hide-sm`}>{isAdmin ? "Administrator" : "Standard user"}</span>
            <ThemeToggle />
          </div>
        </header>
        <Outlet context={{ thread, setThread }} />
      </div>
    </div>
  );
}

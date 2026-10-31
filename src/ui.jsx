import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Briefcase, Globe, LoaderCircle, Lock, Moon, Sun, TrendingUp, X } from "lucide-react";
import { api } from "./api";

// ---------------------------------------------------------------- shared lookups
export const ADVISORS = {
  finance: { label: "Finance Advisor", short: "Finance", icon: TrendingUp, tone: "finance" },
  hr: { label: "HR & Management Advisor", short: "HR & Management", icon: Briefcase, tone: "hr" },
  knowledge: { label: "Knowledge Assistant", short: "Knowledge", icon: BookOpen, tone: "knowledge" },
};

export const CATEGORIES = { finance: "Finance", hr: "HR", management: "Management", general: "General" };

// ---------------------------------------------------------------- formatting
export function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(iso, withTime = false) {
  if (!iso) return "-";
  const options = withTime
    ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" };
  return new Date(iso).toLocaleString(undefined, options);
}

export function timeAgo(iso) {
  if (!iso) return "never";
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
  return `${Math.round(seconds / 86400)} d ago`;
}

// ---------------------------------------------------------------- hooks
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    return api(path)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
  }, [path]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { ...state, reload };
}

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");
  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.classList.add("theme-anim"); // colours fade only during the switch, not on every page load
    root.dataset.theme = next;
    window.setTimeout(() => root.classList.remove("theme-anim"), 400);
    try {
      localStorage.setItem("aea-theme", next);
    } catch {
      // storage can be blocked; the theme still changes for this visit
    }
    setTheme(next);
  }, []);
  return [theme, toggle];
}

// ---------------------------------------------------------------- small components
export const Spinner = ({ size = 16 }) => <LoaderCircle className="spin" width={size} height={size} />;

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const dark = theme === "dark";
  return (
    <button type="button" className="theme-switch" onClick={toggle} aria-pressed={dark}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}>
      <Sun className="track-icon sun" />
      <Moon className="track-icon moon" />
      <span className="knob">{dark ? <Moon /> : <Sun />}</span>
    </button>
  );
}

export function Monogram({ letter = "E" }) {
  return <span className="monogram" aria-hidden="true">{letter}</span>;
}

export function Avatar({ name, large }) {
  return <span className={`avatar${large ? " avatar-lg" : ""}`} aria-hidden="true">{initials(name)}</span>;
}

export function AccessBadge({ classification }) {
  return classification === "confidential" ? (
    <span className="badge badge-confidential"><Lock /> Confidential</span>
  ) : (
    <span className="badge badge-general"><Globe /> General</span>
  );
}

export function CategoryBadge({ category }) {
  const tone = category === "finance" ? "finance" : category === "hr" ? "hr" : category === "management" ? "knowledge" : "";
  return <span className={`badge ${tone ? `badge-${tone}` : ""}`}>{CATEGORIES[category] || category}</span>;
}

export function RoleBadge({ role }) {
  return role === "admin" ? <span className="badge badge-admin">Administrator</span> : <span className="badge">Standard user</span>;
}

export function AdvisorBadge({ advisor }) {
  const a = ADVISORS[advisor];
  if (!a) return null;
  const Icon = a.icon;
  return <span className={`badge badge-${a.tone}`}><Icon /> {a.short}</span>;
}

export function FileIcon({ ext }) {
  return <span className={`file-icon file-${ext}`}>{(ext || "").toUpperCase()}</span>;
}

export function PageHead({ eyebrow, title, sub, children }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {children && <div className="row">{children}</div>}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="empty">
      {Icon && <span className="empty-icon"><Icon width={20} height={20} /></span>}
      <div className="empty-title">{title}</div>
      {text && <div className="small">{text}</div>}
      {children}
    </div>
  );
}

export function Skeleton({ rows = 4 }) {
  return (
    <div className="stack" style={{ padding: 22, gap: 14 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} style={wide ? { maxWidth: 640 } : undefined}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="muted small" style={{ marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

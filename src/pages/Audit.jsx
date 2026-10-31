import { useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Empty, PageHead, Skeleton, formatDate, useApi } from "../ui";

const GROUPS = [
  { id: "all", label: "All events" },
  { id: "security", label: "Security" },
  { id: "auth", label: "Sign-ins" },
  { id: "documents", label: "Documents" },
  { id: "ai", label: "AI questions" },
  { id: "users", label: "Users" },
];

const EVENTS = {
  login_success: ["Signed in", ""], logout: ["Signed out", ""],
  login_failed: ["Failed sign-in", "warning"], login_locked: ["Account locked", "danger"], login_blocked: ["Disabled account", "danger"],
  access_denied: ["Access denied", "danger"], csrf_rejected: ["CSRF check failed", "danger"],
  ai_access_filtered: ["AI answer withheld", "danger"], prompt_injection_flagged: ["Prompt injection flagged", "danger"],
  agent_query: ["AI question", "knowledge"], agent_error: ["AI service error", "warning"],
  document_uploaded: ["Document uploaded", "success"], document_downloaded: ["Document downloaded", ""],
  document_updated: ["Document updated", "primary"], document_deleted: ["Document deleted", "warning"],
  automation_completed: ["Automation completed", "success"], automation_failed: ["Automation failed", "danger"],
  user_created: ["User created", "primary"], user_updated: ["User updated", "primary"],
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Details({ detail }) {
  const entries = Object.entries(detail || {});
  if (!entries.length) return <span className="muted">-</span>;
  return (
    <div className="kv">
      {entries.map(([k, v]) => {
        const text = typeof v === "object" ? JSON.stringify(v) : String(v);
        return (
          <span key={k}>{k.replace(/_/g, " ")}: <code title={text}>{UUID.test(text) ? `${text.slice(0, 8)}…` : text}</code></span>
        );
      })}
    </div>
  );
}

export default function Audit() {
  const [group, setGroup] = useState("all");
  const { data: rows, loading, reload } = useApi(`/admin/audit?group=${group}`);

  return (
    <div className="page">
      <PageHead eyebrow="Administration · security" title="Audit log" sub="Sign-ins, blocked requests, document changes and AI questions. Blocked attempts are recorded even when the user only sees 'not found'.">
        <button className="btn" onClick={reload}><RefreshCw /> Refresh</button>
      </PageHead>
      <section className="card">
        <div className="filters">
          <div className="segmented">
            {GROUPS.map((g) => (
              <button key={g.id} className={group === g.id ? "on" : ""} onClick={() => setGroup(g.id)}>{g.label}</button>
            ))}
          </div>
        </div>
        {loading && !rows && <Skeleton rows={8} />}
        {rows && rows.length === 0 && <Empty icon={ShieldCheck} title="No events in this group yet" />}
        {rows && rows.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Time</th><th>Event</th><th>User</th><th className="hide-sm">IP</th><th>Details</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const [label, tone] = EVENTS[r.event] || [r.event, ""];
                  return (
                    <tr key={r.id}>
                      <td className="nowrap small">{formatDate(r.at, true)}</td>
                      <td><span className={`badge ${tone ? `badge-${tone}` : ""}`}>{label}</span></td>
                      <td className="small">{r.user_email || <span className="muted">system</span>}</td>
                      <td className="hide-sm small muted">{r.ip}</td>
                      <td><Details detail={r.detail} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

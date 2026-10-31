import { Link } from "react-router-dom";
import { Activity, ArrowRight, Cpu, Database, FileText, Lock, MessagesSquare, ShieldAlert, Sparkles, Upload, Users, Workflow } from "lucide-react";
import { useAuth } from "../auth";
import { AccessBadge, AdvisorBadge, Empty, FileIcon, Skeleton, timeAgo, useApi } from "../ui";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Stat({ label, value, sub, icon: Icon, tone }) {
  return (
    <div className="card stat" style={{ "--stat-line": `var(--${tone === "primary" ? "accent" : tone})` }}>
      <div className="stat-top">
        <span className="eyebrow">{label}</span>
        <span className={`stat-icon tone-${tone}`}><Icon /></span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

const EVENT_LABELS = {
  login_failed: "Failed sign-in", login_locked: "Account locked", login_blocked: "Disabled account sign-in",
  access_denied: "Access denied", csrf_rejected: "CSRF check failed", ai_access_filtered: "AI answer withheld",
  prompt_injection_flagged: "Prompt injection flagged",
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { data, loading, error } = useApi("/dashboard");
  const firstName = user.name.split(" ")[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="page">
      <section className="greeting">
        <div>
          <span className="eyebrow">{today}</span>
          <h1>{greeting()}, <em>{firstName}</em>.</h1>
          <p>{isAdmin ? "Every document, user and security event in one place." : "Ask the advisors about the documents shared with you."}</p>
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <Link to="/documents?upload=1" className="btn"><Upload /> Upload document</Link>
          <Link to="/ask" className="btn btn-primary"><Sparkles /> Ask the advisors</Link>
        </div>
      </section>

      {loading && !data && <div className="card"><Skeleton rows={5} /></div>}
      {error && <div className="callout callout-danger"><ShieldAlert /><span>{error.message}</span></div>}

      {data && (
        <div className="stack" style={{ gap: 20 }}>
          <div className="stats">
            {isAdmin ? (
              <>
                <Stat label="Documents" value={data.documents.visible} sub={`${data.documents.confidential} confidential`} icon={FileText} tone="primary" />
                <Stat label="AI questions" value={data.questions.total} sub={`${data.questions.today} today`} icon={MessagesSquare} tone="knowledge" />
                <Stat label="Users" value={data.users.total} sub={`${plural(data.users.admins, "administrator")} · ${data.users.active} active`} icon={Users} tone="finance" />
                <Stat label="Security · 24 h" value={data.security.events_24h}
                      sub={`${plural(data.security.failed_logins_24h, "failed sign-in")} · ${data.security.denied_24h} blocked`}
                      icon={ShieldAlert} tone={data.security.events_24h ? "danger" : "success"} />
              </>
            ) : (
              <>
                <Stat label="Your documents" value={data.documents.visible} sub="General access" icon={FileText} tone="primary" />
                <Stat label="My questions" value={data.questions.mine} sub={`${data.questions.mine_today} today`} icon={MessagesSquare} tone="knowledge" />
                <Stat label="My uploads" value={data.documents.my_uploads} sub="Shared with all staff" icon={Upload} tone="finance" />
                <Stat label="Advisors" value={3} sub="Finance · HR & Management · Knowledge" icon={Sparkles} tone="hr" />
              </>
            )}
          </div>

          <div className="grid-2">
            <section className="card">
              <div className="card-head">
                <span className="card-title"><MessagesSquare /> Recent questions</span>
                <Link to="/ask" className="btn btn-ghost btn-sm">Ask <ArrowRight /></Link>
              </div>
              {data.recent_questions.length ? (
                <div className="list">
                  {data.recent_questions.map((q) => (
                    <div className="list-item" key={q.id}>
                      <div className="list-main">
                        <div className="list-title">{q.question}</div>
                        <div className="list-meta">{timeAgo(q.at)} · {q.status === "answered" ? "Answered with sources" : "Insufficient evidence"}</div>
                      </div>
                      <AdvisorBadge advisor={q.advisor} />
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon={MessagesSquare} title="No questions yet" text="Ask about revenue, budgets, leave or any policy in the library." />
              )}
            </section>

            {isAdmin ? (
              <section className="card">
                <div className="card-head">
                  <span className="card-title"><Activity /> Security activity</span>
                  <Link to="/admin/audit" className="btn btn-ghost btn-sm">Audit log <ArrowRight /></Link>
                </div>
                {data.security.recent.length ? (
                  <div className="list">
                    {data.security.recent.map((r) => (
                      <div className="list-item" key={r.id}>
                        <span className="event-icon tone-danger"><ShieldAlert /></span>
                        <div className="list-main">
                          <div className="list-title">{EVENT_LABELS[r.event] || r.event}</div>
                          <div className="list-meta">{r.user_email || "unknown user"} · {timeAgo(r.at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty icon={ShieldAlert} title="All quiet" text="No failed sign-ins or blocked requests in the last 24 hours." />
                )}
              </section>
            ) : (
              <RecentDocuments docs={data.recent_documents} />
            )}
          </div>

          {isAdmin && (
            <div className="grid-2">
              <section className="card">
                <div className="card-head">
                  <span className="card-title"><Workflow /> Automation runs</span>
                  <Link to="/admin/automations" className="btn btn-ghost btn-sm">All runs <ArrowRight /></Link>
                </div>
                <div className="list">
                  {data.recent_runs.map((r) => (
                    <div className="list-item" key={r.id}>
                      <div className="list-main">
                        <div className="list-title">{r.document_title}</div>
                        <div className="list-meta">{r.triggered_by_name} · {timeAgo(r.started_at)}</div>
                      </div>
                      <span className={`badge badge-${r.status === "completed" ? "success" : r.status === "failed" ? "danger" : "primary"}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </section>
              <RecentDocuments docs={data.recent_documents} />
            </div>
          )}

          <section className="card status-strip" aria-label="System status">
            <span><i className="dot" /> <b>API</b> online</span>
            <span><Cpu /> <b>AI engine</b> {data.system.engine}</span>
            <span><Database /> <b>Store</b> {data.system.store}</span>
            <span><Lock /> <b>Files at rest</b> {data.system.encryption}</span>
            <span><Users /> <b>Your access</b> {data.system.role}, {data.system.searchable_documents} documents</span>
          </section>
        </div>
      )}
    </div>
  );
}

function RecentDocuments({ docs }) {
  return (
    <section className="card">
      <div className="card-head">
        <span className="card-title"><FileText /> Recently added</span>
        <Link to="/documents" className="btn btn-ghost btn-sm">Library <ArrowRight /></Link>
      </div>
      <div className="list">
        {docs.map((d) => (
          <div className="list-item" key={d.id}>
            <FileIcon ext={d.extension} />
            <div className="list-main">
              <div className="list-title">{d.title}</div>
              <div className="list-meta">{d.uploaded_by_name} · {timeAgo(d.created_at)}</div>
            </div>
            <AccessBadge classification={d.classification} />
          </div>
        ))}
      </div>
    </section>
  );
}

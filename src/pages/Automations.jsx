import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw, Workflow } from "lucide-react";
import { RunSteps } from "../components/UploadModal";
import { Empty, PageHead, Skeleton, formatDate, timeAgo, useApi } from "../ui";

function duration(run) {
  if (!run.finished_at) return "running";
  const seconds = (new Date(run.finished_at) - new Date(run.started_at)) / 1000;
  return seconds < 1 ? "under 1 s" : `${Math.round(seconds)} s`;
}

export default function Automations() {
  const { data: runs, loading, reload } = useApi("/automations");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!runs?.some((r) => r.status === "running")) return undefined;
    const timer = setTimeout(reload, 1500);
    return () => clearTimeout(timer);
  }, [runs, reload]);

  return (
    <div className="page">
      <PageHead eyebrow="Administration" title="Automations" sub="Every upload runs automatically: store and encrypt, extract text, summarise, record the result and notify administrators.">
        <button className="btn" onClick={reload}><RefreshCw /> Refresh</button>
      </PageHead>
      <section className="card">
        {loading && !runs && <Skeleton rows={6} />}
        {runs && runs.length === 0 && <Empty icon={Workflow} title="No automation runs yet" text="Upload a document to start one." />}
        {runs?.map((r) => (
          <div className="run" key={r.id}>
            <button className="run-head" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
              {open === r.id ? <ChevronDown width={16} /> : <ChevronRight width={16} />}
              <div className="list-main">
                <div className="list-title">{r.document_title}</div>
                <div className="list-meta">Started by {r.triggered_by_name} · {timeAgo(r.started_at)} · {duration(r)}</div>
              </div>
              <span className={`badge badge-${r.status === "completed" ? "success" : r.status === "failed" ? "danger" : "primary"}`}>{r.status}</span>
            </button>
            {open === r.id && (
              <div className="run-body">
                <RunSteps run={r} />
                <div className="stack" style={{ gap: 8 }}>
                  <div className="section-label">Summary</div>
                  <p className="small">{r.summary || "Not ready yet."}</p>
                  {r.error && <p className="small" style={{ color: "var(--danger)" }}>{r.error}</p>}
                  <p className="small muted">Started {formatDate(r.started_at, true)}{r.finished_at ? ` · finished ${formatDate(r.finished_at, true)}` : ""}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

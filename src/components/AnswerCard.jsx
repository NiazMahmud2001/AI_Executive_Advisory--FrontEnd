import { ChevronDown, CircleAlert, CircleCheck, CircleHelp, Info, Lock, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";
import { downloadUrl } from "../api";
import { ADVISORS } from "../ui";

// Source ids such as "[S1]" or "(S1, S2)" sometimes slip into the model's text; the sources are listed separately.
const SOURCE_IDS = /\s*[[(]\s*S\d+(?:\s*[,;]\s*S\d+)*\s*[\])]/g;
const clean = (text) => String(text || "").replace(SOURCE_IDS, "").trim();

// **bold** only; everything else stays plain text, so no HTML from the model is ever rendered.
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part);
}

// Paragraphs and simple "- item" or "1. item" lists from the model's text.
function RichText({ text }) {
  const blocks = [];
  for (const raw of clean(text).split("\n")) {
    const line = raw.trim().replace(/^#+\s*/, "");
    const item = line.match(/^(?:[-*•]|(\d+)[.)])\s+(.+)$/);
    const last = blocks[blocks.length - 1];
    if (!line) blocks.push(null);
    else if (item && last?.type === "list") last.items.push(item[2]);
    else if (item) blocks.push({ type: "list", ordered: Boolean(item[1]), items: [item[2]] });
    else if (last?.type === "p") last.lines.push(line);
    else blocks.push({ type: "p", lines: [line] });
  }
  return blocks.filter(Boolean).map((b, i) => {
    if (b.type === "p") return <p key={i}>{inline(b.lines.join(" "))}</p>;
    const List = b.ordered ? "ol" : "ul";
    return <List key={i} className="msg-list">{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</List>;
  });
}

function engineLabel(engine = "") {
  if (/static/i.test(engine)) return "Static answers";
  const model = engine.split("·").pop().trim();
  return `LangGraph · ${model.split("/").pop().replace(/:free$/, "")}`;
}

const seconds = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);

// One entry per document, numbered in the order the answer cites them.
function groupSources(citations) {
  const groups = [];
  for (const c of citations) {
    let group = groups.find((g) => g.doc_id === c.doc_id);
    if (!group) groups.push((group = { ...c, number: groups.length + 1, locations: [] }));
    if (!group.locations.includes(c.location)) group.locations.push(c.location);
  }
  return groups;
}

function Note({ tone, icon: Icon, title, items, children }) {
  return (
    <div className={`note note-${tone}`}>
      <Icon />
      <div>
        <div className="note-title">{title}</div>
        {items && <ul>{items.map((t) => <li key={t}>{clean(t)}</li>)}</ul>}
        {children}
      </div>
    </div>
  );
}

export function AnswerPending() {
  return (
    <div className="msg msg-pending" aria-live="polite">
      <span className="dots"><i /><i /><i /></span> Reading your documents
    </div>
  );
}

export function AnswerError({ message, onRetry }) {
  return (
    <div className="msg">
      <Note tone="danger" icon={CircleAlert} title="The advisor could not answer">
        <p>{message}</p>
        <button className="btn btn-sm" onClick={onRetry}><RefreshCw /> Try again</button>
      </Note>
    </div>
  );
}

export default function AnswerCard({ answer }) {
  const advisor = ADVISORS[answer.advisor];
  const Icon = advisor.icon;
  const answered = answer.status === "answered";
  const sources = groupSources(answer.citations);
  const quotes = answer.citations.map((c) => ({ ...c, number: sources.find((s) => s.doc_id === c.doc_id).number }));
  const routed = answer.routing.mode === "manual" ? "Chosen by you" : "Auto-routed";
  const routeTip = [answer.routing.reason, answer.routing.matched.length ? `(${answer.routing.matched.join(", ")})` : ""].join(" ").trim();

  return (
    <article className="msg">
      <header className="msg-head">
        <span className={`advisor-icon tone-${advisor.tone}`}><Icon /></span>
        <span className="msg-who">{advisor.label}</span>
        <span className="msg-route" title={routeTip}>{routed}</span>
        <span className={`msg-status ${answered ? "ok" : "warn"}`}>
          {answered ? <CircleCheck /> : <CircleHelp />} {answered ? "Cited answer" : "No evidence"}
        </span>
      </header>

      {answer.security_notice && <Note tone="danger" icon={ShieldAlert} title="Instruction override ignored"><p>{answer.security_notice}</p></Note>}

      <div className="msg-text"><RichText text={answer.answer} /></div>

      {answer.calculations.length > 0 && (
        <div className="figures-block">
          <div className="figures">
            {answer.calculations.map((c) => (
              <div className="figure" key={c.label}>
                <span className="figure-value">{c.result}</span>
                <span className="figure-label">{c.label}</span>
              </div>
            ))}
          </div>
          <details className="disclose">
            <summary><ChevronDown /> How these figures were calculated</summary>
            <ul className="calc-lines">
              {answer.calculations.map((c) => (
                <li key={c.label}>
                  <span className="calc-name">{c.label} <b>{c.result}</b></span>
                  <span className="calc-formula">{c.formula}</span>
                  <span className="calc-in">{c.inputs.map((i) => `${i.name} ${i.value}`).join("  ·  ")}</span>
                </li>
              ))}
            </ul>
            <p className="disclose-note">
              {/static/i.test(answer.engine) ? "Sample figures from the static engine." : "Computed in Python from figures in the sources, not by the model."}
            </p>
          </details>
        </div>
      )}

      {answer.conflicts.map((c) => (
        <Note key={c.topic} tone="warn" icon={TriangleAlert} title={`Documents disagree: ${c.topic}`}>
          <ul>{c.positions.map((p) => <li key={p.doc_id}><b>{p.title}:</b> {clean(p.statement)}</li>)}</ul>
          <p className="note-sub">{clean(c.resolution)}</p>
        </Note>
      ))}

      {answer.missing_information.length > 0 && (
        <Note tone="muted" icon={CircleHelp} title="Not covered by the documents" items={answer.missing_information} />
      )}

      {answer.suggestions.length > 0 && <Note tone="info" icon={Info} title="What you can do" items={answer.suggestions} />}

      {sources.length > 0 && (
        <div className="sources">
          <span className="sources-label">Sources</span>
          <div className="source-row">
            {sources.map((s) => (
              <a key={s.doc_id} className="source-chip" href={downloadUrl(s.doc_id)} title={`Download ${s.filename}: ${s.locations.join(", ")}`}>
                <span className="source-num">{s.number}</span>
                <span className="source-title">{s.title}</span>
                {s.classification === "confidential" && <Lock className="source-lock" aria-label="Confidential" />}
                <span className="source-loc">{s.locations[0]}{s.locations.length > 1 ? ` +${s.locations.length - 1}` : ""}</span>
              </a>
            ))}
          </div>
          <details className="disclose">
            <summary><ChevronDown /> Show the quoted passages</summary>
            <ol className="quotes">
              {quotes.map((q, i) => (
                <li key={i}>
                  <span className="source-num">{q.number}</span>
                  <div>
                    <div className="quote-meta">{q.title} · {q.location}</div>
                    <blockquote>{q.snippet}</blockquote>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        </div>
      )}

      <footer className="msg-meta" title={answer.engine}>{engineLabel(answer.engine)} · {seconds(answer.latency_ms)}</footer>
    </article>
  );
}

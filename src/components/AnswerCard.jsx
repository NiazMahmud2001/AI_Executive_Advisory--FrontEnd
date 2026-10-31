import { Calculator, CircleAlert, CircleCheck, CircleHelp, Info, Quote, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";
import { downloadUrl } from "../api";
import { ADVISORS, AccessBadge } from "../ui";

function StatusBadge({ status }) {
  if (status === "answered") return <span className="badge badge-success"><CircleCheck /> Answered with sources</span>;
  return <span className="badge badge-warning"><CircleHelp /> Insufficient evidence</span>;
}

export function AnswerError({ message, onRetry }) {
  return (
    <article className="answer">
      <div className="answer-body">
        <div className="callout callout-danger">
          <CircleAlert />
          <div style={{ flex: 1 }}>
            <div className="callout-title">The advisor could not answer</div>
            <div>{message}</div>
          </div>
          <button className="btn btn-sm" onClick={onRetry}><RefreshCw /> Try again</button>
        </div>
      </div>
    </article>
  );
}

export default function AnswerCard({ answer }) {
  const advisor = ADVISORS[answer.advisor];
  const Icon = advisor.icon;
  const { routing } = answer;
  const staticEngine = answer.engine.toLowerCase().includes("static");

  return (
    <article className="answer">
      <header className="answer-head">
        <span className={`advisor-icon tone-${advisor.tone}`}><Icon /></span>
        <div>
          <div className="who">{answer.advisor_label}</div>
          <div className="route">
            {routing.mode === "auto" ? "Auto-routed: " : ""}{routing.reason}
            {routing.matched.length > 0 && ` (${routing.matched.slice(0, 4).join(", ")})`}
          </div>
        </div>
        <span className="status"><StatusBadge status={answer.status} /></span>
      </header>

      <div className="answer-body">
        {answer.security_notice && (
          <div className="callout callout-danger">
            <ShieldAlert />
            <div><div className="callout-title">Instruction override ignored</div>{answer.security_notice}</div>
          </div>
        )}

        <p className="answer-text">{answer.answer}</p>

        {answer.calculations.length > 0 && (
          <div>
            <div className="section-label">
              <Calculator /> Calculations
              <span className="badge" style={{ textTransform: "none", letterSpacing: 0 }}>{staticEngine ? "static sample" : "computed in code"}</span>
            </div>
            <div className="calcs">
              {answer.calculations.map((c) => (
                <div className="calc-item" key={c.label}>
                  <div className="calc-top">
                    <span className="calc-label">{c.label}</span>
                    <span className="result">{c.result}</span>
                  </div>
                  <div className="formula">{c.formula}</div>
                  <div className="calc-inputs">
                    {c.inputs.map((i) => <span className="chip" key={i.name}>{i.name} <b>{i.value}</b></span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {answer.conflicts.map((c) => (
          <div className="callout callout-warning" key={c.topic}>
            <TriangleAlert />
            <div>
              <div className="callout-title">Conflicting information: {c.topic}</div>
              <div className="positions">
                {c.positions.map((p) => (
                  <div className="position" key={p.doc_id}><b>{p.title}:</b><span>{p.statement}</span></div>
                ))}
              </div>
              <div className="small">{c.resolution}</div>
            </div>
          </div>
        ))}

        {answer.missing_information.length > 0 && (
          <div className="callout callout-muted">
            <CircleHelp />
            <div>
              <div className="callout-title">Missing information</div>
              <ul className="bullets">{answer.missing_information.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          </div>
        )}

        {answer.suggestions.length > 0 && (
          <div className="callout callout-info">
            <Info />
            <div>
              <div className="callout-title">What you can do</div>
              <ul className="bullets">{answer.suggestions.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
        )}

        {answer.citations.length > 0 && (
          <div>
            <div className="section-label"><Quote /> Sources</div>
            <div className="citations">
              {answer.citations.map((c, i) => (
                <div className="citation" key={`${c.doc_id}-${i}`}>
                  <span className="citation-num">{i + 1}</span>
                  <div className="citation-main">
                    <div className="citation-title">
                      <a href={downloadUrl(c.doc_id)} title="Download the source document">{c.title}</a>
                      <AccessBadge classification={c.classification} />
                    </div>
                    <div className="citation-loc">{c.location} · {c.filename}</div>
                    <div className="citation-snippet">"{c.snippet}"</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="answer-foot">
        <span>{answer.engine}</span>
        <span className="num">{answer.latency_ms} ms</span>
      </footer>
    </article>
  );
}

import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ArrowUp, BookOpen, Briefcase, CircleHelp, Compass, Lock, ShieldCheck, Sparkles, Trash2, TrendingUp } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import AnswerCard, { AnswerError, AnswerPending } from "../components/AnswerCard";
import { ADVISORS, useApi } from "../ui";

const MODES = [
  { id: "auto", label: "Auto", icon: Compass },
  { id: "finance", label: "Finance", icon: TrendingUp },
  { id: "hr", label: "HR & Management", icon: Briefcase },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
];

const SUGGESTIONS = [
  { text: "How much did revenue grow in Q3 2026?", icon: TrendingUp, tone: "finance" },
  { text: "Are we over budget this year?", icon: TrendingUp, tone: "finance" },
  { text: "How many days of annual leave do employees get?", icon: Briefcase, tone: "hr" },
  { text: "Who approves a purchase of AED 50,000?", icon: Briefcase, tone: "hr" },
  { text: "What is the CEO's total salary package?", icon: Lock, tone: "danger" },
  { text: "What is the company's parking policy?", icon: CircleHelp, tone: "knowledge" },
];

const ADVISOR_INFO = [
  { id: "finance", text: "Revenue, budgets and costs. Calculations are done in code, then explained." },
  { id: "hr", text: "HR policies and management documents. Flags conflicting or missing information." },
  { id: "knowledge", text: "General questions about any document you can access, always with sources." },
];

export default function Ask() {
  const { thread, setThread } = useOutletContext();
  const { isAdmin } = useAuth();
  const docs = useApi("/documents");
  const [text, setText] = useState("");
  const [mode, setMode] = useState("auto");
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const busy = thread.some((t) => t.state === "pending");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread]);

  async function send(question, advisor = mode, retryId = null) {
    const q = question.trim();
    if (q.length < 3 || busy) return;
    const id = retryId || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item = { id, question: q, advisor, state: "pending" };
    setThread((list) => (retryId ? list.map((t) => (t.id === id ? item : t)) : [...list, item]));
    setText("");
    if (inputRef.current) inputRef.current.style.height = "";
    try {
      const response = await api("/agent/ask", { method: "POST", json: { question: q, advisor } });
      setThread((list) => list.map((t) => (t.id === id ? { ...t, state: "done", response } : t)));
    } catch (err) {
      if (err.status === 401) return; // the app returns to the sign-in page
      setThread((list) => list.map((t) => (t.id === id ? { ...t, state: "error", error: err.message } : t)));
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(text);
    }
  }

  function autosize(e) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    el.style.overflowY = el.scrollHeight > 160 ? "auto" : "hidden";
  }

  return (
    <div className="page">
      <div className="ask">
        <section className="card thread-card">
          <div className="thread">
            <div className="thread-inner">
              {thread.length === 0 ? (
                <div className="welcome">
                  <span className="monogram" aria-hidden="true"><Sparkles width={22} height={22} /></span>
                  <h2>Ask about your company documents</h2>
                  <p className="muted">Every answer comes from the right advisor and cites its sources.</p>
                  <div className="suggestions">
                    {SUGGESTIONS.map(({ text: question, icon: Icon, tone }) => (
                      <button key={question} className="suggestion" onClick={() => send(question, "auto")}>
                        <span className={`suggestion-icon tone-${tone}`}><Icon /></span>
                        <span>{question}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                thread.map((t) => (
                  <div className="turn" key={t.id}>
                    <div className="bubble-q">{t.question}</div>
                    {t.state === "pending" && <AnswerPending />}
                    {t.state === "done" && <AnswerCard answer={t.response} />}
                    {t.state === "error" && <AnswerError message={t.error} onRetry={() => send(t.question, t.advisor, t.id)} />}
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div className="composer">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="segmented" role="radiogroup" aria-label="Advisor">
                {MODES.map(({ id, label, icon: Icon }) => (
                  <button key={id} role="radio" aria-checked={mode === id} className={mode === id ? "on" : ""} onClick={() => setMode(id)}>
                    <Icon /> {label}
                  </button>
                ))}
              </div>
              {thread.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setThread([])} disabled={busy}><Trash2 /> Clear</button>
              )}
            </div>
            <div className="composer-box">
              <label htmlFor="question" className="sr-only">Your question</label>
              <textarea id="question" ref={inputRef} rows={1} maxLength={1000} placeholder="Ask about revenue, budgets, policies..."
                        value={text} onChange={(e) => setText(e.target.value)} onInput={autosize} onKeyDown={onKeyDown} />
              <button className="btn btn-primary btn-icon" onClick={() => send(text)} disabled={busy || text.trim().length < 3} aria-label="Send question">
                <ArrowUp />
              </button>
            </div>
            <div className="composer-hint">
              <span>Enter to send · Shift + Enter for a new line</span>
              <span>{mode === "auto" ? "The best advisor is chosen for you" : `Asking the ${ADVISORS[mode].label}`}</span>
            </div>
          </div>
        </section>

        <aside className="ask-rail">
          <section className="card">
            <div className="card-head"><span className="card-title">Advisors</span></div>
            {ADVISOR_INFO.map(({ id, text: info }) => {
              const a = ADVISORS[id];
              const Icon = a.icon;
              return (
                <div className="advisor-row" key={id}>
                  <span className={`advisor-icon tone-${a.tone}`}><Icon /></span>
                  <div><b>{a.label}</b><span>{info}</span></div>
                </div>
              );
            })}
          </section>
          <section className="card card-pad stack" style={{ gap: 10 }}>
            <span className="card-title">{isAdmin ? <ShieldCheck /> : <Lock />} Your access</span>
            <p className="small muted">
              The advisors search {docs.data ? <b className="num">{docs.data.length}</b> : "the"} documents you can open.{" "}
              {isAdmin ? "As an administrator this includes confidential documents."
                       : "Confidential documents are never used to answer you, and the assistant cannot be talked into it."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

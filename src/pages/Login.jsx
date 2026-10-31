import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CircleAlert, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth";
import { Monogram, Spinner, ThemeToggle } from "../ui";

const FEATURES = [
  { num: "i.", title: "Answers with sources", text: "Every answer cites the documents it comes from, or says plainly when the evidence is missing." },
  { num: "ii.", title: "Specialist advisors", text: "A Finance Advisor and an HR & Management Advisor, chosen automatically for each question." },
  { num: "iii.", title: "Discreet by design", text: "Confidential documents stay with administrators, including through the AI." },
];

export default function Login() {
  const { status, login, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "signedIn") return <Navigate to={location.state?.from || "/"} replace />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <header className="login-top">
        <div className="brand">
          <Monogram />
          <div>
            <div className="brand-name">Executive Advisory</div>
            <div className="brand-sub">AI advisory suite</div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="login-main">
        <section className="login-copy">
          <span className="eyebrow">For leadership teams</span>
          <h1 className="login-title">Counsel, <em>grounded</em> in your own documents.</h1>
          <p className="login-lead">
            Upload reports and policies, ask questions in plain language, and receive cited answers from the right specialist advisor.
          </p>
          <div className="features">
            {FEATURES.map((f) => (
              <div className="feature" key={f.num}>
                <span className="feature-num">{f.num}</span>
                <div><b>{f.title}</b><span>{f.text}</span></div>
              </div>
            ))}
          </div>
        </section>

        <section className="login-card" aria-label="Sign in">
          <h2>Welcome back</h2>
          <p className="muted" style={{ marginTop: 6 }}>Sign in with your company account.</p>

          <form className="login-form" onSubmit={submit} noValidate>
            {(error || notice) && (
              <div className={`callout ${error ? "callout-danger" : "callout-info"}`} role="alert">
                <CircleAlert />
                <span>{error || notice}</span>
              </div>
            )}
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <div className="input-icon">
                <Mail />
                <input id="email" className="input" type="email" autoComplete="username" placeholder="name@company.com"
                       value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="password">Password</label>
              <div className="input-icon">
                <KeyRound />
                <input id="password" className="input" type={showPassword ? "text" : "password"} autoComplete="current-password"
                       placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="btn btn-ghost btn-icon btn-sm reveal" onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-block" disabled={busy || !email || !password}>
              {busy ? <Spinner /> : <>Sign in <ArrowRight /></>}
            </button>
          </form>

          <div className="secure-note">
            <ShieldCheck />
            <span>Your session is kept in a secure HttpOnly cookie and ends after 30 minutes of inactivity. Demo accounts are listed in the project README.</span>
          </div>
        </section>
      </main>

      <footer className="login-foot">Prototype for the Personal AI &amp; Digital Operations Executive assessment · synthetic data only</footer>
    </div>
  );
}

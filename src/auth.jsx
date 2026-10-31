import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { api, setCsrfToken, setSessionExpiredHandler } from "./api";

// ---------------------------------------------------------------- session
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", user: null, notice: "" });

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setCsrfToken("");
      setState({ status: "signedOut", user: null, notice: "Your session has expired. Please sign in again." });
    });
    api("/auth/me").then((data) => {
        setCsrfToken(data.csrf_token);
        setState({ status: "signedIn", user: data.user, notice: "" });
      })
      .catch(() => setState({ status: "signedOut", user: null, notice: "" }));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api("/auth/login", { method: "POST", json: { email, password } });
    setCsrfToken(data.csrf_token);
    setState({ status: "signedIn", user: data.user, notice: "" });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // the session may already be gone; signing out locally is still correct
    }
    setCsrfToken("");
    setState({ status: "signedOut", user: null, notice: "You have been signed out." });
  }, []);

  const value = useMemo(
    () => ({ ...state, isAdmin: state.user?.role === "admin", login, logout }),
    [state, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// ---------------------------------------------------------------- toasts
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((kind, text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, kind, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4200);
  }, []);

  const toast = useMemo(() => ({ success: (t) => push("success", t), error: (t) => push("error", t) }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.kind === "success" ? <CircleCheck /> : <CircleAlert />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

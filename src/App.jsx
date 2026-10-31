import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "./auth";
import { Empty, Spinner } from "./ui";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ask from "./pages/Ask";
import Documents from "./pages/Documents";
import Automations from "./pages/Automations";
import Users from "./pages/Users";
import Audit from "./pages/Audit";

function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <div className="full-center"><Spinner size={22} /></div>;
  if (status !== "signedIn") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

// The UI hides admin pages from standard users; the API enforces the same rule on every request.
function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return (
      <div className="page">
        <div className="card">
          <Empty icon={ShieldAlert} title="Administrator access required"
                 text="This page is only available to administrators. Ask an administrator if you need access." />
        </div>
      </div>
    );
  }
  return children;
}

function NotFound() {
  return (
    <div className="page">
      <div className="card"><Empty title="Page not found" text="The page you are looking for does not exist." /></div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="ask" element={<Ask />} />
        <Route path="documents" element={<Documents />} />
        <Route path="admin/automations" element={<RequireAdmin><Automations /></RequireAdmin>} />
        <Route path="admin/users" element={<RequireAdmin><Users /></RequireAdmin>} />
        <Route path="admin/audit" element={<RequireAdmin><Audit /></RequireAdmin>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

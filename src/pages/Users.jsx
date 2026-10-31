import { useState } from "react";
import { CircleX, UserPlus } from "lucide-react";
import { api } from "../api";
import { useAuth, useToast } from "../auth";
import { Avatar, Modal, PageHead, Skeleton, Spinner, timeAgo, useApi } from "../ui";

function NewUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", role: "user", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await api("/admin/users", { method: "POST", json: form });
      onCreated(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add a user" subtitle="They can sign in straight away with this password." onClose={onClose}
           footer={<>
             <button className="btn" onClick={onClose}>Cancel</button>
             <button className="btn btn-primary" form="new-user" disabled={busy}>{busy ? <Spinner /> : <UserPlus />} Add user</button>
           </>}>
      <form id="new-user" className="stack" style={{ gap: 14 }} onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="nu-name">Full name</label>
          <input id="nu-name" className="input" value={form.name} onChange={set("name")} required minLength={2} />
        </div>
        <div className="field">
          <label className="label" htmlFor="nu-email">Email</label>
          <input id="nu-email" className="input" type="email" value={form.email} onChange={set("email")} required />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="nu-role">Role</label>
            <select id="nu-role" className="select" value={form.role} onChange={set("role")}>
              <option value="user">Standard user</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="nu-password">Temporary password</label>
            <input id="nu-password" className="input" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required />
          </div>
        </div>
        <p className="hint">At least 10 characters with letters and numbers. Passwords are stored only as bcrypt hashes.</p>
        {error && <div className="callout callout-danger" role="alert"><CircleX /><span>{error}</span></div>}
      </form>
    </Modal>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const { data: users, loading, reload } = useApi("/admin/users");
  const [adding, setAdding] = useState(false);

  async function update(u, changes, message) {
    try {
      await api(`/admin/users/${u.id}`, { method: "PATCH", json: changes });
      toast.success(message);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="page">
      <PageHead eyebrow="Administration" title="Users & roles" sub="Administrators see every document and manage the workspace. Standard users only see general documents.">
        <button className="btn btn-primary" onClick={() => setAdding(true)}><UserPlus /> Add user</button>
      </PageHead>
      <section className="card">
        {loading && !users && <Skeleton rows={4} />}
        {users && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th className="hide-sm">Last sign-in</th><th /></tr></thead>
              <tbody>
                {users.map((u) => {
                  const self = u.id === me.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="doc-cell" style={{ minWidth: 220 }}>
                          <Avatar name={u.name} />
                          <div><div className="doc-title">{u.name}{self && <span className="muted"> (you)</span>}</div><div className="doc-file">{u.email}</div></div>
                        </div>
                      </td>
                      <td>
                        <select className="select select-sm" value={u.role} disabled={self} aria-label={`Role for ${u.name}`}
                                onChange={(e) => update(u, { role: e.target.value }, `${u.name} is now ${e.target.value === "admin" ? "an administrator" : "a standard user"}. They need to sign in again.`)}>
                          <option value="user">Standard user</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td><span className={`badge ${u.active ? "badge-success" : "badge-danger"}`}>{u.active ? "Active" : "Disabled"}</span></td>
                      <td className="hide-sm muted">{timeAgo(u.last_login_at)}</td>
                      <td>
                        <div className="actions">
                          {!self && (
                            <button className={`btn btn-sm ${u.active ? "btn-danger" : ""}`}
                                    onClick={() => update(u, { active: !u.active }, `${u.name} was ${u.active ? "disabled and signed out" : "enabled"}.`)}>
                              {u.active ? "Disable" : "Enable"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {adding && <NewUserModal onClose={() => setAdding(false)} onCreated={(u) => { setAdding(false); toast.success(`${u.name} was added.`); reload(); }} />}
    </div>
  );
}

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, FileText, Search, Trash2, Upload } from "lucide-react";
import { api, downloadUrl } from "../api";
import { useAuth, useToast } from "../auth";
import UploadModal from "../components/UploadModal";
import { AccessBadge, CATEGORIES, CategoryBadge, Empty, FileIcon, Modal, PageHead, Skeleton, Spinner, formatBytes, formatDate, useApi } from "../ui";

export default function Documents() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data: docs, loading, error, reload } = useApi("/documents");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [access, setAccess] = useState("all");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const uploading = params.get("upload") === "1";

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (docs || []).filter((d) =>
      (category === "all" || d.category === category) &&
      (access === "all" || d.classification === access) &&
      (!q || d.title.toLowerCase().includes(q) || d.filename.toLowerCase().includes(q)));
  }, [docs, query, category, access]);

  async function changeAccess(doc, classification) {
    try {
      await api(`/documents/${doc.id}`, { method: "PATCH", json: { classification } });
      toast.success(`"${doc.title}" is now ${classification}.`);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api(`/documents/${toDelete.id}`, { method: "DELETE" });
      toast.success(`"${toDelete.title}" was deleted.`);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page">
      <PageHead eyebrow="Library" title="Documents" sub={docs ? `${docs.length} documents you can access${isAdmin ? ", including confidential ones" : ""}` : "Your document library"}>
        <button className="btn btn-primary" onClick={() => setParams({ upload: "1" })}><Upload /> Upload document</button>
      </PageHead>

      <section className="card">
        <div className="toolbar">
          <div className="input-icon">
            <Search />
            <input className="input" placeholder="Search by title or file name" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search documents" />
          </div>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {Object.entries(CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {isAdmin && (
            <select className="select" value={access} onChange={(e) => setAccess(e.target.value)} aria-label="Filter by access">
              <option value="all">All access levels</option>
              <option value="general">General</option>
              <option value="confidential">Confidential</option>
            </select>
          )}
        </div>

        {loading && !docs && <Skeleton rows={6} />}
        {error && <Empty title="Could not load documents" text={error.message} />}
        {docs && shown.length === 0 && <Empty icon={FileText} title="No documents found" text="Try another search, or upload a document." />}
        {shown.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Document</th><th>Category</th><th>Access</th><th className="hide-sm">Size</th><th className="hide-sm">Added</th><th />
                </tr>
              </thead>
              <tbody>
                {shown.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="doc-cell">
                        <FileIcon ext={d.extension} />
                        <div>
                          <div className="doc-title">{d.title}</div>
                          <div className="doc-file">{d.filename}{d.status === "processing" ? " · processing..." : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td><CategoryBadge category={d.category} /></td>
                    <td>
                      {isAdmin ? (
                        <select className="select select-sm" value={d.classification} onChange={(e) => changeAccess(d, e.target.value)} aria-label={`Access for ${d.title}`}>
                          <option value="general">General</option>
                          <option value="confidential">Confidential</option>
                        </select>
                      ) : (
                        <AccessBadge classification={d.classification} />
                      )}
                    </td>
                    <td className="hide-sm num muted nowrap">{formatBytes(d.size_bytes)}</td>
                    <td className="hide-sm"><div className="nowrap">{formatDate(d.created_at)}</div><div className="small muted nowrap">{d.uploaded_by_name}</div></td>
                    <td>
                      <div className="actions">
                        <a className="btn btn-ghost btn-icon btn-sm" href={downloadUrl(d.id)} title="Download" aria-label={`Download ${d.title}`}><Download /></a>
                        {isAdmin && (
                          <button className="btn btn-ghost btn-icon btn-sm btn-danger" onClick={() => setToDelete(d)} title="Delete" aria-label={`Delete ${d.title}`}><Trash2 /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {uploading && <UploadModal onClose={() => { setParams({}); reload(); }} onUploaded={() => reload()} />}

      {toDelete && (
        <Modal title="Delete document?" subtitle={toDelete.title} onClose={() => setToDelete(null)}
               footer={<>
                 <button className="btn" onClick={() => setToDelete(null)}>Cancel</button>
                 <button className="btn btn-danger-solid" onClick={confirmDelete} disabled={deleting}>{deleting ? <Spinner /> : <Trash2 />} Delete</button>
               </>}>
          <p>The file and its record are removed for everyone. The advisors will no longer use it. This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}

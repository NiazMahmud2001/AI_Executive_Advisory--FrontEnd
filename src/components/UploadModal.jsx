import { useEffect, useRef, useState } from "react";
import { CircleCheck, CircleX, FileUp, Lock, Upload } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { CATEGORIES, FileIcon, Modal, Spinner, formatBytes } from "../ui";

const ACCEPT = ".pdf,.docx,.txt,.md";
const MAX_MB = 10;

export function RunSteps({ run }) {
  return (
    <div className="steps">
      {run.steps.map((s) => (
        <div key={s.key} className={`step ${s.status}`}>
          <span className="step-icon">
            {s.status === "done" ? <CircleCheck /> : s.status === "failed" ? <CircleX /> : s.status === "running" ? <Spinner size={14} /> : <span>•</span>}
          </span>
          <div>
            <div className="step-label">{s.label}</div>
            {s.note && <div className="step-note">{s.note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UploadModal({ onClose, onUploaded }) {
  const { isAdmin } = useAuth();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [classification, setClassification] = useState("general");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState(null);

  function pick(f) {
    setError("");
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPT.split(",").includes(ext)) return setError("Only PDF, Word (.docx) and text (.txt, .md) files are supported.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`The file is larger than ${MAX_MB} MB.`);
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  }

  async function upload() {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("title", title.trim());
    form.append("category", category);
    form.append("classification", classification);
    try {
      const data = await api("/documents", { method: "POST", form });
      setRun(data.run);
      onUploaded(data.document);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Follow the automation run until it finishes.
  useEffect(() => {
    if (!run || run.status !== "running") return undefined;
    const timer = setTimeout(() => api(`/automations/${run.id}`).then(setRun).catch(() => {}), 700);
    return () => clearTimeout(timer);
  }, [run]);

  const finished = run && run.status !== "running";

  return (
    <Modal
      title={run ? "Processing your document" : "Upload a document"}
      subtitle={run ? run.document_title : "PDF, Word or text, up to 10 MB. Files are encrypted when stored."}
      onClose={onClose}
      footer={
        run ? (
          <button className="btn btn-primary" onClick={onClose} disabled={!finished}>{finished ? "Done" : <><Spinner /> Working...</>}</button>
        ) : (
          <>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={upload} disabled={!file || busy || !title.trim()}>
              {busy ? <Spinner /> : <Upload />} Upload
            </button>
          </>
        )
      }
    >
      {run ? (
        <>
          <RunSteps run={run} />
          {run.summary && <div className="callout callout-muted"><FileUp /><div><div className="callout-title">Summary</div>{run.summary}</div></div>}
          {run.status === "failed" && <div className="callout callout-danger"><CircleX /><span>{run.error || "Processing failed."}</span></div>}
        </>
      ) : (
        <>
          {file ? (
            <div className="picked">
              <FileIcon ext={file.name.split(".").pop().toLowerCase()} />
              <div className="list-main">
                <div className="list-title">{file.name}</div>
                <div className="list-meta">{formatBytes(file.size)}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>Change</button>
            </div>
          ) : (
            <div
              className={`dropzone${drag ? " drag" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            >
              <FileUp />
              <b>Drop a file here or click to browse</b>
              <span className="small muted">PDF, DOCX, TXT or MD</span>
            </div>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files[0])} />

          <div className="field">
            <label className="label" htmlFor="doc-title">Title</label>
            <input id="doc-title" className="input" value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
          </div>
          <div className="field-row">
            <div className="field">
              <label className="label" htmlFor="doc-category">Category</label>
              <select id="doc-category" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="doc-access">Access</label>
              <select id="doc-access" className="select" value={classification} onChange={(e) => setClassification(e.target.value)} disabled={!isAdmin}>
                <option value="general">General: all staff</option>
                <option value="confidential">Confidential: administrators</option>
              </select>
            </div>
          </div>
          {!isAdmin && (
            <div className="callout callout-muted"><Lock /><span>Your uploads are shared with all staff. Only administrators can mark a document as confidential.</span></div>
          )}
          {error && <div className="callout callout-danger" role="alert"><CircleX /><span>{error}</span></div>}
        </>
      )}
    </Modal>
  );
}

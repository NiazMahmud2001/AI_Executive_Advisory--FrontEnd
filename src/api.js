// Small fetch wrapper. The session lives in an HttpOnly cookie that JavaScript cannot read;
// the CSRF token is kept in memory only and sent as a header on every request that changes data.
const BASE = import.meta.env.VITE_API_URL || ""; // empty = same origin (Vite proxy in dev, FastAPI in production)

let csrfToken = "";
let onSessionExpired = () => {};

export function setCsrfToken(token) {
  csrfToken = token || "";
}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function messageFrom(data, status) {
  if (data && typeof data.detail === "string") return data.detail;
  if (data && Array.isArray(data.detail)) return data.detail.map((d) => d.msg.replace(/^Value error, /, "")).join(" ");
  if (status === 413) return "The file is too large.";
  return `Request failed (${status}).`;
}

export async function api(path, { method = "GET", json, form } = {}) {
  const headers = {};
  if (method !== "GET") headers["X-CSRF-Token"] = csrfToken;
  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form; // the browser sets the multipart boundary itself
  }

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body, credentials: BASE ? "include" : "same-origin" });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Please check that the API is running.");
  }

  if (res.status === 401 && !path.startsWith("/auth/")) onSessionExpired();
  if (res.status === 204) return null;
  const data = (res.headers.get("content-type") || "").includes("application/json") ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, messageFrom(data, res.status));
  return data;
}

export const downloadUrl = (docId) => `${BASE}/api/documents/${docId}/download`;

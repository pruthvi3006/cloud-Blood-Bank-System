/**
 * API base for axios/fetch. Empty string = same origin (Vite dev server), so /api/* is proxied to the backend.
 * Set VITE_API_URL (e.g. http://localhost:4000) when the API is not on the same host as the SPA.
 */
export function apiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return "";
  }
  return String(raw).replace(/\/$/, "");
}

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = apiBaseUrl();
  return base ? `${base}${p}` : p;
}

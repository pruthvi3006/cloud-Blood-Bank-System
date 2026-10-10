import axios from "axios";
import { authHeaders } from "./auth.js";

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

export async function downloadAuthFile(path, fallbackName) {
  try {
    const res = await axios.get(apiUrl(path), {
      headers: authHeaders(),
      responseType: "blob",
    });
    const type = res.headers["content-type"] || "";
    if (type.includes("application/json")) {
      const text = await res.data.text();
      let message = "Download failed";
      try {
        message = JSON.parse(text).message || message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    const blobUrl = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    const data = err.response?.data;
    if (data instanceof Blob) {
      try {
        const parsed = JSON.parse(await data.text());
        throw new Error(parsed.message || "Download failed");
      } catch (inner) {
        if (inner instanceof Error && inner.message !== "Download failed") {
          throw inner;
        }
      }
    }
    throw new Error(err.message || "Download failed");
  }
}

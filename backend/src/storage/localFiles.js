import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { UPLOADS_DIR } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultUploads = path.join(__dirname, "../../uploads");

export function uploadsRoot() {
  return path.resolve(UPLOADS_DIR || defaultUploads);
}

const ALLOWED_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export function extensionForFile(originalname, mimetype) {
  const fromName = path.extname(originalname || "").toLowerCase();
  if (ALLOWED_EXT.has(fromName)) return fromName;
  const byMime = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return byMime[mimetype] || "";
}

export function resolveSafePath(key) {
  if (!key || typeof key !== "string" || key.includes("\0")) {
    throw new Error("Invalid file key");
  }
  const normalized = key.replace(/\\/g, "/");
  if (path.isAbsolute(normalized) || normalized.split("/").includes("..")) {
    throw new Error("Invalid file key");
  }
  const root = uploadsRoot();
  const full = path.resolve(root, normalized);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (full !== root && !full.startsWith(rootWithSep)) {
    throw new Error("Invalid file key");
  }
  return full;
}

export async function saveBuffer({ key, buffer }) {
  const dest = resolveSafePath(key);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buffer);
}

export async function sendStoredFile(res, key, downloadName) {
  const dest = resolveSafePath(key);
  try {
    await fs.access(dest);
  } catch {
    return false;
  }
  const name = downloadName || path.basename(dest);
  res.setHeader("Content-Disposition", `inline; filename="${name}"`);
  res.sendFile(dest);
  return true;
}

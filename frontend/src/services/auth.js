const STORAGE_KEY = "bloodbank_auth";

export function saveAuth(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function authHeaders() {
  const auth = getAuth();
  if (!auth?.token) return {};
  return {
    Authorization: `Bearer ${auth.token}`,
  };
}


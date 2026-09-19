// Thin REST client for the AlphaQ server. Same-origin `/api` (Vite proxies to
// the Node server in dev; the server serves the built app in prod). JWT token
// is kept in localStorage.

const API_BASE = "/api";
const TOKEN_KEY = "aq_token";

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function handle(res: Response): Promise<any> {
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export async function apiGet<T = any>(path: string): Promise<T> {
  return handle(await fetch(API_BASE + path, { headers: authHeaders() }));
}

export async function apiPost<T = any>(path: string, body?: unknown): Promise<T> {
  return handle(
    await fetch(API_BASE + path, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body ?? {}),
    }),
  );
}

export async function apiPut<T = any>(path: string, body?: unknown): Promise<T> {
  return handle(
    await fetch(API_BASE + path, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body ?? {}),
    }),
  );
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  return handle(await fetch(API_BASE + path, { method: "DELETE", headers: authHeaders() }));
}

/** Multipart upload (e.g. gallery images). */
export async function apiUpload<T = any>(path: string, form: FormData): Promise<T> {
  return handle(
    await fetch(API_BASE + path, { method: "POST", headers: authHeaders(), body: form }),
  );
}

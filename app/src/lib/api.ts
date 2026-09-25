// Thin REST client for the AlphaQ server. Supports VITE_API_URL for production
// (e.g. Fly.io backend) and falls back to "/api" (Vite proxy) for local development.
// JWT token is kept in localStorage.

const RAW_API_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  ""
).trim().replace(/\/+$/, "");

export const BACKEND_URL = RAW_API_URL.endsWith("/api")
  ? RAW_API_URL.slice(0, -4)
  : RAW_API_URL;

export const API_BASE = RAW_API_URL
  ? (RAW_API_URL.endsWith("/api") ? RAW_API_URL : `${RAW_API_URL}/api`)
  : "/api";

export function resolveUploadUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/uploads/") && BACKEND_URL) {
    return `${BACKEND_URL}${url}`;
  }
  return url;
}

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
  if (!res.ok) {
    const err: any = new Error((data && data.error) || `Request failed (${res.status})`);
    if (data) {
      err.data = data;
      err.requiresVerification = data.requiresVerification;
      err.email = data.email;
      err.status = res.status;
    }
    throw err;
  }
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

export async function apiPatch<T = any>(path: string, body?: unknown): Promise<T> {
  return handle(
    await fetch(API_BASE + path, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body ?? {}),
    }),
  );
}

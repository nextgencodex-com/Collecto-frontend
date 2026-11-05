// Minimal fetch client for the Collecto API.
// - The access token lives in memory only; the refresh token is an httpOnly cookie the browser sends itself.
// - A 401 triggers exactly one refresh (shared by concurrent requests) and one retry; if that fails the
//   session is considered lost and the registered handler signs the user out.
import type { Session } from "@/lib/types";

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = (error: string): Result<never> => ({ ok: false, error });

/** Base URL including the /api/v1 prefix. Configure with NEXT_PUBLIC_API_URL. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

export interface AuthPayload {
  accessToken: string;
  expiresIn: number;
  session: Session;
}

let accessToken: string | null = null;
let sessionLost: (() => void) | null = null;
export const setAccessToken = (t: string | null) => (accessToken = t);
/** Registered by the store: called when the session can no longer be refreshed. */
export const onSessionLost = (fn: () => void) => void (sessionLost = fn);

const NETWORK_ERROR = "Cannot reach the server. Check your connection and try again.";
const SESSION_ERROR = "Your session has expired. Please sign in again.";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { message?: string }[];
}

/** The message to show a user: the first field error for validation failures, else the server message. */
function messageOf(status: number, body: Envelope<unknown> | null): string {
  if (body?.errors?.length && body.errors[0]?.message) return body.errors[0].message;
  if (body?.message) return body.message;
  return status >= 500 ? "Something went wrong on the server. Please try again." : `Request failed (${status}).`;
}

async function send(method: string, path: string, body?: unknown, form?: FormData): Promise<Response | null> {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      credentials: "include", // sends/receives the refresh cookie
    });
  } catch {
    return null;
  }
}

let refreshing: Promise<AuthPayload | null> | null = null;

/** Exchanges the refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshAccessToken(): Promise<AuthPayload | null> {
  return (refreshing ??= (async () => {
    try {
      const res = await send("POST", "/auth/refresh");
      if (!res?.ok) {
        setAccessToken(null);
        return null;
      }
      const body = (await res.json()) as Envelope<AuthPayload>;
      setAccessToken(body.data!.accessToken);
      return body.data!;
    } finally {
      // keep the settled promise for a tick so simultaneous 401s all reuse it
      setTimeout(() => (refreshing = null), 0);
    }
  })());
}

interface Opts {
  body?: unknown;
  form?: FormData;
  /** false for endpoints that must not trigger the refresh-and-retry logic (login/refresh/logout). */
  retry?: boolean;
}

export async function request<T = void>(method: "GET" | "POST" | "PATCH" | "PUT", path: string, opts: Opts = {}): Promise<Result<T>> {
  let res = await send(method, path, opts.body, opts.form);
  if (!res) return fail(NETWORK_ERROR);

  if (res.status === 401 && opts.retry !== false) {
    if (await refreshAccessToken()) {
      res = await send(method, path, opts.body, opts.form);
      if (!res) return fail(NETWORK_ERROR);
    }
    if (res.status === 401) {
      sessionLost?.();
      return fail(SESSION_ERROR);
    }
  }

  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    /* non-JSON body */
  }
  if (!res.ok || json?.success === false) return fail(messageOf(res.status, json));
  return ok(json?.data as T);
}

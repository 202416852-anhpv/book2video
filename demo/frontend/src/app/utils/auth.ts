import { analytics } from "./analytics";

let ramAccessToken: string | null = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImFkbWluIiwiZXhwIjoyNTM0MDIzMDAwMDB9.mockSignature";
let ramRefreshToken: string | null = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImFkbWluIiwiZXhwIjoyNTM0MDIzMDAwMDB9.mockSignature";

export function getAccessToken(): string | null {
  return ramAccessToken;
}

export function getRefreshToken(): string | null {
  return ramRefreshToken;
}

function setTokens(access: string, refresh: string) {
  ramAccessToken = access;
  ramRefreshToken = refresh;
}

export function clearTokens() {
  ramAccessToken = null;
  ramRefreshToken = null;
}

function parseJwt(token: string): { exp: number; type: string } | null {
  try {
    const body = token.split(".")[1];
    return JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
}

export function isAccessTokenValid(): boolean {
  return isTokenValid(getAccessToken());
}

export function isRefreshTokenValid(): boolean {
  return isTokenValid(getRefreshToken());
}

/** Check if user is authenticated (mocked for standalone FE) */
export function isAuthenticated(): boolean {
  return true;
}

/** Login with username/password (mocked for standalone FE) */
export async function login(username: string, password: string): Promise<void> {
  const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImFkbWluIiwiZXhwIjoyNTM0MDIzMDAwMDB9.mockSignature";
  setTokens(fakeToken, fakeToken);
}

/** Refresh access token using refresh token (with mutex to prevent race conditions) */
let _refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  // If a refresh is already in progress, wait for it
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      ramAccessToken = data.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

/** Ensure a valid access token exists, refreshing if needed. Returns null if unauthenticated. */
async function ensureAccessToken(): Promise<string | null> {
  if (isAccessTokenValid()) return getAccessToken();
  if (!isRefreshTokenValid()) return null;
  const ok = await refreshAccessToken();
  return ok ? getAccessToken() : null;
}

/**
 * Authenticated fetch wrapper. Auto-attaches Bearer token and
 * refreshes on 401. Triggers logout callback if fully expired.
 */
let _onAuthExpired: (() => void) | null = null;

export function onAuthExpired(cb: () => void) {
  _onAuthExpired = cb;
}

export function logout() {
  analytics.track("logout");
  analytics.reset();
  clearTokens();
  // Clear HttpOnly auth cookie via server
  fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  _onAuthExpired?.();
}

export async function authFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const token = await ensureAccessToken();
  if (!token) {
    _onAuthExpired?.();
    return Promise.reject(new Error("Not authenticated"));
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(input, { ...init, headers });

  // Retry once on 401 (token may have just expired)
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${getAccessToken()}`);
      res = await fetch(input, { ...init, headers });
    } else {
      _onAuthExpired?.();
    }
  }

  return res;
}

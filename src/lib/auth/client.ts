import type { AuthUser } from "@/lib/auth/types";

export class AuthApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

async function readDetail(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string") return data.detail;
    return response.statusText || "Request failed";
  } catch {
    return response.statusText || "Request failed";
  }
}

export async function loginRequest(input: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new AuthApiError(response.status, await readDetail(response));
  }

  const data = (await response.json()) as { user: AuthUser };
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
}

export async function refreshSessionRequest(): Promise<boolean> {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
  });
  return response.ok;
}

export async function fetchCurrentUserRequest(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new AuthApiError(response.status, await readDetail(response));
  }

  const data = (await response.json()) as { user: AuthUser };
  return data.user;
}

/**
 * Authenticated API helper — calls the Next.js BFF proxy so JWTs stay httpOnly.
 * On 401, attempts a single token refresh and retries once.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `/api/backend${normalized}`;

  const first = await fetch(url, {
    ...init,
    credentials: "same-origin",
  });

  if (first.status !== 401) {
    return first;
  }

  const refreshed = await refreshSessionRequest();
  if (!refreshed) {
    return first;
  }

  return fetch(url, {
    ...init,
    credentials: "same-origin",
  });
}

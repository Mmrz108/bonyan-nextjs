import "server-only";

import type {
  ApiErrorBody,
  AuthUser,
  LoginResponse,
  RefreshResponse,
} from "@/lib/auth/types";

export class DjangoApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, message?: string) {
    super(message || `Django API error (${status})`);
    this.name = "DjangoApiError";
    this.status = status;
    this.body = body;
  }
}

export function getDjangoApiBaseUrl(): string {
  const base =
    process.env.API_URL?.replace(/\/$/, "") ||
    process.env.DJANGO_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000";
  return base;
}

async function parseJsonSafe(response: Response): Promise<ApiErrorBody | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiErrorBody;
  } catch {
    return { detail: text };
  }
}

async function djangoFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${getDjangoApiBaseUrl()}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  if (!response.ok) {
    const body = await parseJsonSafe(response);
    throw new DjangoApiError(response.status, body);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function loginWithDjango(email: string, password: string) {
  return djangoFetch<LoginResponse>("/api/v1/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refreshWithDjango(refresh: string) {
  return djangoFetch<RefreshResponse>("/api/v1/auth/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}

export function logoutWithDjango(access: string, refresh: string) {
  const headers: HeadersInit = {};
  if (access) {
    headers.Authorization = `Bearer ${access}`;
  }
  return djangoFetch<void>("/api/v1/auth/logout/", {
    method: "POST",
    headers,
    body: JSON.stringify({ refresh }),
  });
}

export function fetchCurrentUser(access: string) {
  return djangoFetch<AuthUser>("/api/v1/auth/me/", {
    method: "GET",
    headers: { Authorization: `Bearer ${access}` },
  });
}

/**
 * Forward an authenticated request to Django. Used by the backend proxy.
 */
export async function proxyToDjango(
  path: string,
  init: RequestInit & { accessToken: string },
): Promise<Response> {
  const { accessToken, ...rest } = init;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${getDjangoApiBaseUrl()}/api/v1${normalized}`;

  const headers = new Headers(rest.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Accept", headers.get("Accept") || "application/json");

  return fetch(url, {
    ...rest,
    headers,
    cache: "no-store",
  });
}

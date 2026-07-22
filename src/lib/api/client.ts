import { apiFetch } from "@/lib/auth/client";
import type { PaginatedResponse } from "@/lib/api/types";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function readError(response: Response): Promise<ApiError> {
  let body: unknown = null;
  let detail = response.statusText || "Request failed";
  try {
    body = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "detail" in body &&
      typeof (body as { detail: unknown }).detail === "string"
    ) {
      detail = (body as { detail: string }).detail;
    }
  } catch {
    // ignore
  }
  return new ApiError(response.status, detail, body);
}

export async function fetchPaginated<T>(
  path: string,
  params: Record<string, string | number | undefined | null> = {},
): Promise<PaginatedResponse<T>> {
  const response = await apiFetch(`${path}${toQuery({ page: 1, ...params })}`);
  if (!response.ok) throw await readError(response);
  return (await response.json()) as PaginatedResponse<T>;
}

export async function fetchCount(
  path: string,
  params: Record<string, string | number | undefined | null> = {},
): Promise<number> {
  const data = await fetchPaginated<unknown>(path, params);
  return data.count;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await apiFetch(path);
  if (!response.ok) throw await readError(response);
  return (await response.json()) as T;
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const response = await apiFetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) throw await readError(response);
  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Multipart upload — do not set Content-Type (browser sets boundary). */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const response = await apiFetch(path, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw await readError(response);
  return (await response.json()) as T;
}

/** Local calendar date as YYYY-MM-DD for DRF date filters. */
export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

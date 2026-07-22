/**
 * Normalize and validate authenticated BFF path segments so they cannot escape
 * the Django ``/api/v1`` prefix (e.g. via ``..``).
 */
export function sanitizeBackendProxyPath(segments: string[]): string {
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error("Missing API path.");
  }

  const cleaned: string[] = [];
  for (const raw of segments) {
    const segment = decodeURIComponent(String(raw ?? "")).trim();
    if (!segment || segment === "." || segment === "..") {
      throw new Error("Invalid API path.");
    }
    if (segment.includes("/") || segment.includes("\\") || segment.includes("\0")) {
      throw new Error("Invalid API path.");
    }
    cleaned.push(segment);
  }

  const joined = `/${cleaned.join("/")}`;
  // Defense in depth: reject absolute / scheme-like paths.
  if (joined.includes("//") || /^\/[a-z]+:/i.test(joined)) {
    throw new Error("Invalid API path.");
  }
  return joined;
}

const RESPONSE_HEADER_ALLOWLIST = new Set([
  "content-type",
  "content-disposition",
  "content-length",
  "cache-control",
  "etag",
  "last-modified",
  "x-content-type-options",
  "accept-ranges",
]);

/** Copy only safe upstream headers onto the BFF response. */
export function filterUpstreamHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  upstream.forEach((value, key) => {
    if (RESPONSE_HEADER_ALLOWLIST.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

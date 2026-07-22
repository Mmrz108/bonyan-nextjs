import { describe, expect, it } from "vitest";
import {
  filterUpstreamHeaders,
  sanitizeBackendProxyPath,
} from "@/lib/auth/proxy-path";

describe("sanitizeBackendProxyPath", () => {
  it("joins safe segments", () => {
    expect(sanitizeBackendProxyPath(["reports", "123", "pdf"])).toBe(
      "/reports/123/pdf",
    );
  });

  it("rejects traversal and empty segments", () => {
    expect(() => sanitizeBackendProxyPath(["..", "secrets"])).toThrow(
      /Invalid API path/,
    );
    expect(() => sanitizeBackendProxyPath(["reports", ""])).toThrow(
      /Invalid API path/,
    );
    expect(() => sanitizeBackendProxyPath([])).toThrow(/Missing API path/);
  });

  it("rejects embedded separators", () => {
    expect(() => sanitizeBackendProxyPath(["reports/../admin"])).toThrow(
      /Invalid API path/,
    );
  });
});

describe("filterUpstreamHeaders", () => {
  it("keeps allowlisted headers only", () => {
    const upstream = new Headers({
      "content-type": "application/pdf",
      "set-cookie": "session=abc",
      "x-content-type-options": "nosniff",
      "x-powered-by": "django",
    });
    const filtered = filterUpstreamHeaders(upstream);
    expect(filtered.get("content-type")).toBe("application/pdf");
    expect(filtered.get("x-content-type-options")).toBe("nosniff");
    expect(filtered.get("set-cookie")).toBeNull();
    expect(filtered.get("x-powered-by")).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, AuthApiError, loginRequest } from "@/lib/auth/client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BFF apiFetch", () => {
  it("prefixes /api/backend and sends credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await apiFetch("/site-visits/1/", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/backend/site-visits/1/",
      expect.objectContaining({
        method: "GET",
        credentials: "same-origin",
      }),
    );
  });

  it("retries once after a successful refresh on 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const response = await apiFetch("/reports/");
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/reports/");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
  });
});

describe("loginRequest auth contract", () => {
  it("raises AuthApiError when login fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ detail: "Invalid credentials" }),
      }),
    );

    await expect(
      loginRequest({
        email: "x@y.com",
        password: "bad",
        rememberMe: false,
      }),
    ).rejects.toBeInstanceOf(AuthApiError);
  });
});

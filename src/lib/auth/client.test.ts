import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  fetchCurrentUserRequest,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
  AuthApiError,
} from "@/lib/auth/client";
import type { AuthUser } from "@/lib/auth/types";

const user: AuthUser = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "pm@bonyan.test",
  first_name: "Project",
  last_name: "Manager",
  full_name: "Project Manager",
  phone_number: "",
  is_active: true,
  roles: ["PROJECT_MANAGER"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("loginRequest", () => {
  it("returns the user and never requires tokens in the body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await loginRequest({
      email: "pm@bonyan.test",
      password: "password123",
      rememberMe: true,
    });

    expect(result).toEqual(user);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
      }),
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body).toEqual({
      email: "pm@bonyan.test",
      password: "password123",
      rememberMe: true,
    });
    expect(body.access).toBeUndefined();
    expect(body.refresh).toBeUndefined();
  });

  it("throws AuthApiError on invalid credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ detail: "No active account found." }),
      }),
    );

    await expect(
      loginRequest({
        email: "bad@bonyan.test",
        password: "password123",
        rememberMe: false,
      }),
    ).rejects.toBeInstanceOf(AuthApiError);
  });
});

describe("session helpers", () => {
  it("fetchCurrentUserRequest returns null on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );
    await expect(fetchCurrentUserRequest()).resolves.toBeNull();
  });

  it("refreshSessionRequest reports success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );
    await expect(refreshSessionRequest()).resolves.toBe(true);
  });

  it("logoutRequest posts to the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 205 });
    vi.stubGlobal("fetch", fetchMock);
    await logoutRequest();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
  });
});

describe("apiFetch", () => {
  it("retries once after refreshing an expired access token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false })
      .mockResolvedValueOnce({ ok: true }) // refresh
      .mockResolvedValueOnce({ status: 200, ok: true });

    vi.stubGlobal("fetch", fetchMock);

    const response = await apiFetch("/projects/");
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/projects");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
    expect(fetchMock.mock.calls[2][0]).toBe("/api/backend/projects");
  });

  it("does not retry when refresh fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false })
      .mockResolvedValueOnce({ ok: false, status: 401 });

    vi.stubGlobal("fetch", fetchMock);

    const response = await apiFetch("/projects/");
    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("strips trailing slashes before calling the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/projects/?status=active");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/backend/projects?status=active",
    );
  });
});

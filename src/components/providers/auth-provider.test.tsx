import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
import type { AuthUser } from "@/lib/auth/types";

const user: AuthUser = {
  id: "22222222-2222-2222-2222-222222222222",
  email: "admin@bonyan.test",
  first_name: "Ada",
  last_name: "Admin",
  full_name: "Ada Admin",
  phone_number: "",
  is_active: true,
  roles: ["ADMIN"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

vi.mock("@/lib/auth/client", () => ({
  AuthApiError: class AuthApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  fetchCurrentUserRequest: vi.fn(),
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  refreshSessionRequest: vi.fn(),
}));

import {
  fetchCurrentUserRequest,
  loginRequest,
  logoutRequest,
} from "@/lib/auth/client";

function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <p data-testid="ready">{String(auth.isReady)}</p>
      <p data-testid="authenticated">{String(auth.isAuthenticated)}</p>
      <p data-testid="email">{auth.user?.email ?? "none"}</p>
      <p data-testid="has-admin">{String(auth.hasRole("ADMIN"))}</p>
      <button
        type="button"
        onClick={() =>
          void auth.login({
            email: "admin@bonyan.test",
            password: "password123",
            rememberMe: true,
          })
        }
      >
        login
      </button>
      <button type="button" onClick={() => void auth.logout()}>
        logout
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.mocked(fetchCurrentUserRequest).mockReset();
    vi.mocked(loginRequest).mockReset();
    vi.mocked(logoutRequest).mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("hydrates the current user on mount", async () => {
    vi.mocked(fetchCurrentUserRequest).mockResolvedValue(user);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("true");
    });
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("email")).toHaveTextContent("admin@bonyan.test");
    expect(screen.getByTestId("has-admin")).toHaveTextContent("true");
  });

  it("starts anonymous when /me returns null", async () => {
    vi.mocked(fetchCurrentUserRequest).mockResolvedValue(null);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("true");
    });
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("email")).toHaveTextContent("none");
  });

  it("logs in and logs out through the BFF helpers", async () => {
    vi.mocked(fetchCurrentUserRequest).mockResolvedValue(null);
    vi.mocked(loginRequest).mockResolvedValue(user);
    vi.mocked(logoutRequest).mockResolvedValue(undefined);

    const ui = userEvent.setup();
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("true");
    });

    await ui.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    });
    expect(loginRequest).toHaveBeenCalledWith({
      email: "admin@bonyan.test",
      password: "password123",
      rememberMe: true,
    });

    await ui.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    });
    expect(logoutRequest).toHaveBeenCalled();
  });
});

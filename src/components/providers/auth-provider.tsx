"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, RoleCode } from "@/lib/auth/types";
import {
  AuthApiError,
  fetchCurrentUserRequest,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
} from "@/lib/auth/client";
import { hasAnyRole } from "@/lib/auth/roles";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (input: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  reloadUser: () => Promise<AuthUser | null>;
  hasRole: (...roles: RoleCode[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const reloadUser = useCallback(async () => {
    try {
      const next = await fetchCurrentUserRequest();
      setUser(next);
      return next;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await fetchCurrentUserRequest();
        if (!cancelled) setUser(next);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (input: {
      email: string;
      password: string;
      rememberMe: boolean;
    }) => {
      const next = await loginRequest(input);
      setUser(next);
      return next;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const ok = await refreshSessionRequest();
    if (!ok) {
      setUser(null);
      return false;
    }
    await reloadUser();
    return true;
  }, [reloadUser]);

  const hasRole = useCallback(
    (...roles: RoleCode[]) => hasAnyRole(user?.roles, roles),
    [user?.roles],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isReady,
      login,
      logout,
      refreshSession,
      reloadUser,
      hasRole,
    }),
    [user, isReady, login, logout, refreshSession, reloadUser, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function isAuthApiError(error: unknown): error is AuthApiError {
  return error instanceof AuthApiError;
}

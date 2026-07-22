import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  REMEMBER_ME_COOKIE,
} from "@/lib/auth/constants";

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}

export type TokenPersistence = {
  rememberMe: boolean;
};

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
};

function accessCookieOptions(rememberMe: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS } : {}),
  };
}

function refreshCookieOptions(rememberMe: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    // path=/ so middleware can detect session on page navigations (still httpOnly).
    path: "/",
    ...(rememberMe ? { maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS } : {}),
  };
}

function rememberCookieOptions(rememberMe: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS } : {}),
  };
}

type CookieWriter = {
  set: (name: string, value: string, options?: CookieOptions) => unknown;
};

export function applyAuthCookies(
  writer: CookieWriter,
  tokens: { access: string; refresh: string },
  persistence: TokenPersistence,
) {
  writer.set(
    ACCESS_TOKEN_COOKIE,
    tokens.access,
    accessCookieOptions(persistence.rememberMe),
  );
  writer.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refresh,
    refreshCookieOptions(persistence.rememberMe),
  );
  writer.set(
    REMEMBER_ME_COOKIE,
    persistence.rememberMe ? "1" : "0",
    rememberCookieOptions(persistence.rememberMe),
  );
}

export function applyAccessTokenCookie(
  writer: CookieWriter,
  access: string,
  rememberMe: boolean,
) {
  writer.set(ACCESS_TOKEN_COOKIE, access, accessCookieOptions(rememberMe));
}

export function clearAuthCookies(writer: CookieWriter) {
  const base: CookieOptions = {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    maxAge: 0,
  };
  writer.set(ACCESS_TOKEN_COOKIE, "", { ...base, path: "/" });
  writer.set(REFRESH_TOKEN_COOKIE, "", { ...base, path: "/" });
  writer.set(REMEMBER_ME_COOKIE, "", { ...base, path: "/" });
}

export function readRememberMeFlag(
  value: string | undefined,
): boolean {
  return value === "1";
}

/** Attach auth cookies onto a NextResponse (preferred in Route Handlers). */
export function withAuthCookies<T>(
  response: NextResponse<T>,
  tokens: { access: string; refresh: string },
  persistence: TokenPersistence,
): NextResponse<T> {
  applyAuthCookies(response.cookies, tokens, persistence);
  return response;
}

export function withAccessTokenCookie<T>(
  response: NextResponse<T>,
  access: string,
  rememberMe: boolean,
): NextResponse<T> {
  applyAccessTokenCookie(response.cookies, access, rememberMe);
  return response;
}

export function withClearedAuthCookies<T>(
  response: NextResponse<T>,
): NextResponse<T> {
  clearAuthCookies(response.cookies);
  return response;
}

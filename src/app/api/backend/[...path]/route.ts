import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REMEMBER_ME_COOKIE,
} from "@/lib/auth/constants";
import {
  readRememberMeFlag,
  withAccessTokenCookie,
  withAuthCookies,
  withClearedAuthCookies,
} from "@/lib/auth/cookies";
import {
  AuthServiceError,
  refreshLocal,
  requireUserFromAccess,
} from "@/lib/auth/local";
import { sanitizeBackendProxyPath } from "@/lib/auth/proxy-path";
import { handleLocalApi } from "@/lib/api/local-backend";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(request: NextRequest, context: RouteContext) {
  const { path: pathSegments } = await context.params;

  let pathname: string;
  try {
    pathname = sanitizeBackendProxyPath(pathSegments);
  } catch {
    return NextResponse.json({ detail: "Invalid API path." }, { status: 400 });
  }

  const store = await cookies();
  let access = store.get(ACCESS_TOKEN_COOKIE)?.value;
  let refresh = store.get(REFRESH_TOKEN_COOKIE)?.value;
  const rememberMe = readRememberMeFlag(store.get(REMEMBER_ME_COOKIE)?.value);

  if (!access && refresh) {
    try {
      const refreshed = await refreshLocal(refresh);
      access = refreshed.access;
      if (refreshed.refresh) refresh = refreshed.refresh;
    } catch {
      return withClearedAuthCookies(
        NextResponse.json({ detail: "Session expired." }, { status: 401 }),
      );
    }
  }

  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  let nextAccess: string | null =
    access !== store.get(ACCESS_TOKEN_COOKIE)?.value ? access : null;
  let nextRefresh: string | null =
    refresh && refresh !== store.get(REFRESH_TOKEN_COOKIE)?.value
      ? refresh
      : null;

  let userId: string;
  try {
    const session = await requireUserFromAccess(access);
    userId = session.id;
  } catch (error) {
    if (error instanceof AuthServiceError && error.status === 401 && refresh) {
      try {
        const refreshed = await refreshLocal(refresh);
        nextAccess = refreshed.access;
        if (refreshed.refresh) {
          nextRefresh = refreshed.refresh;
          refresh = refreshed.refresh;
        }
        const session = await requireUserFromAccess(refreshed.access);
        userId = session.id;
        access = refreshed.access;
      } catch {
        return withClearedAuthCookies(
          NextResponse.json({ detail: "Session expired." }, { status: 401 }),
        );
      }
    } else {
      return withClearedAuthCookies(
        NextResponse.json({ detail: "Not authenticated." }, { status: 401 }),
      );
    }
  }

  let body: unknown = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch {
        body = undefined;
      }
    }
  }

  const upstream = await handleLocalApi(
    request.method,
    pathname,
    request.nextUrl.search,
    body,
    userId,
  );

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });

  if (nextAccess && nextRefresh) {
    return withAuthCookies(
      response,
      { access: nextAccess, refresh: nextRefresh },
      { rememberMe },
    );
  }
  if (nextAccess) {
    return withAccessTokenCookie(response, nextAccess, rememberMe);
  }
  return response;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

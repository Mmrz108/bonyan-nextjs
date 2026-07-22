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
import { proxyToDjango, refreshWithDjango } from "@/lib/auth/django";
import {
  filterUpstreamHeaders,
  sanitizeBackendProxyPath,
} from "@/lib/auth/proxy-path";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function forward(
  request: NextRequest,
  pathSegments: string[],
  accessToken: string,
): Promise<Response> {
  const search = request.nextUrl.search;
  const path = `${sanitizeBackendProxyPath(pathSegments)}${search}`;
  const contentType = request.headers.get("content-type");
  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const headers = new Headers();
  if (contentType) headers.set("Content-Type", contentType);

  return proxyToDjango(path, {
    method: request.method,
    accessToken,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  });
}

function passthrough(
  upstream: Response,
  mutate?: (res: NextResponse) => NextResponse,
) {
  let response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: filterUpstreamHeaders(upstream.headers),
  });
  if (mutate) response = mutate(response);
  return response;
}

async function handle(request: NextRequest, context: RouteContext) {
  const { path: pathSegments } = await context.params;

  try {
    sanitizeBackendProxyPath(pathSegments);
  } catch {
    return NextResponse.json({ detail: "Invalid API path." }, { status: 400 });
  }

  const store = await cookies();
  let access = store.get(ACCESS_TOKEN_COOKIE)?.value;
  let refresh = store.get(REFRESH_TOKEN_COOKIE)?.value;
  const rememberMe = readRememberMeFlag(store.get(REMEMBER_ME_COOKIE)?.value);

  if (!access && refresh) {
    try {
      const refreshed = await refreshWithDjango(refresh);
      access = refreshed.access;
      if (refreshed.refresh) {
        refresh = refreshed.refresh;
      }
    } catch {
      return withClearedAuthCookies(
        NextResponse.json({ detail: "Session expired." }, { status: 401 }),
      );
    }
  }

  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  let upstream = await forward(request, pathSegments, access);
  let nextAccess: string | null =
    access !== store.get(ACCESS_TOKEN_COOKIE)?.value ? access : null;
  let nextRefresh: string | null =
    refresh && refresh !== store.get(REFRESH_TOKEN_COOKIE)?.value
      ? refresh
      : null;

  if (upstream.status === 401 && refresh) {
    try {
      const refreshed = await refreshWithDjango(refresh);
      nextAccess = refreshed.access;
      if (refreshed.refresh) {
        nextRefresh = refreshed.refresh;
        refresh = refreshed.refresh;
      }
      upstream = await forward(request, pathSegments, refreshed.access);
    } catch {
      return withClearedAuthCookies(
        NextResponse.json({ detail: "Session expired." }, { status: 401 }),
      );
    }
  }

  return passthrough(upstream, (response) => {
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
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

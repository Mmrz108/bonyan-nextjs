import { NextResponse } from "next/server";
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
  DjangoApiError,
  fetchCurrentUser,
  refreshWithDjango,
} from "@/lib/auth/django";

function withRefreshedSession(
  body: unknown,
  tokens: { access: string; refresh?: string },
  rememberMe: boolean,
) {
  if (tokens.refresh) {
    return withAuthCookies(
      NextResponse.json(body),
      { access: tokens.access, refresh: tokens.refresh },
      { rememberMe },
    );
  }
  return withAccessTokenCookie(NextResponse.json(body), tokens.access, rememberMe);
}

export async function GET() {
  const store = await cookies();
  let access = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const refresh = store.get(REFRESH_TOKEN_COOKIE)?.value;
  const rememberMe = readRememberMeFlag(store.get(REMEMBER_ME_COOKIE)?.value);

  if (!access && !refresh) {
    return NextResponse.json(
      { detail: "Authentication credentials were not provided." },
      { status: 401 },
    );
  }

  try {
    if (!access && refresh) {
      const refreshed = await refreshWithDjango(refresh);
      access = refreshed.access;
      const user = await fetchCurrentUser(access);
      return withRefreshedSession(
        { user },
        { access, refresh: refreshed.refresh },
        rememberMe,
      );
    }

    try {
      const user = await fetchCurrentUser(access!);
      return NextResponse.json({ user });
    } catch (error) {
      if (error instanceof DjangoApiError && error.status === 401 && refresh) {
        const refreshed = await refreshWithDjango(refresh);
        const user = await fetchCurrentUser(refreshed.access);
        return withRefreshedSession(
          { user },
          { access: refreshed.access, refresh: refreshed.refresh },
          rememberMe,
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof DjangoApiError) {
      return withClearedAuthCookies(
        NextResponse.json(
          { detail: error.body?.detail ?? "Authentication failed." },
          { status: error.status === 401 ? 401 : error.status },
        ),
      );
    }
    return withClearedAuthCookies(
      NextResponse.json(
        { detail: "Unable to reach authentication service." },
        { status: 502 },
      ),
    );
  }
}

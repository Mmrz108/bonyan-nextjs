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
  AuthServiceError,
  getUserFromAccessToken,
  refreshLocal,
} from "@/lib/auth/local";

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
      const refreshed = await refreshLocal(refresh);
      access = refreshed.access;
      const user = await getUserFromAccessToken(access);
      return withRefreshedSession(
        { user },
        { access, refresh: refreshed.refresh },
        rememberMe,
      );
    }

    try {
      const user = await getUserFromAccessToken(access!);
      return NextResponse.json({ user });
    } catch (error) {
      if (error instanceof AuthServiceError && error.status === 401 && refresh) {
        const refreshed = await refreshLocal(refresh);
        const user = await getUserFromAccessToken(refreshed.access);
        return withRefreshedSession(
          { user },
          { access: refreshed.access, refresh: refreshed.refresh },
          rememberMe,
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return withClearedAuthCookies(
        NextResponse.json({ detail: error.message }, { status: error.status }),
      );
    }
    console.error(error);
    return withClearedAuthCookies(
      NextResponse.json({ detail: "Authentication failed." }, { status: 500 }),
    );
  }
}

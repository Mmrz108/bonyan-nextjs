import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_TOKEN_COOKIE, REMEMBER_ME_COOKIE } from "@/lib/auth/constants";
import {
  readRememberMeFlag,
  withAccessTokenCookie,
  withAuthCookies,
  withClearedAuthCookies,
} from "@/lib/auth/cookies";
import { DjangoApiError, refreshWithDjango } from "@/lib/auth/django";

export async function POST() {
  const store = await cookies();
  const refresh = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refresh) {
    return withClearedAuthCookies(
      NextResponse.json({ detail: "No refresh token." }, { status: 401 }),
    );
  }

  try {
    const data = await refreshWithDjango(refresh);
    const rememberMe = readRememberMeFlag(store.get(REMEMBER_ME_COOKIE)?.value);
    if (data.refresh) {
      return withAuthCookies(
        NextResponse.json({ ok: true }),
        { access: data.access, refresh: data.refresh },
        { rememberMe },
      );
    }
    return withAccessTokenCookie(
      NextResponse.json({ ok: true }),
      data.access,
      rememberMe,
    );
  } catch (error) {
    if (error instanceof DjangoApiError) {
      return withClearedAuthCookies(
        NextResponse.json(
          { detail: error.body?.detail ?? "Session expired." },
          { status: 401 },
        ),
      );
    }
    return withClearedAuthCookies(
      NextResponse.json(
        { detail: "Unable to refresh session." },
        { status: 502 },
      ),
    );
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";
import { withClearedAuthCookies } from "@/lib/auth/cookies";
import { logoutWithDjango, refreshWithDjango } from "@/lib/auth/django";

export async function POST() {
  const store = await cookies();
  let access = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const refresh = store.get(REFRESH_TOKEN_COOKIE)?.value;

  try {
    if (refresh) {
      // Prefer blacklisting even when the access cookie is already expired.
      if (!access) {
        try {
          const refreshed = await refreshWithDjango(refresh);
          access = refreshed.access;
        } catch {
          // Fall through — logout endpoint accepts refresh with optional access.
        }
      }
      await logoutWithDjango(access || "", refresh);
    }
  } catch {
    // Always clear local session even if blacklist fails (token already invalid).
  }

  return withClearedAuthCookies(new NextResponse(null, { status: 205 }));
}

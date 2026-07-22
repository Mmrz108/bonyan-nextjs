import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./src/i18n/routing";
import { REFRESH_TOKEN_COOKIE } from "./src/lib/auth/constants";
import {
  resolveAuthRedirect,
  stripLocalePrefix,
} from "./src/lib/auth/path-guards";

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const pathWithoutLocale = stripLocalePrefix(pathname);
  const hasSession = Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value);
  const decision = resolveAuthRedirect(pathWithoutLocale, hasSession);

  if (decision.action === "to-login") {
    const locale =
      pathname.match(/^\/(en|ar)(?=\/|$)/)?.[1] ?? routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  if (decision.action === "to-dashboard") {
    const locale =
      pathname.match(/^\/(en|ar)(?=\/|$)/)?.[1] ?? routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};

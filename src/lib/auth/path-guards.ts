import { AUTH_APP_PATH_PREFIXES, AUTH_PUBLIC_PATHS } from "@/lib/auth/constants";

/**
 * Strip locale prefix (`/en`, `/ar`) from a pathname.
 */
export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(en|ar)(?=\/|$)/);
  if (!match) return pathname || "/";
  const rest = pathname.slice(match[0].length);
  return rest.length === 0 ? "/" : rest;
}

export function isAuthPublicPath(pathWithoutLocale: string): boolean {
  return AUTH_PUBLIC_PATHS.some(
    (path) =>
      pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`),
  );
}

export function isProtectedAppPath(pathWithoutLocale: string): boolean {
  if (pathWithoutLocale === "/") return false;
  return AUTH_APP_PATH_PREFIXES.some(
    (prefix) =>
      pathWithoutLocale === prefix ||
      pathWithoutLocale.startsWith(`${prefix}/`),
  );
}

export type AuthRedirectDecision =
  | { action: "allow" }
  | { action: "to-login" }
  | { action: "to-dashboard" };

/**
 * Decide auth redirects for locale-prefixed app routes.
 * Session presence is inferred from the httpOnly refresh cookie.
 * Marketing home (`/`) is public for everyone.
 */
export function resolveAuthRedirect(
  pathWithoutLocale: string,
  hasSession: boolean,
): AuthRedirectDecision {
  const onPublicAuth = isAuthPublicPath(pathWithoutLocale);

  if (!hasSession && isProtectedAppPath(pathWithoutLocale)) {
    return { action: "to-login" };
  }

  if (hasSession && onPublicAuth) {
    return { action: "to-dashboard" };
  }

  return { action: "allow" };
}

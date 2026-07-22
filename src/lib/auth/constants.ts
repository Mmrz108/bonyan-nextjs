/** Cookie names for JWT session. Tokens never leave httpOnly cookies. */
export const ACCESS_TOKEN_COOKIE = "bonyan_at";
export const REFRESH_TOKEN_COOKIE = "bonyan_rt";
/** "1" when user opted into persistent session (remember me). */
export const REMEMBER_ME_COOKIE = "bonyan_remember";
/** Access token lifetime aligned with Django SIMPLE_JWT default (15 minutes). */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;

/** Refresh token lifetime aligned with Django SIMPLE_JWT default (7 days). */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const AUTH_PUBLIC_PATHS = ["/login"] as const;

export const AUTH_APP_PATH_PREFIXES = [
  "/dashboard",
  "/projects",
  "/site-visits",
  "/issues",
  "/reports",
  "/settings",
] as const;

export type RoleCode =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "SUPERVISOR"
  | "INSPECTOR"
  | "CLIENT";

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  is_active: boolean;
  roles: RoleCode[];
  created_at: string;
  updated_at: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};

export type RefreshResponse = {
  access: string;
  /** Present when SimpleJWT refresh rotation is enabled. */
  refresh?: string;
};

export type ApiErrorBody = {
  detail?: string | Record<string, unknown>;
  [key: string]: unknown;
};

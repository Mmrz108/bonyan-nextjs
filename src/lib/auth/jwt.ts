import "server-only";

import { SignJWT, jwtVerify } from "jose";
import type { AuthUser, RoleCode } from "@/lib/auth/types";
import type { User } from "@prisma/client";
import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";

function secretKey() {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.DJANGO_SECRET_KEY ||
    "bonyan-dev-secret-change-me-in-production-32chars";
  return new TextEncoder().encode(secret);
}

export function toAuthUser(user: User): AuthUser {
  let roles: RoleCode[] = [];
  try {
    roles = JSON.parse(user.rolesJson) as RoleCode[];
  } catch {
    roles = ["CLIENT"];
  }
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    full_name: fullName,
    phone_number: user.phoneNumber,
    is_active: user.isActive,
    roles,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

type TokenClaims = {
  userId: string;
  email: string;
  roles: RoleCode[];
};

function parseRoles(value: unknown): RoleCode[] {
  if (!Array.isArray(value)) return ["CLIENT"];
  return value.filter((r): r is RoleCode => typeof r === "string") as RoleCode[];
}

export async function signAccessToken(user: {
  id: string;
  email: string;
  rolesJson: string;
}): Promise<string> {
  let roles: RoleCode[] = [];
  try {
    roles = JSON.parse(user.rolesJson) as RoleCode[];
  } catch {
    roles = ["CLIENT"];
  }
  return new SignJWT({
    typ: "access",
    sub: user.id,
    email: user.email,
    roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function signRefreshToken(user: {
  id: string;
  email: string;
}): Promise<string> {
  return new SignJWT({
    typ: "refresh",
    sub: user.id,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyAccessToken(
  token: string,
): Promise<TokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== "access" || typeof payload.sub !== "string") return null;
    const email =
      typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    return {
      userId: payload.sub,
      email,
      roles: parseRoles(payload.roles),
    };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== "refresh" || typeof payload.sub !== "string") return null;
    return {
      userId: payload.sub,
      email:
        typeof payload.email === "string" ? payload.email.toLowerCase() : "",
    };
  } catch {
    return null;
  }
}

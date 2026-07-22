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

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ typ: "access", sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ typ: "refresh", sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyAccessToken(
  token: string,
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== "access" || typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== "refresh" || typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

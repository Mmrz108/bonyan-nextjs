import "server-only";

import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { ensureDatabaseReady, DEMO_ADMIN_ID } from "@/lib/db/ensure";
import {
  signAccessToken,
  signRefreshToken,
  toAuthUser,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";
import type { AuthUser, LoginResponse, RefreshResponse } from "@/lib/auth/types";

export class AuthServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthServiceError";
    this.status = status;
  }
}

/**
 * Resolve the user for a valid JWT on this serverless instance.
 * Vercel SQLite is per-instance (/tmp), so the login instance may differ from
 * the API instance — recreate the user row from token claims when missing.
 */
async function resolveUserFromClaims(claims: {
  userId: string;
  email: string;
  roles?: string[];
}) {
  let user = await prisma.user.findUnique({ where: { id: claims.userId } });
  if (user) return user;

  if (claims.email) {
    user = await prisma.user.findUnique({ where: { email: claims.email } });
    if (user) return user;
  }

  if (!claims.email) return null;

  const demoEmail = (
    process.env.DEMO_ADMIN_EMAIL || "admin@bonyan.local"
  ).toLowerCase();
  const demoPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin123!@#";
  const isDemo = claims.email === demoEmail;
  const rolesJson = JSON.stringify(
    claims.roles?.length
      ? claims.roles
      : isDemo
        ? ["ADMIN", "SUPER_ADMIN"]
        : ["CLIENT"],
  );

  try {
    return await prisma.user.create({
      data: {
        id: isDemo ? DEMO_ADMIN_ID : claims.userId,
        email: claims.email,
        passwordHash: await bcrypt.hash(
          isDemo ? demoPassword : randomUUID(),
          10,
        ),
        firstName: isDemo ? "Bonyan" : "",
        lastName: isDemo ? "Admin" : "",
        isStaff: isDemo,
        isActive: true,
        isVerified: true,
        rolesJson,
      },
    });
  } catch {
    // Race: another request created the row.
    return (
      (await prisma.user.findUnique({ where: { id: claims.userId } })) ||
      (await prisma.user.findUnique({ where: { email: claims.email } }))
    );
  }
}

export async function loginLocal(
  email: string,
  password: string,
): Promise<LoginResponse> {
  await ensureDatabaseReady();
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || !user.isActive) {
    throw new AuthServiceError(401, "Invalid credentials.");
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AuthServiceError(401, "Invalid credentials.");
  }
  const access = await signAccessToken(user);
  const refresh = await signRefreshToken(user);
  return { access, refresh, user: toAuthUser(user) };
}

export async function refreshLocal(refreshToken: string): Promise<RefreshResponse> {
  await ensureDatabaseReady();
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new AuthServiceError(401, "Session expired.");
  }
  const user = await resolveUserFromClaims({
    userId: payload.userId,
    email: payload.email,
  });
  if (!user || !user.isActive) {
    throw new AuthServiceError(401, "Session expired.");
  }
  const access = await signAccessToken(user);
  const refresh = await signRefreshToken(user);
  return { access, refresh };
}

export async function getUserFromAccessToken(
  accessToken: string,
): Promise<AuthUser> {
  await ensureDatabaseReady();
  const payload = await verifyAccessToken(accessToken);
  if (!payload) {
    throw new AuthServiceError(401, "Authentication credentials were not provided.");
  }
  const user = await resolveUserFromClaims(payload);
  if (!user || !user.isActive) {
    throw new AuthServiceError(401, "Authentication failed.");
  }
  return toAuthUser(user);
}

export async function requireUserFromAccess(
  accessToken: string,
): Promise<{ id: string; roles: string[]; auth: AuthUser }> {
  const auth = await getUserFromAccessToken(accessToken);
  return { id: auth.id, roles: auth.roles, auth };
}

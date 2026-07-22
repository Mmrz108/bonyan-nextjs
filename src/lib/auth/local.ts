import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { ensureDatabaseReady } from "@/lib/db/ensure";
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
  const access = await signAccessToken(user.id);
  const refresh = await signRefreshToken(user.id);
  return { access, refresh, user: toAuthUser(user) };
}

export async function refreshLocal(refreshToken: string): Promise<RefreshResponse> {
  await ensureDatabaseReady();
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new AuthServiceError(401, "Session expired.");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive) {
    throw new AuthServiceError(401, "Session expired.");
  }
  const access = await signAccessToken(user.id);
  const refresh = await signRefreshToken(user.id);
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
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
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

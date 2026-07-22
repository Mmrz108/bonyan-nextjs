import "server-only";

import { PrismaClient } from "@prisma/client";

/**
 * On Vercel only `/tmp` is writable. Relative `file:./dev.db` (from local env)
 * must not be used in production or Prisma fails with EROFS.
 */
export function resolveDatabaseUrl(): string {
  const configured = process.env.BONYAN_DATABASE_URL;

  if (process.env.VERCEL) {
    if (configured && !configured.startsWith("file:")) {
      return configured;
    }
    if (configured?.startsWith("file:/tmp")) {
      return configured;
    }
    return "file:/tmp/bonyan.db";
  }

  return configured || "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

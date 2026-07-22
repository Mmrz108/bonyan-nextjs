import "server-only";

import { PrismaClient } from "@prisma/client";

function resolveDatabaseUrl(): string {
  if (process.env.BONYAN_DATABASE_URL) {
    return process.env.BONYAN_DATABASE_URL;
  }
  // Vercel serverless: only /tmp is writable (ephemeral — re-seeded on cold start).
  if (process.env.VERCEL) {
    return "file:/tmp/bonyan.db";
  }
  return "file:./dev.db";
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

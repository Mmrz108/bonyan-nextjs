import "server-only";

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

let ready: Promise<void> | null = null;

/** Stable across Vercel serverless instances so JWT subject stays valid. */
export const DEMO_ADMIN_ID = "bonyan_demo_admin_000000000001";

const DEFAULT_STAGES = [
  "Earthwork Excavation",
  "Foundation steel fabrication and formwork",
  "Ground floor columns",
  "Plinth beams",
  "gf slab",
  "FF slab",
];

function ensureSqliteFileExists() {
  const url =
    process.env.BONYAN_DATABASE_URL ||
    (process.env.VERCEL ? "file:/tmp/bonyan.db" : "file:./dev.db");
  if (!url.startsWith("file:")) return;

  const dbPath = url.replace(/^file:/, "");
  if (fs.existsSync(dbPath)) return;

  const template = path.join(process.cwd(), "prisma", "schema-template.db");
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(template)) {
    fs.copyFileSync(template, dbPath);
  }
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      ensureSqliteFileExists();

      const email = (
        process.env.DEMO_ADMIN_EMAIL || "admin@bonyan.local"
      ).toLowerCase();
      const password = process.env.DEMO_ADMIN_PASSWORD || "Admin123!@#";
      const passwordHash = await bcrypt.hash(password, 10);

      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            id: DEMO_ADMIN_ID,
            email,
            passwordHash,
            firstName: "Bonyan",
            lastName: "Admin",
            isStaff: true,
            isActive: true,
            isVerified: true,
            rolesJson: JSON.stringify(["ADMIN", "SUPER_ADMIN"]),
          },
        });
      } else {
        await prisma.user.update({
          where: { email },
          data: {
            passwordHash,
            isActive: true,
            isStaff: true,
            rolesJson: JSON.stringify(["ADMIN", "SUPER_ADMIN"]),
          },
        });
      }

      const stageCount = await prisma.stageTemplate.count();
      if (stageCount === 0) {
        await prisma.stageTemplate.createMany({
          data: DEFAULT_STAGES.map((name, index) => ({
            name,
            order: index + 1,
            isActive: true,
          })),
        });
      }
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}

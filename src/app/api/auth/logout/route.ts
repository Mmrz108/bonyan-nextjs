import { NextResponse } from "next/server";
import { withClearedAuthCookies } from "@/lib/auth/cookies";

export async function POST() {
  return withClearedAuthCookies(NextResponse.json({ ok: true }));
}

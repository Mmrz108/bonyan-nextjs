import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthServiceError, loginLocal } from "@/lib/auth/local";
import { withAuthCookies } from "@/lib/auth/cookies";

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = loginBodySchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json({ detail: "Invalid credentials payload." }, { status: 400 });
  }

  const { email, password, rememberMe } = parsed.data;

  try {
    const data = await loginLocal(email, password);
    const response = NextResponse.json({ user: data.user });
    return withAuthCookies(
      response,
      { access: data.access, refresh: data.refresh },
      { rememberMe },
    );
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json(
      { detail: "Unable to complete authentication." },
      { status: 500 },
    );
  }
}

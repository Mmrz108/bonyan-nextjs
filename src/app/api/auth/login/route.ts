import { NextResponse } from "next/server";
import { z } from "zod";
import { DjangoApiError, loginWithDjango } from "@/lib/auth/django";
import { withAuthCookies } from "@/lib/auth/cookies";

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = loginBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ detail: "Invalid credentials payload." }, { status: 400 });
  }

  const { email, password, rememberMe } = parsed.data;

  try {
    const data = await loginWithDjango(email, password);
    const response = NextResponse.json({ user: data.user });
    // Tokens stay in httpOnly cookies — never returned to browser JS.
    return withAuthCookies(
      response,
      { access: data.access, refresh: data.refresh },
      { rememberMe },
    );
  } catch (error) {
    if (error instanceof DjangoApiError) {
      const status = error.status === 401 ? 401 : error.status;
      return NextResponse.json(
        { detail: error.body?.detail ?? "Authentication failed." },
        { status },
      );
    }
    return NextResponse.json(
      { detail: "Unable to reach authentication service." },
      { status: 502 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    // No password set = no auth required (dev mode)
    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_token", "dev", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return response;
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Set a simple session cookie
  const token = Buffer.from(`${Date.now()}:${adminPassword}`).toString(
    "base64"
  );
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  return response;
}

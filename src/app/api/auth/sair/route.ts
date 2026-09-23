import { NextResponse } from "next/server";
import { clearSession, cookieValue, handlePost } from "@/server/http";
import { destroySession, SESSION_COOKIE } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(request, async () => {
    const token = cookieValue(request.headers.get("cookie") ?? "", SESSION_COOKIE);
    await destroySession(token);
    return clearSession(NextResponse.redirect(new URL("/", request.url), 303));
  });
}

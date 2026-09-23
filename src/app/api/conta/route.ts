import { NextResponse } from "next/server";
import { eraseAccount } from "@/server/account";
import { clearSession, cookieValue, handlePost, HttpError, text } from "@/server/http";
import { destroySession, SESSION_COOKIE } from "@/server/session";
import { requireUser } from "@/server/guard";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await requireUser();
    if (text(form, "confirmar") !== "sim") throw new HttpError(400, "Confirme a anonimização.");
    const token = cookieValue(request.headers.get("cookie") ?? "", SESSION_COOKIE);
    await eraseAccount(user.id);
    await destroySession(token);
    return clearSession(NextResponse.redirect(new URL("/", request.url), 303));
  }, "/conta");
}

import { NextResponse } from "next/server";
import { readAvatar } from "@/server/avatar";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Avatares ficam atrás da sessão: só contas com idade registrada veem.
export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const viewer = await currentUser();
  if (!viewer) return new NextResponse("Entre para continuar.", { status: 401 });
  const { userId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return new NextResponse("Imagem ausente.", { status: 404 });
  const user = await db.user.findUnique({ where: { id: userId }, select: { avatarName: true, deletedAt: true } });
  if (!user || user.deletedAt || !user.avatarName) return new NextResponse("Imagem ausente.", { status: 404 });
  try {
    const bytes = await readAvatar(user.avatarName);
    return new NextResponse(new Uint8Array(bytes), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    if (error instanceof HttpError) return new NextResponse(error.message, { status: error.status });
    throw error;
  }
}

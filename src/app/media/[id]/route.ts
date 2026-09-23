import { NextResponse } from "next/server";
import { canViewMedia } from "@/domain/visibility";
import { db } from "@/server/db";
import { renderMarked } from "@/server/files";
import { verifyMediaToken } from "@/server/media-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const viewerId = verifyMediaToken(token, id);
  if (!viewerId) return new NextResponse("Link recusado.", { status: 403 });
  const media = await db.media.findUnique({ where: { id }, include: { post: true } });
  if (!media) return new NextResponse("Arquivo ausente.", { status: 404 });
  const viewer = await db.user.findUnique({ where: { id: viewerId } });
  if (!viewer || viewer.deletedAt) return new NextResponse("Link recusado.", { status: 403 });
  const purchase = media.post.priceCents
    ? await db.order.findFirst({
        where: { buyerId: viewer.id, postId: media.postId, kind: "ppv", status: "posted" },
      })
    : null;
  const allowed = canViewMedia({
    viewerId: viewer.id,
    viewerRole: viewer.role,
    creatorId: media.post.creatorId,
    postStatus: media.post.status,
    mediaStatus: media.status,
    priceCents: media.post.priceCents,
    purchased: Boolean(purchase),
  });
  if (!allowed) return new NextResponse("Arquivo fechado.", { status: 403 });
  const bytes = await renderMarked(media.storageName, viewer.id);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}

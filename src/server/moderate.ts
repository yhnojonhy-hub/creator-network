import "server-only";
import { hasValidConsent } from "@/domain/visibility";
import { auditData } from "@/server/audit";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";

export async function moderatePost(actorId: string, postId: string, decision: string, reason: string) {
  const motive = reason.trim();
  if (motive.length < 3 || motive.length > 200) throw new HttpError(400, "Informe o motivo.");
  if (decision !== "aprovar" && decision !== "recusar") throw new HttpError(400, "Decisão inválida.");
  await db.$transaction(async (tx) => {
    const post = await tx.post.findUnique({ where: { id: postId }, include: { consents: true, media: true } });
    if (!post || post.status !== "quarantine") throw new HttpError(400, "Esse post não está na fila.");
    if (decision === "aprovar" && !hasValidConsent(post.consents)) {
      throw new HttpError(400, "Falta um consentimento válido.");
    }
    const status = decision === "aprovar" ? "published" : "rejected";
    await tx.post.update({ where: { id: post.id }, data: { status } });
    await tx.media.updateMany({ where: { postId: post.id }, data: { status } });
    await tx.auditEvent.create({
      data: auditData({
        actorId,
        action: decision,
        targetType: "post",
        targetId: post.id,
        reason: motive,
        before: { status: post.status },
        after: { status },
      }),
    });
  });
}

export async function moderateCreator(actorId: string, userId: string, decision: string, reason: string) {
  const motive = reason.trim();
  if (motive.length < 3 || motive.length > 200) throw new HttpError(400, "Informe o motivo.");
  if (decision !== "aprovar" && decision !== "recusar") throw new HttpError(400, "Decisão inválida.");
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt || user.creatorStatus !== "pending") {
      throw new HttpError(400, "Esse pedido não está na fila.");
    }
    const creatorStatus = decision === "aprovar" ? "approved" : "rejected";
    await tx.user.update({ where: { id: user.id }, data: { creatorStatus } });
    await tx.auditEvent.create({
      data: auditData({
        actorId,
        action: decision,
        targetType: "user",
        targetId: user.id,
        reason: motive,
        before: { creatorStatus: user.creatorStatus },
        after: { creatorStatus },
      }),
    });
  });
}

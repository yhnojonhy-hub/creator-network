import "server-only";
import { db } from "@/server/db";
import { storeUpload } from "@/server/files";
import { HttpError } from "@/server/http";

export async function createPost(
  creatorId: string,
  input: { title: string; body: string; priceCents: number; file?: { name: string; bytes: Uint8Array; type: string } },
) {
  const user = await db.user.findUnique({ where: { id: creatorId } });
  if (!user || user.deletedAt || user.creatorStatus !== "approved") {
    throw new HttpError(403, "O estúdio ainda não foi aprovado.");
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3 || title.length > 80) throw new HttpError(400, "O título precisa ser curto.");
  if (body.length < 10 || body.length > 2000) throw new HttpError(400, "O texto do post ficou fora do tamanho.");
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0 || input.priceCents > 100_000) {
    throw new HttpError(400, "O preço em centavos é inválido.");
  }
  const stored = input.file
    ? await storeUpload(input.file.name, input.file.bytes, input.file.type)
    : null;
  return db.post.create({
    data: {
      creatorId,
      title,
      body,
      priceCents: input.priceCents,
      status: "quarantine",
      media: stored
        ? {
            create: {
              storageName: stored.storageName,
              mime: stored.mime,
              sourceHash: stored.sourceHash,
              status: "quarantine",
            },
          }
        : undefined,
    },
  });
}

export async function addConsent(
  userId: string,
  input: { postId: string; kind: string; names: string; scope: string },
) {
  const post = await db.post.findUnique({ where: { id: input.postId } });
  if (!post || post.creatorId !== userId) throw new HttpError(403, "Esse post é de outro estúdio.");
  if (input.kind !== "self" && input.kind !== "other") throw new HttpError(400, "Informe quem aparece.");
  const names = input.names.trim();
  const scope = input.scope.trim();
  if (input.kind === "other" && names.length < 2) throw new HttpError(400, "Nomeie as outras pessoas.");
  if (scope.length < 8 || scope.length > 200) throw new HttpError(400, "Descreva o alcance do consentimento.");
  return db.consent.create({
    data: { postId: post.id, userId, kind: input.kind, names, scope, revoked: false },
  });
}

export async function revokeConsent(userId: string, consentId: string) {
  const consent = await db.consent.findUnique({ where: { id: consentId }, include: { post: true } });
  if (!consent || consent.post.creatorId !== userId) throw new HttpError(403, "Esse consentimento é de outro estúdio.");
  await db.$transaction(async (tx) => {
    await tx.consent.update({ where: { id: consent.id }, data: { revoked: true } });
    await tx.post.update({ where: { id: consent.postId }, data: { status: "quarantine" } });
    await tx.media.updateMany({ where: { postId: consent.postId }, data: { status: "quarantine" } });
  });
}

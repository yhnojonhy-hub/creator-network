import "server-only";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";

export async function sendMessage(senderId: string, recipientId: string, body: string) {
  const text = body.trim();
  if (text.length < 1 || text.length > 2000) throw new HttpError(400, "A mensagem ficou fora do tamanho.");
  if (senderId === recipientId) throw new HttpError(400, "Escolha outra conta.");
  const recipient = await db.user.findUnique({ where: { id: recipientId } });
  if (!recipient || recipient.deletedAt) throw new HttpError(400, "Essa conta não recebe mensagem.");
  await db.chatMessage.create({ data: { senderId, recipientId, body: text } });
}

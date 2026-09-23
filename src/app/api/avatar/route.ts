import { removeAvatar, storeAvatar } from "@/server/avatar";
import { db } from "@/server/db";
import { requireUser } from "@/server/guard";
import { handlePost, HttpError, text } from "@/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handlePost(
    request,
    async (form, back) => {
      const user = await requireUser();
      const current = await db.user.findUnique({ where: { id: user.id }, select: { avatarName: true } });
      const previous = current?.avatarName ?? "";
      if (text(form, "acao") === "remover") {
        await db.user.update({ where: { id: user.id }, data: { avatarName: "" } });
        if (previous) await removeAvatar(previous);
        return;
      }
      const file = form.get("foto");
      if (!(file instanceof File)) throw new HttpError(400, "Escolha uma imagem antes de enviar.");
      const name = await storeAvatar(file.name, new Uint8Array(await file.arrayBuffer()), file.type);
      await db.user.update({ where: { id: user.id }, data: { avatarName: name } });
      if (previous) await removeAvatar(previous);
      void back;
    },
    "/conta",
    6_500_000,
  );
}

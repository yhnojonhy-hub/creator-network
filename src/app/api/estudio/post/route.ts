import { requireUser } from "@/server/guard";
import { handlePost, HttpError, text } from "@/server/http";
import { createPost } from "@/server/studio";

export async function POST(request: Request) {
  return handlePost(
    request,
    async (form) => {
      const user = await requireUser();
      const file = form.get("arquivo");
      let upload: { name: string; bytes: Uint8Array; type: string } | undefined;
      if (file instanceof File && file.size > 0) {
        upload = { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()), type: file.type };
      }
      const price = Number(text(form, "priceCents"));
      if (!Number.isInteger(price)) throw new HttpError(400, "O preço em centavos é inválido.");
      await createPost(user.id, {
        title: text(form, "title"),
        body: text(form, "body"),
        priceCents: price,
        file: upload,
      });
    },
    "/estudio",
    6_500_000,
  );
}

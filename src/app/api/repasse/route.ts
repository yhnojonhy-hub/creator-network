import { requestPayout } from "@/server/commerce";
import { requireUser } from "@/server/guard";
import { handlePost, HttpError, text } from "@/server/http";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await requireUser();
    if (user.creatorStatus !== "approved") throw new HttpError(403, "O estúdio ainda não foi aprovado.");
    await requestPayout(user.id, text(form, "amountCents"), text(form, "chave"));
  }, "/estudio");
}

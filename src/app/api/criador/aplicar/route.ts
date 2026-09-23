import { applyAsCreator } from "@/server/account";
import { requireUser } from "@/server/guard";
import { handlePost, text } from "@/server/http";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await requireUser();
    await applyAsCreator(user.id, text(form, "displayName"), text(form, "bio"));
  }, "/estudio");
}

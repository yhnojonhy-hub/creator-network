import { requireUser } from "@/server/guard";
import { handlePost, text } from "@/server/http";
import { addConsent } from "@/server/studio";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await requireUser();
    await addConsent(user.id, {
      postId: text(form, "postId"),
      kind: text(form, "kind"),
      names: text(form, "names"),
      scope: text(form, "scope"),
    });
  }, "/estudio");
}

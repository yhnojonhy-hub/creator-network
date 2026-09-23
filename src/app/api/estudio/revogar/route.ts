import { requireUser } from "@/server/guard";
import { handlePost, text } from "@/server/http";
import { revokeConsent } from "@/server/studio";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await requireUser();
    await revokeConsent(user.id, text(form, "consentId"));
  }, "/estudio");
}

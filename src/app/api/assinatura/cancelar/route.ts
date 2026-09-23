import { cancelSubscription } from "@/server/commerce";
import { requireUser } from "@/server/guard";
import { handlePost, text } from "@/server/http";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await requireUser();
    await cancelSubscription(user.id, text(form, "creatorId"));
  }, "/saldo");
}

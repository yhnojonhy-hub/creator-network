import { requireAdmin } from "@/server/guard";
import { handlePost, text } from "@/server/http";
import { moderateCreator } from "@/server/moderate";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await requireAdmin();
    await moderateCreator(user.id, text(form, "userId"), text(form, "decision"), text(form, "reason"));
  }, "/admin");
}

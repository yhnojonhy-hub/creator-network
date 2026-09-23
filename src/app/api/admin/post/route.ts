import { requireAdmin } from "@/server/guard";
import { handlePost, text } from "@/server/http";
import { moderatePost } from "@/server/moderate";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await requireAdmin();
    await moderatePost(user.id, text(form, "postId"), text(form, "decision"), text(form, "reason"));
  }, "/admin");
}

import { sendMessage } from "@/server/chat";
import { requireUser } from "@/server/guard";
import { handlePost, redirectTo, text } from "@/server/http";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await requireUser();
    const recipientId = text(form, "recipientId");
    await sendMessage(user.id, recipientId, text(form, "body"));
    return redirectTo(request, `/chat/${recipientId}`);
  }, "/chat");
}

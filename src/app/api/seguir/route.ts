import { followCreator } from "@/server/commerce";
import { requireUser } from "@/server/guard";
import { handlePost, text } from "@/server/http";

export async function POST(request: Request) {
  return handlePost(
    request,
    async (form) => {
      const user = await requireUser();
      await followCreator(user.id, text(form, "creatorId"));
    },
    "/feed",
  );
}

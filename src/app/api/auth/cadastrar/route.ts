import { registerUser } from "@/server/account";
import { storeAvatar } from "@/server/avatar";
import { db } from "@/server/db";
import { handlePost, redirectTo, text, withSession } from "@/server/http";
import { createSession } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(
    request,
    async (form) => {
      const user = await registerUser({
        email: text(form, "email"),
        password: text(form, "password"),
        displayName: text(form, "displayName"),
        birthDate: text(form, "birthDate"),
      });
      const file = form.get("foto");
      if (file instanceof File && file.size > 0) {
        const name = await storeAvatar(file.name, new Uint8Array(await file.arrayBuffer()), file.type);
        await db.user.update({ where: { id: user.id }, data: { avatarName: name } });
      }
      const token = await createSession(user.id);
      return withSession(redirectTo(request, "/feed"), token);
    },
    "/cadastrar",
    6_500_000,
  );
}

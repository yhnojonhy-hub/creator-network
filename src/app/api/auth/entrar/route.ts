import { loginUser } from "@/server/account";
import { handlePost, redirectTo, text, withSession } from "@/server/http";
import { createSession } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(
    request,
    async (form) => {
      const user = await loginUser(text(form, "email"), text(form, "password"));
      const token = await createSession(user.id);
      return withSession(redirectTo(request, "/feed"), token);
    },
    "/entrar",
  );
}

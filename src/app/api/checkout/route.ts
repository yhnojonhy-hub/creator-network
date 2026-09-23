import { checkout } from "@/server/commerce";
import { requireUser } from "@/server/guard";
import { handlePost, redirectTo, text } from "@/server/http";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await requireUser();
    const orderId = await checkout({
      buyerId: user.id,
      kind: text(form, "kind"),
      creatorId: text(form, "creatorId"),
      postId: text(form, "postId"),
      amountCents: text(form, "amountCents"),
      offerText: text(form, "offerText"),
      note: text(form, "descricao"),
      chave: text(form, "chave"),
    });
    return redirectTo(request, `/pedido/${orderId}`);
  }, "/feed");
}

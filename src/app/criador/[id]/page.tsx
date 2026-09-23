import { notFound } from "next/navigation";
import { ErrorNote, KeyField, Money, Shell, StateMark } from "@/components/Shell";
import { describeOffer, REQUEST_AMOUNTS, TIP_AMOUNTS } from "@/domain/offer";
import { canViewMedia } from "@/domain/visibility";
import { pageUser } from "@/server/guard";
import { signMediaToken } from "@/server/media-token";
import { creatorView } from "@/server/read";

export default async function CreatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await pageUser();
  const { id } = await params;
  const { erro } = await searchParams;
  const view = await creatorView(user.id, id);
  if (!view) notFound();
  const { creator, posts, following, subscription, purchased } = view;
  const back = `/criador/${creator.id}`;
  const subscribeOffer = describeOffer({
    kind: "subscribe",
    creatorName: creator.displayName,
    amountCents: creator.subscriptionPriceCents,
  });
  return (
    <Shell user={user}>
      <h1>{creator.displayName}</h1>
      <p>{creator.bio}</p>
      <ErrorNote message={erro} />
      {user.id !== creator.id ? (
        <form action="/api/seguir" method="post">
          <input type="hidden" name="voltar" value={back} />
          <input type="hidden" name="creatorId" value={creator.id} />
          <button type="submit">{following ? "Acompanhando" : "Acompanhar"}</button>
        </form>
      ) : null}
      {user.id !== creator.id && subscription?.status !== "active" ? (
        <form action="/api/checkout" method="post">
          <input type="hidden" name="voltar" value={back} />
          <input type="hidden" name="kind" value="subscribe" />
          <input type="hidden" name="creatorId" value={creator.id} />
          <input type="hidden" name="amountCents" value={String(creator.subscriptionPriceCents)} />
          <input type="hidden" name="offerText" value={subscribeOffer} />
          <p>{subscribeOffer}</p>
          <p>
            <Money cents={creator.subscriptionPriceCents} />
          </p>
          <KeyField />
          <p>
            <button type="submit">Confirmar pagamento simulado</button>
          </p>
        </form>
      ) : null}
      {subscription?.status === "active" ? (
        <form action="/api/assinatura/cancelar" method="post">
          <input type="hidden" name="voltar" value={back} />
          <input type="hidden" name="creatorId" value={creator.id} />
          <p>
            Assinatura <StateMark status="active" /> Cancelar marca o fim e não apaga o lançamento.
          </p>
          <button type="submit">Cancelar assinatura</button>
        </form>
      ) : null}
      {user.id !== creator.id ? (
        <form action="/api/checkout" method="post">
          <input type="hidden" name="voltar" value={back} />
          <input type="hidden" name="kind" value="tip" />
          <input type="hidden" name="creatorId" value={creator.id} />
          <p>Gorjeta simulada</p>
          <ul>
            {TIP_AMOUNTS.map((amount) => (
              <li key={amount}>
                {describeOffer({ kind: "tip", creatorName: creator.displayName, amountCents: amount })}
              </li>
            ))}
          </ul>
          <label>
            Valor em centavos
            <select name="amountCents" defaultValue="500">
              {TIP_AMOUNTS.map((amount) => (
                <option key={amount} value={amount}>
                  {amount}
                </option>
              ))}
            </select>
          </label>
          <KeyField />
          <p>
            <button type="submit">Confirmar pagamento simulado</button>
          </p>
        </form>
      ) : null}
      {user.id !== creator.id ? (
        <form action="/api/checkout" method="post">
          <input type="hidden" name="voltar" value={back} />
          <input type="hidden" name="kind" value="request" />
          <input type="hidden" name="creatorId" value={creator.id} />
          <p>
            Pedido sob medida para {creator.displayName}. O pagamento simulado fica em reserva até a aceitação.
          </p>
          <label>
            Descrição
            <textarea name="descricao" required minLength={8} maxLength={280} />
          </label>
          <label>
            Valor em centavos
            <select name="amountCents" defaultValue="1000">
              {REQUEST_AMOUNTS.map((amount) => (
                <option key={amount} value={amount}>
                  {amount}
                </option>
              ))}
            </select>
          </label>
          <KeyField />
          <p>
            <button type="submit">Confirmar pagamento simulado</button>
          </p>
        </form>
      ) : null}
      <p>
        <a href={`/chat/${creator.id}`}>Conversar</a>
      </p>
      <div className="grid gap-8">
        {posts.map((post) => {
          const offer = describeOffer({
            kind: "ppv",
            creatorName: creator.displayName,
            amountCents: post.priceCents,
            title: post.title,
          });
          return (
            <article key={post.id}>
              <h2>{post.title}</h2>
              <p>{post.body}</p>
              <p>
                <Money cents={post.priceCents} />
              </p>
              {post.media
                .filter((media) =>
                  canViewMedia({
                    viewerId: user.id,
                    viewerRole: user.role,
                    creatorId: creator.id,
                    postStatus: post.status,
                    mediaStatus: media.status,
                    priceCents: post.priceCents,
                    purchased: purchased.has(post.id),
                  }),
                )
                .map((media) => (
                  <img
                    key={media.id}
                    alt={post.title}
                    className="mt-3 max-w-full"
                    src={`/media/${media.id}?token=${encodeURIComponent(signMediaToken(media.id, user.id))}`}
                  />
                ))}
              {post.priceCents > 0 && user.id !== creator.id && !purchased.has(post.id) ? (
                <form action="/api/checkout" method="post">
                  <input type="hidden" name="voltar" value={back} />
                  <input type="hidden" name="kind" value="ppv" />
                  <input type="hidden" name="creatorId" value={creator.id} />
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="amountCents" value={String(post.priceCents)} />
                  <input type="hidden" name="offerText" value={offer} />
                  <p>{offer}</p>
                  <KeyField />
                  <p>
                    <button type="submit">Confirmar pagamento simulado</button>
                  </p>
                </form>
              ) : null}
            </article>
          );
        })}
      </div>
    </Shell>
  );
}

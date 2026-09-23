import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, ErrorNote, KeyField, LockIcon, Money, Shell, StateMark } from "@/components/Shell";
import { formatCents } from "@/domain/money";
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
  const own = user.id === creator.id;
  const subscribed = subscription?.status === "active";
  const subscribeOffer = describeOffer({
    kind: "subscribe",
    creatorName: creator.displayName,
    amountCents: creator.subscriptionPriceCents,
  });
  return (
    <Shell user={user}>
      <div className="creator-head">
        <Avatar userId={creator.id} name={creator.displayName} hasAvatar={Boolean(creator.avatarName)} size="lg" />
        <div>
          <h1>{creator.displayName}</h1>
          <p className="bio">{creator.bio}</p>
          {!own ? (
            <div className="actions" style={{ marginTop: "0.9rem" }}>
              {subscribed ? (
                <form action="/api/assinatura/cancelar" method="post">
                  <input type="hidden" name="voltar" value={back} />
                  <input type="hidden" name="creatorId" value={creator.id} />
                  <StateMark status="active" /> <button type="submit" className="quiet">Cancelar assinatura</button>
                </form>
              ) : (
                <form action="/api/checkout" method="post">
                  <input type="hidden" name="voltar" value={back} />
                  <input type="hidden" name="kind" value="subscribe" />
                  <input type="hidden" name="creatorId" value={creator.id} />
                  <input type="hidden" name="amountCents" value={String(creator.subscriptionPriceCents)} />
                  <input type="hidden" name="offerText" value={subscribeOffer} />
                  <KeyField />
                  <button type="submit" className="amber">
                    Assinar por {formatCents(creator.subscriptionPriceCents)} ao mês
                  </button>
                </form>
              )}
              <form action="/api/seguir" method="post">
                <input type="hidden" name="voltar" value={back} />
                <input type="hidden" name="creatorId" value={creator.id} />
                <button type="submit">{following ? "Acompanhando" : "Acompanhar"}</button>
              </form>
              <Link className="button quiet" href={`/chat/${creator.id}`}>
                Conversar
              </Link>
            </div>
          ) : null}
        </div>
      </div>
      <ErrorNote message={erro} />
      {!own ? (
        <p className="meta" style={{ fontSize: "0.9rem" }}>
          Pagamentos simulados. Nenhum valor real sai da sua conta.
        </p>
      ) : null}

      <div className="feed">
        {posts.map((post) => {
          const offer = describeOffer({
            kind: "ppv",
            creatorName: creator.displayName,
            amountCents: post.priceCents,
            title: post.title,
          });
          const visible = post.media.filter((media) =>
            canViewMedia({
              viewerId: user.id,
              viewerRole: user.role,
              creatorId: creator.id,
              postStatus: post.status,
              mediaStatus: media.status,
              priceCents: post.priceCents,
              purchased: purchased.has(post.id),
            }),
          );
          const first = visible[0];
          const canBuy = post.priceCents > 0 && !own && !purchased.has(post.id);
          return (
            <article key={post.id} className="post">
              {post.media.length > 0 ? (
                <div className="frame">
                  {first ? (
                    <img alt={post.title} src={`/media/${first.id}?token=${encodeURIComponent(signMediaToken(first.id, user.id))}`} />
                  ) : (
                    <div className="locked">
                      <LockIcon />
                      <strong>Arquivo fechado</strong>
                      <span>{post.priceCents > 0 ? "Abre com a compra avulsa." : "Abre com a assinatura."}</span>
                    </div>
                  )}
                </div>
              ) : null}
              <div className="body">
                <h2>{post.title}</h2>
                <p>{post.body}</p>
                <div className="price">
                  {post.priceCents > 0 ? <Money cents={post.priceCents} /> : <span className="meta">incluído na assinatura</span>}
                  {purchased.has(post.id) ? <StateMark status="posted" /> : null}
                </div>
                {canBuy ? (
                  <form action="/api/checkout" method="post">
                    <input type="hidden" name="voltar" value={back} />
                    <input type="hidden" name="kind" value="ppv" />
                    <input type="hidden" name="creatorId" value={creator.id} />
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="amountCents" value={String(post.priceCents)} />
                    <input type="hidden" name="offerText" value={offer} />
                    <KeyField />
                    <button type="submit" className="amber">
                      Comprar por {formatCents(post.priceCents)}
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {posts.length === 0 ? <p className="meta">Nenhum post publicado ainda.</p> : null}

      {!own ? (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginTop: "2.5rem" }}>
          <section className="panel" style={{ margin: 0 }}>
            <h2>Gorjeta</h2>
            <p className="meta">Vai direto para o livro-caixa de {creator.displayName}.</p>
            <form action="/api/checkout" method="post">
              <input type="hidden" name="voltar" value={back} />
              <input type="hidden" name="kind" value="tip" />
              <input type="hidden" name="creatorId" value={creator.id} />
              <label>
                Valor
                <select name="amountCents" defaultValue="500">
                  {TIP_AMOUNTS.map((amount) => (
                    <option key={amount} value={amount}>
                      {formatCents(amount)}
                    </option>
                  ))}
                </select>
              </label>
              <KeyField />
              <p className="actions">
                <button type="submit">Deixar gorjeta</button>
              </p>
            </form>
          </section>
          <section className="panel" style={{ margin: 0 }}>
            <h2>Pedido sob medida</h2>
            <p className="meta">O valor fica em reserva até {creator.displayName} aceitar. Se recusar, volta.</p>
            <form action="/api/checkout" method="post">
              <input type="hidden" name="voltar" value={back} />
              <input type="hidden" name="kind" value="request" />
              <input type="hidden" name="creatorId" value={creator.id} />
              <label>
                O que você quer
                <textarea name="descricao" required minLength={8} maxLength={280} rows={3} />
              </label>
              <label>
                Valor
                <select name="amountCents" defaultValue="1000">
                  {REQUEST_AMOUNTS.map((amount) => (
                    <option key={amount} value={amount}>
                      {formatCents(amount)}
                    </option>
                  ))}
                </select>
              </label>
              <KeyField />
              <p className="actions">
                <button type="submit">Enviar pedido</button>
              </p>
            </form>
          </section>
        </div>
      ) : null}
    </Shell>
  );
}

import Link from "next/link";
import { Avatar, Balance, ErrorNote, KeyField, Money, Shell, StateMark } from "@/components/Shell";
import { hasValidConsent } from "@/domain/visibility";
import { db } from "@/server/db";
import { pageUser } from "@/server/guard";
import { signMediaToken } from "@/server/media-token";
import { studioData } from "@/server/read";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await pageUser();
  const { erro } = await searchParams;
  if (user.creatorStatus !== "approved") {
    return (
      <Shell user={user}>
        <h1>Publicar no Estúdio</h1>
        <p className="meta">
          Quem publica pede acesso e entra depois de uma revisão humana. Você precisa de um nome público e de uma
          apresentação.
        </p>
        <p>
          <StateMark status={user.creatorStatus === "none" ? "none" : user.creatorStatus} />
        </p>
        <ErrorNote message={erro} />
        {user.creatorStatus === "pending" ? <p>Seu pedido está na fila de revisão. Você recebe o estúdio assim que alguém aprovar.</p> : null}
        {user.creatorStatus !== "pending" ? (
          <form action="/api/criador/aplicar" method="post">
            <input type="hidden" name="voltar" value="/estudio" />
            <label>
              Nome público
              <input name="displayName" defaultValue={user.displayName} required minLength={2} maxLength={80} />
            </label>
            <label>
              Apresentação
              <span className="help">De 10 a 500 caracteres. Aparece na página do seu estúdio.</span>
              <textarea name="bio" required minLength={10} maxLength={500} defaultValue={user.bio} rows={4} />
            </label>
            <p className="actions">
              <button type="submit" className="amber">
                Pedir acesso ao estúdio
              </button>
            </p>
          </form>
        ) : null}
      </Shell>
    );
  }
  const [data, row] = await Promise.all([
    studioData(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { avatarName: true } }),
  ]);
  return (
    <Shell user={user}>
      <div className="creator-head">
        <Avatar userId={user.id} name={user.displayName} hasAvatar={Boolean(row?.avatarName)} size="lg" />
        <div>
          <h1>{user.displayName}</h1>
          <p className="bio">{user.bio}</p>
          <p style={{ margin: "0.5rem 0 0" }}>
            <Link href={`/criador/${user.id}`}>Ver como o público vê</Link> · <Link href="/conta">Trocar a imagem</Link>
          </p>
        </div>
      </div>
      <ErrorNote message={erro} />

      <Balance cents={data.posted} caption="Saldo lançado" />
      <div className="stats">
        <div>
          <strong>
            <Money cents={Math.abs(data.reserved)} />
          </strong>
          <span>em reserva</span>
        </div>
        <div>
          <strong>{data.newSubscribers}</strong>
          <span>assinantes novos em 7 dias</span>
        </div>
        <div>
          <strong>{data.ppvBuyers}</strong>
          <span>compradores de arquivo avulso</span>
        </div>
        <div>
          <strong>{data.cancellationRisk}</strong>
          <span>risco de cancelamento</span>
        </div>
      </div>

      <section className="panel">
        <h2>Repasse</h2>
        <p className="meta">
          Simulado, sem KYC. O pedido cria uma reserva no livro-caixa e fica registrado na auditoria.
        </p>
        <form action="/api/repasse" method="post">
          <input type="hidden" name="voltar" value="/estudio" />
          <label>
            Valor em centavos
            <input name="amountCents" inputMode="numeric" required min={100} placeholder="ex.: 5000 para R$ 50,00" />
          </label>
          <KeyField />
          <p className="actions">
            <button type="submit">Pedir repasse</button>
          </p>
        </form>
      </section>

      <section className="panel">
        <h2>Novo post</h2>
        <p className="meta">O envio entra em quarentena e só publica depois da revisão humana e de um consentimento.</p>
        <form action="/api/estudio/post" method="post" encType="multipart/form-data">
          <input type="hidden" name="voltar" value="/estudio" />
          <label>
            Título
            <input name="title" required minLength={3} maxLength={80} />
          </label>
          <label>
            Texto
            <textarea name="body" required minLength={10} maxLength={2000} rows={4} />
          </label>
          <label>
            Preço em centavos
            <span className="help">0 deixa o post dentro da assinatura.</span>
            <input name="priceCents" inputMode="numeric" required defaultValue="0" />
          </label>
          <label>
            Arquivo
            <span className="help">JPEG, PNG ou WebP até 5 MB. Guardamos o SHA-256 do original.</span>
            <input name="arquivo" type="file" accept="image/jpeg,image/png,image/webp" />
          </label>
          <p className="actions">
            <button type="submit" className="amber">
              Enviar para quarentena
            </button>
          </p>
        </form>
      </section>

      <h2>Pedidos em reserva</h2>
      {data.requests.length === 0 ? <p className="meta">Nenhum pedido esperando resposta.</p> : null}
      {data.requests.map((order) => (
        <article key={order.id} className="panel hold">
          <StateMark status="hold" />
          <p style={{ marginTop: "0.6rem" }}>{order.offerText}</p>
          <p>
            <Money cents={order.amountCents} />
          </p>
          <div className="actions" style={{ marginTop: "0.6rem" }}>
            <form action="/api/pedido/aceitar" method="post">
              <input type="hidden" name="voltar" value="/estudio" />
              <input type="hidden" name="orderId" value={order.id} />
              <button type="submit" className="amber">
                Aceitar pedido
              </button>
            </form>
            <form action="/api/pedido/recusar" method="post">
              <input type="hidden" name="voltar" value="/estudio" />
              <input type="hidden" name="orderId" value={order.id} />
              <button type="submit">Recusar</button>
            </form>
          </div>
        </article>
      ))}

      <h2>Seus posts</h2>
      {data.posts.length === 0 ? <p className="meta">Nenhum post ainda.</p> : null}
      {data.posts.map((post) => (
        <article key={post.id} className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline", flexWrap: "wrap" }}>
            <h3>{post.title}</h3>
            <StateMark status={post.status} />
          </div>
          <p>{post.body}</p>
          <p>
            {post.priceCents > 0 ? <Money cents={post.priceCents} /> : <span className="meta">dentro da assinatura</span>}
            {" · "}
            <span className={hasValidConsent(post.consents) ? "meta" : ""} style={hasValidConsent(post.consents) ? undefined : { color: "var(--color-steel)" }}>
              {hasValidConsent(post.consents) ? "consentimento registrado" : "falta consentimento"}
            </span>
          </p>
          {post.media.map((media) => (
            <img
              key={media.id}
              alt={post.title}
              style={{ maxWidth: "100%", borderRadius: "12px", display: "block", margin: "0.6rem 0" }}
              src={`/media/${media.id}?token=${encodeURIComponent(signMediaToken(media.id, user.id))}`}
            />
          ))}
          <details style={{ marginTop: "0.8rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Consentimento de quem aparece</summary>
            <form action="/api/estudio/consentimento" method="post">
              <input type="hidden" name="voltar" value="/estudio" />
              <input type="hidden" name="postId" value={post.id} />
              <label>
                Quem aparece
                <select name="kind" defaultValue="self">
                  <option value="self">Eu</option>
                  <option value="other">Outras pessoas</option>
                </select>
              </label>
              <label>
                Nomes
                <span className="help">Só quando outras pessoas aparecem.</span>
                <input name="names" maxLength={200} />
              </label>
              <label>
                Alcance
                <input name="scope" required minLength={8} maxLength={200} defaultValue="publicação deste estudo no estúdio" />
              </label>
              <p className="actions">
                <button type="submit">Registrar consentimento</button>
              </p>
            </form>
            {post.consents.map((consent) => (
              <form key={consent.id} action="/api/estudio/revogar" method="post" style={{ marginTop: "0.6rem" }}>
                <input type="hidden" name="voltar" value="/estudio" />
                <input type="hidden" name="consentId" value={consent.id} />
                <p style={{ margin: 0 }}>
                  {consent.kind === "self" ? "Eu" : consent.names}, {consent.scope}{" "}
                  <StateMark status={consent.revoked ? "canceled" : "active"} />
                </p>
                {consent.revoked ? null : (
                  <button type="submit" className="quiet" style={{ marginTop: "0.4rem" }}>
                    Revogar
                  </button>
                )}
              </form>
            ))}
          </details>
        </article>
      ))}
    </Shell>
  );
}

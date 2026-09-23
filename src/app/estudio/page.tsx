import { Balance, ErrorNote, KeyField, Money, Shell, StateMark } from "@/components/Shell";
import { hasValidConsent } from "@/domain/visibility";
import { pageUser } from "@/server/guard";
import { signMediaToken } from "@/server/media-token";
import { studioData } from "@/server/read";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await pageUser();
  const { erro } = await searchParams;
  if (user.creatorStatus !== "approved") {
    return (
      <Shell user={user}>
        <h1>Pedido de estúdio</h1>
        <StateMark status={user.creatorStatus === "none" ? "none" : user.creatorStatus} />
        <ErrorNote message={erro} />
        {user.creatorStatus === "pending" ? <p>O estúdio espera aprovação humana.</p> : null}
        {user.creatorStatus !== "pending" ? (
          <form action="/api/criador/aplicar" method="post">
            <input type="hidden" name="voltar" value="/estudio" />
            <label>
              Nome público
              <input name="displayName" defaultValue={user.displayName} required minLength={2} maxLength={80} />
            </label>
            <label>
              Bio
              <textarea name="bio" required minLength={10} maxLength={500} defaultValue={user.bio} />
            </label>
            <p>
              <button type="submit">Pedir acesso ao estúdio</button>
            </p>
          </form>
        ) : null}
      </Shell>
    );
  }
  const data = await studioData(user.id);
  return (
    <Shell user={user}>
      <h1>Estúdio de {user.displayName}</h1>
      <ErrorNote message={erro} />
      <Balance cents={data.posted} caption="Saldo lançado" />
      <p>
        Em reserva <Money cents={Math.abs(data.reserved)} />
      </p>
      <section className="grid gap-2">
        <h2>Relação com quem acompanha</h2>
        <p>
          Assinantes novos em 7 dias <span className="text-signal">{data.newSubscribers}</span>
        </p>
        <p>
          Risco de cancelamento <span className="text-signal">{data.cancellationRisk}</span>
        </p>
        <p>
          Compradores de arquivo avulso <span className="text-signal">{data.ppvBuyers}</span>
        </p>
      </section>
      <form action="/api/repasse" method="post">
        <input type="hidden" name="voltar" value="/estudio" />
        <h2>Repasse</h2>
        <p>O repasse é simulado. Não há KYC real. O pedido cria uma reserva, que é um lançamento ainda não postado.</p>
        <label>
          Valor em centavos
          <input name="amountCents" inputMode="numeric" required min={100} />
        </label>
        <KeyField />
        <p>
          <button type="submit">Pedir repasse</button>
        </p>
      </form>
      <form action="/api/estudio/post" method="post" encType="multipart/form-data">
        <input type="hidden" name="voltar" value="/estudio" />
        <h2>Novo post</h2>
        <p>O envio entra em quarentena. Publica depois da revisão humana e de um consentimento.</p>
        <label>
          Título
          <input name="title" required minLength={3} maxLength={80} />
        </label>
        <label>
          Texto
          <textarea name="body" required minLength={10} maxLength={2000} />
        </label>
        <label>
          Preço em centavos
          <input name="priceCents" inputMode="numeric" required defaultValue="0" />
        </label>
        <label>
          Arquivo jpeg, png ou webp
          <input name="arquivo" type="file" accept="image/jpeg,image/png,image/webp" />
        </label>
        <p>
          <button type="submit">Enviar para quarentena</button>
        </p>
      </form>
      <h2>Pedidos em reserva</h2>
      {data.requests.length === 0 ? <p>Nenhum pedido em reserva.</p> : null}
      {data.requests.map((order) => (
        <article key={order.id} className="quarantine">
          <StateMark status="hold" />
          <p>{order.offerText}</p>
          <p>
            <Money cents={order.amountCents} />
          </p>
          <form action="/api/pedido/aceitar" method="post">
            <input type="hidden" name="voltar" value="/estudio" />
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit">Aceitar pedido</button>
          </form>
          <form action="/api/pedido/recusar" method="post">
            <input type="hidden" name="voltar" value="/estudio" />
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit">Recusar pedido</button>
          </form>
        </article>
      ))}
      <h2>Posts</h2>
      {data.posts.map((post) => (
        <article key={post.id} className={post.status === "quarantine" ? "quarantine" : "my-6"}>
          <h3>{post.title}</h3>
          <StateMark status={post.status} />
          <p>{post.body}</p>
          <p>
            <Money cents={post.priceCents} />
          </p>
          <p className="text-signal">{hasValidConsent(post.consents) ? "consentimento presente" : "falta consentimento"}</p>
          {post.media.map((media) => (
            <img
              key={media.id}
              alt={post.title}
              className="mt-3 max-w-full"
              src={`/media/${media.id}?token=${encodeURIComponent(signMediaToken(media.id, user.id))}`}
            />
          ))}
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
              <input name="names" maxLength={200} />
            </label>
            <label>
              Alcance
              <input name="scope" required minLength={8} maxLength={200} defaultValue="publicação deste estudo no estúdio" />
            </label>
            <p>
              <button type="submit">Registrar consentimento</button>
            </p>
          </form>
          {post.consents.map((consent) => (
            <form key={consent.id} action="/api/estudio/revogar" method="post">
              <input type="hidden" name="voltar" value="/estudio" />
              <input type="hidden" name="consentId" value={consent.id} />
              <p>
                {consent.kind === "self" ? "Eu" : consent.names} · {consent.scope} ·{" "}
                <span className="text-signal">{consent.revoked ? "revogado" : "vigente"}</span>
              </p>
              {consent.revoked ? null : <button type="submit">Revogar consentimento</button>}
            </form>
          ))}
        </article>
      ))}
    </Shell>
  );
}

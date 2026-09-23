import { Balance, ErrorNote, Shell, StateMark } from "@/components/Shell";
import { hasValidConsent } from "@/domain/visibility";
import { pageAdmin } from "@/server/guard";
import { signMediaToken } from "@/server/media-token";
import { adminQueue } from "@/server/read";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await pageAdmin();
  const { erro } = await searchParams;
  const queue = await adminQueue();
  return (
    <Shell user={user}>
      <h1>Fila</h1>
      <ErrorNote message={erro} />
      <Balance cents={queue.platform} caption="Taxa lançada" />
      <h2>Pedidos de estúdio</h2>
      {queue.creators.length === 0 ? <p>Nenhum pedido de estúdio.</p> : null}
      {queue.creators.map((creator) => (
        <article key={creator.id} className="panel">
          <h3>{creator.displayName}</h3>
          <p>{creator.bio}</p>
          <StateMark status="pending" />
          <form action="/api/admin/criador" method="post">
            <input type="hidden" name="voltar" value="/admin" />
            <input type="hidden" name="userId" value={creator.id} />
            <input type="hidden" name="decision" value="aprovar" />
            <label>
              Motivo
              <input name="reason" defaultValue="revisão humana" required />
            </label>
            <p>
              <button type="submit" className="amber">Aprovar estúdio</button>
            </p>
          </form>
          <form action="/api/admin/criador" method="post">
            <input type="hidden" name="voltar" value="/admin" />
            <input type="hidden" name="userId" value={creator.id} />
            <input type="hidden" name="decision" value="recusar" />
            <label>
              Motivo
              <input name="reason" defaultValue="revisão humana" required />
            </label>
            <p>
              <button type="submit">Recusar estúdio</button>
            </p>
          </form>
        </article>
      ))}
      <h2>Posts em quarentena</h2>
      {queue.posts.length === 0 ? <p>Nenhum post em quarentena.</p> : null}
      {queue.posts.map((post) => (
        <article key={post.id} className="panel hold">
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <p>{post.creator.displayName}</p>
          <StateMark status="quarantine" />
          <p className="text-signal">{hasValidConsent(post.consents) ? "consentimento presente" : "falta consentimento"}</p>
          {post.media.map((media) => (
            <img
              key={media.id}
              alt={post.title}
              style={{ maxWidth: "100%", borderRadius: "12px", display: "block", margin: "0.6rem 0" }}
              src={`/media/${media.id}?token=${encodeURIComponent(signMediaToken(media.id, user.id))}`}
            />
          ))}
          <form action="/api/admin/post" method="post">
            <input type="hidden" name="voltar" value="/admin" />
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="decision" value="aprovar" />
            <label>
              Motivo
              <input name="reason" defaultValue="revisão humana" required />
            </label>
            <p>
              <button type="submit" className="amber">Aprovar post</button>
            </p>
          </form>
          <form action="/api/admin/post" method="post">
            <input type="hidden" name="voltar" value="/admin" />
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="decision" value="recusar" />
            <label>
              Motivo
              <input name="reason" defaultValue="revisão humana" required />
            </label>
            <p>
              <button type="submit">Recusar post</button>
            </p>
          </form>
        </article>
      ))}
    </Shell>
  );
}

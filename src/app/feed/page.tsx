import Link from "next/link";
import { Avatar, ErrorNote, LockIcon, Money, Shell } from "@/components/Shell";
import { canViewMedia } from "@/domain/visibility";
import { signMediaToken } from "@/server/media-token";
import { feedPosts, purchasedPostIds } from "@/server/read";
import { pageUser } from "@/server/guard";

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await pageUser();
  const { erro } = await searchParams;
  const [posts, purchased] = await Promise.all([feedPosts(), purchasedPostIds(user.id)]);
  return (
    <Shell user={user}>
      <h1>Posts publicados</h1>
      <p className="meta">Só o que passou pela revisão e tem consentimento. Arquivos pagos abrem depois da compra.</p>
      <ErrorNote message={erro} />
      {posts.length === 0 ? <p>Nenhum post publicado ainda.</p> : null}
      <div className="feed">
        {posts.map((post) => {
          const visible = post.media.filter((media) =>
            canViewMedia({
              viewerId: user.id,
              viewerRole: user.role,
              creatorId: post.creatorId,
              postStatus: post.status,
              mediaStatus: media.status,
              priceCents: post.priceCents,
              purchased: purchased.has(post.id),
            }),
          );
          const first = visible[0];
          return (
            <article key={post.id} className="post">
              <Link href={`/criador/${post.creatorId}`} className="byline">
                <Avatar userId={post.creatorId} name={post.creator.displayName} hasAvatar={Boolean(post.creator.avatarName)} />
                <strong>{post.creator.displayName}</strong>
              </Link>
              {post.media.length > 0 ? (
                <div className="frame">
                  {first ? (
                    <img alt={post.title} src={`/media/${first.id}?token=${encodeURIComponent(signMediaToken(first.id, user.id))}`} />
                  ) : (
                    <div className="locked">
                      <LockIcon />
                      <strong>Arquivo fechado</strong>
                      {post.priceCents > 0 ? <span>Abre com a compra avulsa na página do estúdio.</span> : <span>Abre com a assinatura.</span>}
                    </div>
                  )}
                </div>
              ) : null}
              <div className="body">
                <h2>
                  <Link href={`/criador/${post.creatorId}`} style={{ textDecoration: "none" }}>
                    {post.title}
                  </Link>
                </h2>
                <p>{post.body}</p>
                <div className="price">
                  {post.priceCents > 0 ? <Money cents={post.priceCents} /> : <span className="meta">incluído na assinatura</span>}
                  <Link href={`/criador/${post.creatorId}`} className="button quiet">
                    Ver estúdio
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}

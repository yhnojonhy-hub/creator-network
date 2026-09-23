import Link from "next/link";
import { ErrorNote, Money, Shell } from "@/components/Shell";
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
      <h1>Posts públicos</h1>
      <ErrorNote message={erro} />
      {posts.length === 0 ? <p>Nenhum post publicado.</p> : null}
      <div className="grid gap-8">
        {posts.map((post) => (
          <article key={post.id}>
            <h2>
              <Link href={`/criador/${post.creatorId}`}>{post.title}</Link>
            </h2>
            <p>{post.body}</p>
            <p>
              <Money cents={post.priceCents} />
            </p>
            <p>{post.creator.displayName}</p>
            {post.media
              .filter((media) =>
                canViewMedia({
                  viewerId: user.id,
                  viewerRole: user.role,
                  creatorId: post.creatorId,
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
          </article>
        ))}
      </div>
    </Shell>
  );
}

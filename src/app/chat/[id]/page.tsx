import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, ErrorNote, Shell } from "@/components/Shell";
import { pageUser } from "@/server/guard";
import { thread } from "@/server/read";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await pageUser();
  const { id } = await params;
  const { erro } = await searchParams;
  const data = await thread(user.id, id);
  if (!data) notFound();
  return (
    <Shell user={user}>
      <p style={{ margin: 0 }}>
        <Link href="/chat" className="meta">
          Conversas
        </Link>
      </p>
      <div className="photo-row" style={{ margin: "0.4rem 0 1rem" }}>
        <Avatar userId={data.other.id} name={data.other.displayName} hasAvatar={Boolean(data.other.avatarName)} />
        <h1 style={{ margin: 0, fontSize: "1.8rem" }}>{data.other.displayName}</h1>
      </div>
      <ErrorNote message={erro} />
      {data.messages.length === 0 ? <p className="meta">Nenhuma mensagem ainda. A conversa atualiza ao recarregar a página.</p> : null}
      <ul className="thread">
        {data.messages.map((message) => (
          <li key={message.id} className={message.senderId === user.id ? "mine" : undefined}>
            <p>{message.body || "Mensagem removida."}</p>
          </li>
        ))}
      </ul>
      <form action="/api/chat" method="post" style={{ maxWidth: "40rem" }}>
        <input type="hidden" name="voltar" value={`/chat/${data.other.id}`} />
        <input type="hidden" name="recipientId" value={data.other.id} />
        <label>
          Mensagem
          <textarea name="body" required maxLength={2000} rows={3} placeholder={`Escreva para ${data.other.displayName}`} />
        </label>
        <p className="actions">
          <button type="submit" className="amber">
            Enviar
          </button>
        </p>
      </form>
    </Shell>
  );
}

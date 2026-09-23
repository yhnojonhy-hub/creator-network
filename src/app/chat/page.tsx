import Link from "next/link";
import { Avatar, ErrorNote, Shell } from "@/components/Shell";
import { pageUser } from "@/server/guard";
import { creatorsToMessage, inbox } from "@/server/read";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await pageUser();
  const { erro } = await searchParams;
  const [items, creators] = await Promise.all([inbox(user.id), creatorsToMessage()]);
  const others = creators.filter((creator) => creator.id !== user.id);
  return (
    <Shell user={user}>
      <h1>Conversas</h1>
      <p className="meta">A conversa atualiza ao recarregar a página.</p>
      <ErrorNote message={erro} />
      {items.length === 0 ? <p>Nenhuma conversa ainda.</p> : null}
      <ul className="list">
        {items.map((item) => (
          <li key={item.id}>
            <Link className="row" href={`/chat/${item.id}`}>
              <Avatar userId={item.id} name={item.displayName} hasAvatar={item.hasAvatar} />
              <div className="who">
                <strong>{item.displayName}</strong>
                <span>{item.last || "Mensagem removida."}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {others.length > 0 ? (
        <>
          <h2>Escrever para um estúdio</h2>
          <form action="/api/chat" method="post">
            <input type="hidden" name="voltar" value="/chat" />
            <label>
              Para quem
              <select name="recipientId" required>
                {others.map((creator) => (
                  <option key={creator.id} value={creator.id}>
                    {creator.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mensagem
              <textarea name="body" required maxLength={2000} rows={3} />
            </label>
            <p className="actions">
              <button type="submit" className="amber">
                Enviar
              </button>
            </p>
          </form>
        </>
      ) : null}
    </Shell>
  );
}

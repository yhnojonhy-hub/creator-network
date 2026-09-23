import Link from "next/link";
import { ErrorNote, Shell } from "@/components/Shell";
import { pageUser } from "@/server/guard";
import { creatorsToMessage, inbox } from "@/server/read";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await pageUser();
  const { erro } = await searchParams;
  const [items, creators] = await Promise.all([inbox(user.id), creatorsToMessage()]);
  return (
    <Shell user={user}>
      <h1>Conversas</h1>
      <p>A conversa é HTTP. Atualize a página para ver mensagens novas.</p>
      <ErrorNote message={erro} />
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`/chat/${item.id}`}>{item.displayName}</Link>
          </li>
        ))}
      </ul>
      {creators.some((creator) => creator.id !== user.id) ? (
        <>
          <h2>Escrever</h2>
          <form action="/api/chat" method="post">
            <input type="hidden" name="voltar" value="/chat" />
            <label>
              Pessoa
              <select name="recipientId" required>
                {creators
                  .filter((creator) => creator.id !== user.id)
                  .map((creator) => (
                    <option key={creator.id} value={creator.id}>
                      {creator.displayName}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Mensagem
              <textarea name="body" required maxLength={2000} />
            </label>
            <p>
              <button type="submit">Enviar</button>
            </p>
          </form>
        </>
      ) : null}
    </Shell>
  );
}

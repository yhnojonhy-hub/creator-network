import { notFound } from "next/navigation";
import { ErrorNote, Shell } from "@/components/Shell";
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
      <h1>{data.other.displayName}</h1>
      <p>A conversa é HTTP. Atualize a página para ver mensagens novas.</p>
      <ErrorNote message={erro} />
      <div className="grid gap-3">
        {data.messages.map((message) => (
          <p key={message.id}>
            <strong>{message.senderId === user.id ? "Você" : data.other.displayName}</strong> {message.body}
          </p>
        ))}
      </div>
      <form action="/api/chat" method="post">
        <input type="hidden" name="voltar" value={`/chat/${data.other.id}`} />
        <input type="hidden" name="recipientId" value={data.other.id} />
        <label>
          Mensagem
          <textarea name="body" required maxLength={2000} />
        </label>
        <p>
          <button type="submit">Enviar</button>
        </p>
      </form>
    </Shell>
  );
}

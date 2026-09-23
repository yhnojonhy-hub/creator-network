import Link from "next/link";
import { Balance, ErrorNote, Shell, StateMark } from "@/components/Shell";
import { pageUser } from "@/server/guard";
import { fanMoney } from "@/server/read";

export default async function BalancePage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await pageUser();
  const { erro } = await searchParams;
  const money = await fanMoney(user.id);
  return (
    <Shell user={user}>
      <h1>Saldo lançado</h1>
      <p>A soma dos lançamentos postados na conta de compensação. Reserva não entra neste número.</p>
      <ErrorNote message={erro} />
      <Balance cents={money.balance} caption="Saldo lançado" />
      <h2>Assinaturas</h2>
      {money.subscriptions.length === 0 ? <p>Nenhuma assinatura.</p> : null}
      {money.subscriptions.map((subscription) => (
        <article key={subscription.id}>
          <p>
            <Link href={`/criador/${subscription.creatorId}`}>{subscription.creator.displayName}</Link>
          </p>
          <StateMark status={subscription.status} />
          {subscription.status === "active" ? (
            <form action="/api/assinatura/cancelar" method="post">
              <input type="hidden" name="voltar" value="/saldo" />
              <input type="hidden" name="creatorId" value={subscription.creatorId} />
              <button type="submit">Cancelar assinatura</button>
            </form>
          ) : null}
        </article>
      ))}
    </Shell>
  );
}

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
      <h1>Saldo</h1>
      <p className="meta">A soma dos lançamentos postados na sua conta de compensação. Reserva não entra neste número.</p>
      <ErrorNote message={erro} />
      <Balance cents={money.balance} caption="Saldo lançado" />
      <h2>Assinaturas</h2>
      {money.subscriptions.length === 0 ? (
        <p className="meta">
          Nenhuma assinatura. Veja os <Link href="/feed">posts publicados</Link>.
        </p>
      ) : null}
      <ul className="list">
        {money.subscriptions.map((subscription) => (
          <li key={subscription.id}>
            <div className="row">
              <div className="who">
                <strong>
                  <Link href={`/criador/${subscription.creatorId}`}>{subscription.creator.displayName}</Link>
                </strong>
                <StateMark status={subscription.status} />
              </div>
              {subscription.status === "active" ? (
                <form action="/api/assinatura/cancelar" method="post">
                  <input type="hidden" name="voltar" value="/saldo" />
                  <input type="hidden" name="creatorId" value={subscription.creatorId} />
                  <button type="submit" className="quiet">
                    Cancelar
                  </button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

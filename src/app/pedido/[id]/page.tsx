import { notFound } from "next/navigation";
import { ErrorNote, Money, Shell, StateMark } from "@/components/Shell";
import { linesSum } from "@/domain/ledger";
import { pageUser } from "@/server/guard";
import { orderFor } from "@/server/read";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await pageUser();
  const { id } = await params;
  const { erro } = await searchParams;
  const order = await orderFor(user.id, user.role, id);
  if (!order) notFound();
  return (
    <Shell user={user}>
      <h1>Pedido</h1>
      <ErrorNote message={erro} />
      <StateMark status={order.status} />
      <p>{order.offerText}</p>
      <p>
        <Money cents={order.amountCents} />
      </p>
      <p>
        Soma dos lançamentos <span className="text-signal">{linesSum(order.entries)}</span>
      </p>
      <ul>
        {order.entries.map((entry) => (
          <li key={entry.id}>
            {entry.account} <Money cents={entry.amountCents} /> <StateMark status={entry.posted ? "posted" : "hold"} />
          </li>
        ))}
      </ul>
    </Shell>
  );
}

import { ErrorNote, Shell } from "@/components/Shell";
import { pageUser } from "@/server/guard";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await pageUser();
  const { erro } = await searchParams;
  return (
    <Shell user={user}>
      <h1>Conta</h1>
      <p>{user.displayName}</p>
      <p>{user.email}</p>
      <ErrorNote message={erro} />
      <form action="/api/conta" method="post">
        <input type="hidden" name="voltar" value="/conta" />
        <p>Apagar anonimiza esta conta neste produto. Os lançamentos permanecem no registro anonimizado.</p>
        <label>
          <input type="checkbox" name="confirmar" value="sim" required /> Confirmo anonimizar esta conta neste produto.
        </label>
        <p>
          <button type="submit">Apagar conta</button>
        </p>
      </form>
    </Shell>
  );
}

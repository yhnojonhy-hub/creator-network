import { ErrorNote, Shell } from "@/components/Shell";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <Shell>
      <h1>Entrar</h1>
      <ErrorNote message={erro} />
      <form action="/api/auth/entrar" method="post">
        <input type="hidden" name="voltar" value="/entrar" />
        <label>
          E-mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Senha
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        <p>
          <button type="submit">Entrar</button>
        </p>
      </form>
    </Shell>
  );
}

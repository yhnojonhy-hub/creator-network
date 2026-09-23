import { ErrorNote, Shell } from "@/components/Shell";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <Shell>
      <h1>Criar conta</h1>
      <p>
        Informe a data de nascimento. Menores de 18 anos não entram. O registro guarda o método simulada, o resultado
        18+ e o horário. Isso não satisfaz um provedor real.
      </p>
      <ErrorNote message={erro} />
      <form action="/api/auth/cadastrar" method="post" encType="multipart/form-data">
        <input type="hidden" name="voltar" value="/cadastrar" />
        <label>
          Nome público
          <input name="displayName" required minLength={2} maxLength={80} autoComplete="nickname" />
        </label>
        <label>
          Imagem da conta
          <span className="help">Opcional agora. JPEG, PNG ou WebP até 5 MB. Aparece nas conversas e no estúdio.</span>
          <input name="foto" type="file" accept="image/jpeg,image/png,image/webp" />
        </label>
        <label>
          E-mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Senha
          <input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Data de nascimento
          <input name="birthDate" type="date" required autoComplete="bday" />
        </label>
        <p>
          <button type="submit" className="amber">Criar conta</button>
        </p>
      </form>
    </Shell>
  );
}

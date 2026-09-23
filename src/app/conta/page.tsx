import { Avatar, ErrorNote, Shell } from "@/components/Shell";
import { db } from "@/server/db";
import { pageUser } from "@/server/guard";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await pageUser();
  const { erro } = await searchParams;
  const row = await db.user.findUnique({ where: { id: user.id }, select: { avatarName: true } });
  const hasAvatar = Boolean(row?.avatarName);
  return (
    <Shell user={user}>
      <h1>Conta</h1>
      <p className="meta">
        {user.displayName || "Sem nome público"} · {user.email}
      </p>
      <ErrorNote message={erro} />

      <h2 style={{ marginTop: "1.4rem" }}>Imagem da conta</h2>
      <p className="meta">
        Aparece nas conversas e, se você publica, na página do estúdio. JPEG, PNG ou WebP até 5 MB; recortamos em
        quadrado e removemos os dados de câmera. Não passa pela quarentena dos posts.
      </p>
      <form action="/api/avatar" method="post" encType="multipart/form-data">
        <input type="hidden" name="voltar" value="/conta" />
        <div className="photo-row">
          <Avatar userId={user.id} name={user.displayName || user.email} hasAvatar={hasAvatar} size="lg" />
          <div>
            <input name="foto" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher imagem" />
            <p className="actions" style={{ marginTop: "0.8rem" }}>
              <button type="submit" name="acao" value="enviar" className="amber">
                Enviar imagem
              </button>
              {hasAvatar ? (
                <button type="submit" name="acao" value="remover" className="quiet">
                  Remover
                </button>
              ) : null}
            </p>
          </div>
        </div>
      </form>

      <h2>Encerrar a conta</h2>
      <form action="/api/conta" method="post">
        <input type="hidden" name="voltar" value="/conta" />
        <p className="meta">Apagar anonimiza esta conta neste produto. Os lançamentos permanecem no registro anonimizado.</p>
        <label style={{ display: "flex", gap: "0.6rem", alignItems: "center", fontWeight: 400 }}>
          <input type="checkbox" name="confirmar" value="sim" required /> Confirmo anonimizar esta conta neste produto.
        </label>
        <p className="actions">
          <button type="submit" className="danger">
            Apagar conta
          </button>
        </p>
      </form>
    </Shell>
  );
}

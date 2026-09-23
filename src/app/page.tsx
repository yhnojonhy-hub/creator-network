import Link from "next/link";
import { Shell } from "@/components/Shell";
import { currentUser } from "@/server/session";

export default async function HomePage() {
  const user = await currentUser();
  return (
    <Shell user={user}>
      <section className="hero">
        <div>
          <h1>Seu estúdio, na web, sem loja no meio.</h1>
          <p className="lead">
            Quem publica pede acesso e entra depois de uma revisão humana. Quem acompanha assina, compra um arquivo
            avulso, deixa gorjeta ou faz um pedido sob medida.
          </p>
          <p className="actions">
            <Link className="button amber" href="/cadastrar">
              Criar conta
            </Link>
            <Link className="button" href="/entrar">
              Entrar
            </Link>
          </p>
          <p className="meta" style={{ fontSize: "0.9rem" }}>
            Só para maiores de 18. A conferência de idade e os pagamentos desta versão são simulados.
          </p>
        </div>
        <div className="demo-frame">
          <div className="stage">
            <img src="/seed/studio.jpg" alt="Mesa de estúdio com caderno, câmera e lâmpada" />
          </div>
          <div className="band">visto por 7f3a</div>
        </div>
      </section>
      <section className="pillars" aria-label="Como funciona">
        <p>
          Todo envio espera revisão humana e um consentimento registrado. Cada compra vira lançamentos pareados no
          livro-caixa. Assinatura, arquivo avulso, gorjeta e pedido sob medida ficam no mesmo estúdio.
        </p>
      </section>
    </Shell>
  );
}

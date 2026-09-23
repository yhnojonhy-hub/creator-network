import Link from "next/link";
import { Shell } from "@/components/Shell";
import { currentUser } from "@/server/session";

export default async function HomePage() {
  const user = await currentUser();
  return (
    <Shell user={user}>
      <h1 className="max-w-[14ch] text-5xl">O estúdio abre depois da idade.</h1>
      <p className="max-w-xl">
        Esta é uma rede de estúdio para maiores de 18 anos. O fã cria uma conta. Quem publica pede acesso e só entra no
        estúdio depois da aprovação humana.
      </p>
      <p className="max-w-xl">
        Há assinatura, arquivo avulso, gorjeta e pedido sob medida. O pagamento é simulado. O repasse também. Não há KYC
        real.
      </p>
      <p className="max-w-xl">
        A lista de posts fica atrás do registro de idade: método simulada, resultado 18+ e o horário da conferência.
        Esse registro não satisfaz um provedor real de idade.
      </p>
      <p className="max-w-xl">
        Arquivos entram em quarentena até a revisão humana e um consentimento. A faixa no arquivo é visível.
      </p>
      <p>
        <Link className="button" href="/cadastrar">
          Criar conta
        </Link>
      </p>
    </Shell>
  );
}

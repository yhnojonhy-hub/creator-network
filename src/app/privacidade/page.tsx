import { Shell } from "@/components/Shell";
import { currentUser } from "@/server/session";

export default async function PrivacyPage() {
  const user = await currentUser();
  return (
    <Shell user={user}>
      <h1>O que este produto guarda</h1>
      <p>
        A conta guarda e-mail, senha, nome público, bio, papel e o estado do estúdio. A idade fica só no registro da
        conferência: método, resultado e horário. A data de nascimento não fica gravada. Nesta versão o método é
        simulado e não satisfaz um provedor real.
      </p>
      <p>
        Também ficam posts, arquivos em quarentena, consentimento com alcance e revogação, acompanhamentos,
        assinaturas, pedidos com o texto da oferta, lançamentos contábeis, repasses em reserva, conversas e a fila de
        auditoria. O saldo é a soma dos lançamentos postados. Não há coluna de saldo mutável.
      </p>
      <p>
        Pagamento e KYC são simulados. Não há antivírus nem FFmpeg. Os arquivos aceitos são jpeg, png e webp, até 5 MB,
        fora da pasta pública, com nome aleatório. A entrega compõe uma faixa visível com os quatro últimos caracteres
        do id de quem recebe o arquivo. Não há marca forense invisível.
      </p>
      <p>
        Apagar a conta anonimiza este produto: o e-mail, a senha, o nome, a bio e as mensagens enviadas. Os lançamentos
        permanecem ligados ao registro anonimizado.
      </p>
    </Shell>
  );
}

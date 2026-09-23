# Estúdio

Rede de estúdio na web para maiores de 18 anos. O fã cria uma conta. Quem publica pede acesso e só usa o estúdio depois da aprovação humana. A lista pública de posts abre depois do registro de idade.

Idade, pagamento e KYC são simulados. O registro de idade guarda método `simulada`, resultado `18+` e o horário. Isso não satisfaz um provedor real. A data de nascimento não fica gravada. OpCore não é chamado.

Não há antivírus e não há FFmpeg. Os arquivos aceitos são jpeg, png e webp, até 5 MB, conferidos pela assinatura do arquivo. SVG é recusado. O arquivo fica em `storage/`, com nome aleatório, fora de `public/`, e começa em quarentena. Ele publica depois da revisão humana e de um consentimento (a própria pessoa, ou outras pessoas nomeadas, com alcance e revogação).

A rota `/media/[id]?token=` confere um HMAC com `MEDIA_SECRET` e validade de 10 minutos. A imagem ganha uma faixa visível com os quatro últimos caracteres do id de quem recebe o arquivo. Não há marca forense invisível.

Cada arquivo guarda o SHA-256 do envio original em `Media.sourceHash`, para procedência. Isso não é marca forense e não rastreia cópia.

O saldo é a soma dos lançamentos postados. Cada compra grava um débito na compensação de quem compra e créditos no pagamento de quem publica e na taxa da plataforma (20% plataforma, 80% estúdio), na mesma transação. O 80/20 é uma hipótese de teste, não uma promessa: o plano mestre pede duas propostas de adquirência para conteúdo adulto antes de publicar preço, e o custo dessa adquirência pode levar a 75/25 ou a uma taxa de serviço para quem compra. Pedido de repasse e aceite de pedido sob medida gravam `AuditEvent`. A reserva é um lançamento ainda não postado. O pedido de repasse cria essa reserva. O pedido sob medida fica em reserva até a aceitação, e só depois do pagamento simulado. Conta nova (compra dentro de 48 horas de `createdAt`) tem teto de 10000 centavos.

## Contas de exemplo

- `admin@exemplo.local`
- `marina@exemplo.local` (idade conferida, assinatura ativa)
- `helena@exemplo.local` (estúdio aprovado, um post publicado e um arquivo em quarentena)

As senhas vêm de `SEED_ADMIN_PASSWORD` e `SEED_DEMO_PASSWORD`.

## Banco

Postgres embutido em `127.0.0.1:5435`, banco `creator`, dados em `data/postgres`. O papel `creator_migrator` cria o banco, migra e roda o seed (`MIGRATE_URL`). O papel `creator_app` é `NOSUPERUSER NOCREATEDB NOBYPASSRLS` e atende o app (`DATABASE_URL`). O app pode ler e gravar, e não pode atualizar nem apagar `AuditEvent`.

`npm run db:up` sobe o banco e permanece no ar. O `.env` só é escrito se ainda não existir. `docker-compose.yml` descreve Postgres 18 na porta 5435, rede `creator_net` e volume `creator_pg`, para quem tiver Docker. O caminho usado aqui é o Postgres embutido.

## Scripts

```powershell
npm install
node node_modules/prisma/scripts/preinstall-entry.js
node node_modules/@prisma/engines/scripts/postinstall.js
node node_modules/@embedded-postgres/windows-x64/scripts/hydrate-symlinks.js
node node_modules/esbuild/install.js
node node_modules/sharp/install/check.js
npm run db:up
npm run db:generate
npx prisma migrate dev --name init
npm run db:grant
npm run db:seed
npx tsc --noEmit
npm test
npm run dev
```

O site fica em `http://127.0.0.1:3300`. A página inicial explica o estúdio e não mostra a lista de posts.

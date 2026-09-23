import { randomBytes } from "node:crypto";
import Link from "next/link";
import { formatCents } from "@/domain/money";

export type ShellUser = {
  role: string;
  creatorStatus: string;
  displayName: string;
} | null;

export function Shell({ children, user = null }: { children: React.ReactNode; user?: ShellUser }) {
  return (
    <div className="mr-auto ml-0 w-full max-w-3xl px-6 py-10 text-left">
      <nav className="mb-10 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <Link href={user ? "/feed" : "/"} className="font-display text-2xl">
          Estúdio
        </Link>
        {user ? (
          <>
            <Link href="/feed">Posts</Link>
            <Link href="/estudio">Estúdio</Link>
            <Link href="/chat">Conversas</Link>
            <Link href="/saldo">Saldo</Link>
            <Link href="/conta">Conta</Link>
            {user.role === "admin" ? <Link href="/admin">Fila</Link> : null}
            <form action="/api/auth/sair" method="post">
              <button type="submit">Sair</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/entrar">Entrar</Link>
            <Link href="/cadastrar">Criar conta</Link>
          </>
        )}
      </nav>
      {children}
      <footer className="mt-16">
        <p>A conferência de idade desta versão é simulada e não satisfaz um provedor real.</p>
        <p>
          <Link href="/privacidade">Privacidade</Link>
        </p>
      </footer>
    </div>
  );
}

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="erro">{message}</p>;
}

export function Money({ cents }: { cents: number }) {
  return <span className="text-signal">{formatCents(cents)}</span>;
}

export function Balance({ cents, caption }: { cents: number; caption: string }) {
  return (
    <section className="my-6 border-l-4 border-signal pl-4">
      <p className="m-0">{caption}</p>
      <p className="balance-figure">{formatCents(cents)}</p>
    </section>
  );
}

const STATUS_LABEL: Record<string, string> = {
  quarantine: "em quarentena",
  published: "publicado",
  rejected: "recusado",
  hold: "em reserva",
  posted: "lançado",
  canceled: "cancelado",
  pending: "aguardando",
  approved: "aprovado",
  active: "ativa",
  none: "sem pedido",
};

export function StateMark({ status }: { status: string }) {
  return (
    <p className="m-0">
      <span className="text-signal">{STATUS_LABEL[status] ?? status}</span>
    </p>
  );
}

export function KeyField() {
  return (
    <label>
      Chave
      <input name="chave" defaultValue={randomBytes(16).toString("hex")} required minLength={8} maxLength={80} autoComplete="off" />
    </label>
  );
}

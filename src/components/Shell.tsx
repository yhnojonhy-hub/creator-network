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
    <>
      <header className="top">
        <nav aria-label="Principal">
          <Link href={user ? "/feed" : "/"} className="mark">
            Estúdio
          </Link>
          {user ? (
            <>
              <Link href="/feed">Posts</Link>
              <Link href="/estudio">{user.creatorStatus === "approved" ? "Meu estúdio" : "Publicar"}</Link>
              <Link href="/chat">Conversas</Link>
              <Link href="/saldo">Saldo</Link>
              <Link href="/conta">Conta</Link>
              {user.role === "admin" ? <Link href="/admin">Revisão</Link> : null}
              <form action="/api/auth/sair" method="post">
                <button type="submit" className="quiet">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/entrar">Entrar</Link>
              <Link href="/cadastrar" className="button amber" style={{ marginLeft: "auto", padding: "0.5rem 1rem" }}>
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="wrap">{children}</main>
      <footer className="foot">
        <span>Estúdio · 18+</span>
        <span>
          <Link href="/privacidade">Privacidade</Link>
        </span>
        <span>Idade e pagamentos desta versão são simulados.</span>
      </footer>
    </>
  );
}

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="erro" role="alert">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="14" r="0.9" fill="currentColor" />
      </svg>
      <span>{message}</span>
    </p>
  );
}

export function Money({ cents }: { cents: number }) {
  return <span className="money">{formatCents(cents)}</span>;
}

export function Balance({ cents, caption }: { cents: number; caption: string }) {
  return (
    <section className="balance">
      <p className="caption">{caption}</p>
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
  pending: "aguardando revisão",
  approved: "aprovado",
  active: "ativa",
  none: "sem pedido",
};

const GOOD = new Set(["published", "posted", "approved", "active"]);
const BAD = new Set(["rejected", "canceled"]);

export function StateMark({ status }: { status: string }) {
  const tone = GOOD.has(status) ? "state good" : BAD.has(status) ? "state bad" : "state";
  return <span className={tone}>{STATUS_LABEL[status] ?? status}</span>;
}

export function KeyField() {
  return (
    <input type="hidden" name="chave" value={randomBytes(16).toString("hex")} />
  );
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  userId,
  name,
  hasAvatar,
  size = "sm",
}: {
  userId: string;
  name: string;
  hasAvatar: boolean;
  size?: "sm" | "lg";
}) {
  const className = size === "lg" ? "avatar lg" : "avatar";
  const px = size === "lg" ? 112 : 44;
  if (hasAvatar) {
    return <img className={className} src={`/avatar/${userId}`} alt="" width={px} height={px} />;
  }
  return (
    <span className={className} aria-hidden="true">
      {initialsOf(name || "?")}
    </span>
  );
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

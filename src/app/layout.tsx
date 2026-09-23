import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Estúdio",
  description: "Estúdio na web para quem publica e para quem acompanha. Idade e pagamento simulados nesta versão.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}

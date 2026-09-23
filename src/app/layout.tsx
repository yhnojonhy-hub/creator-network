import type { Metadata } from "next";
import { Familjen_Grotesk, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Familjen_Grotesk({ subsets: ["latin"], variable: "--font-familjen" });
const display = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif" });

export const metadata: Metadata = {
  title: "Estúdio",
  description: "Estúdio na web para quem publica e para quem acompanha, com idade e pagamento simulados.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`}>
      <body className="bg-charcoal font-sans text-left text-linen">{children}</body>
    </html>
  );
}

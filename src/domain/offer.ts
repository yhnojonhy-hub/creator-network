import { formatCents } from "./money";

export const TIP_AMOUNTS = [500, 1000, 2000] as const;
export const REQUEST_AMOUNTS = [1000, 2500, 5000] as const;

export function describeOffer(input: {
  kind: "subscribe" | "ppv" | "tip" | "request";
  creatorName: string;
  amountCents: number;
  title?: string;
  note?: string;
}): string {
  const money = formatCents(input.amountCents);
  if (input.kind === "subscribe") {
    return `Assinatura do estúdio de ${input.creatorName} por ${money}.`;
  }
  if (input.kind === "ppv") {
    return `Arquivo avulso "${input.title ?? ""}" de ${input.creatorName} por ${money}.`;
  }
  if (input.kind === "tip") {
    return `Gorjeta para ${input.creatorName} de ${money}.`;
  }
  return `Pedido sob medida para ${input.creatorName}: ${input.note ?? ""} por ${money}.`;
}

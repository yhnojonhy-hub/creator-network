export type LedgerAccount = "buyer_clearing" | "creator_payable" | "platform_fee" | "payout_clearing";

export type LedgerLine = {
  account: LedgerAccount;
  amountCents: number;
  posted: boolean;
};

export function linesSum(lines: { amountCents: number }[]): number {
  return lines.reduce((sum, line) => sum + line.amountCents, 0);
}

export function orderLedger(amountCents: number, posted: boolean): LedgerLine[] {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Valor inválido.");
  }
  const platform = Math.floor(amountCents * 0.2);
  const creator = amountCents - platform;
  return [
    { account: "buyer_clearing", amountCents: -amountCents, posted },
    { account: "creator_payable", amountCents: creator, posted },
    { account: "platform_fee", amountCents: platform, posted },
  ];
}

export function payoutHold(amountCents: number): LedgerLine[] {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Valor inválido.");
  }
  return [
    { account: "creator_payable", amountCents: -amountCents, posted: false },
    { account: "payout_clearing", amountCents, posted: false },
  ];
}

export const SPEND_CAP_CENTS = 10_000;
export const SPEND_CAP_WINDOW_MS = 48 * 60 * 60 * 1000;
export const SPEND_CAP_MESSAGE =
  "O limite de 10000 centavos nas primeiras 48 horas não cobre esta compra.";

export function spendCapDecision(input: {
  createdAt: Date;
  now: Date;
  spentCents: number;
  nextCents: number;
}): { allowed: boolean; reason?: string } {
  const age = input.now.getTime() - input.createdAt.getTime();
  if (age >= SPEND_CAP_WINDOW_MS) return { allowed: true };
  if (input.spentCents + input.nextCents > SPEND_CAP_CENTS) {
    return { allowed: false, reason: SPEND_CAP_MESSAGE };
  }
  return { allowed: true };
}

import { describe, expect, it } from "vitest";
import { ageGateAllows } from "./age";
import { linesSum, orderLedger } from "./ledger";
import { spendCapDecision } from "./spend";
import { isPublicPostVisible } from "./visibility";

describe("ledger", () => {
  it("fecha um pedido de 10000 centavos", () => {
    const lines = orderLedger(10000, true);
    expect(lines).toEqual([
      { account: "buyer_clearing", amountCents: -10000, posted: true },
      { account: "creator_payable", amountCents: 8000, posted: true },
      { account: "platform_fee", amountCents: 2000, posted: true },
    ]);
    expect(linesSum(lines)).toBe(0);
  });
});

describe("teto de gasto", () => {
  it("bloqueia a segunda compra que passaria de 10000 centavos em 48 horas", () => {
    const createdAt = new Date("2026-09-22T12:00:00.000Z");
    const now = new Date("2026-09-23T12:00:00.000Z");
    const first = spendCapDecision({ createdAt, now, spentCents: 0, nextCents: 6000 });
    const second = spendCapDecision({ createdAt, now, spentCents: 6000, nextCents: 5000 });
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(second.reason).toBe(
      "O limite de 10000 centavos nas primeiras 48 horas não cobre esta compra.",
    );
  });
});

describe("post público", () => {
  it("não fica visível em quarentena", () => {
    expect(isPublicPostVisible("quarantine")).toBe(false);
    expect(isPublicPostVisible("published")).toBe(true);
  });
});

describe("idade", () => {
  it("recusa registro ausente", () => {
    expect(ageGateAllows(null)).toBe(false);
  });
});

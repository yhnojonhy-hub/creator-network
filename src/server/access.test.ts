import "dotenv/config";
import pg from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { orderFor, purchasedPostIds } from "@/server/read";

const emails = ["iso-fa@exemplo.local", "iso-estudio@exemplo.local", "iso-outro@exemplo.local"];

async function databaseReady(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

function skipOrFail(ready: boolean): boolean {
  if (ready) return false;
  if (process.env.REQUIRE_DB === "1") throw new Error("banco ausente");
  return true;
}

describe("papel do app", () => {
  it("não altera nem apaga a auditoria", async () => {
    if (skipOrFail(await databaseReady())) return;
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await expect(client.query('UPDATE "AuditEvent" SET reason = reason')).rejects.toMatchObject({ code: "42501" });
      await expect(client.query('DELETE FROM "AuditEvent"')).rejects.toMatchObject({ code: "42501" });
    } finally {
      await client.end();
    }
  });
});

describe("pedido de outra pessoa", () => {
  let orderId = "";

  afterAll(async () => {
    if (orderId) await db.order.delete({ where: { id: orderId } }).catch(() => undefined);
    await db.user.deleteMany({ where: { email: { in: emails } } }).catch(() => undefined);
  });

  it("fica invisível para quem não comprou nem vendeu", async () => {
    if (skipOrFail(await databaseReady())) return;
    await db.user.deleteMany({ where: { email: { in: emails } } });
    const [fan, creator, outsider] = await Promise.all(
      emails.map((email) => db.user.create({ data: { email, passwordHash: "teste" } })),
    );
    if (!fan || !creator || !outsider) throw new Error("faltou conta");
    const order = await db.order.create({
      data: {
        buyerId: fan.id,
        creatorId: creator.id,
        kind: "tip",
        amountCents: 500,
        offerText: "gorjeta de teste",
        status: "posted",
      },
    });
    orderId = order.id;
    expect(await orderFor(outsider.id, "fan", order.id)).toBeNull();
    expect((await orderFor(fan.id, "fan", order.id))?.id).toBe(order.id);
    expect((await orderFor(creator.id, "fan", order.id))?.id).toBe(order.id);
    expect((await purchasedPostIds(outsider.id)).size).toBe(0);
  });
});

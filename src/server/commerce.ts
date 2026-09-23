import "server-only";
import { linesSum, orderLedger, payoutHold } from "@/domain/ledger";
import { describeOffer, REQUEST_AMOUNTS, TIP_AMOUNTS } from "@/domain/offer";
import { spendCapDecision } from "@/domain/spend";
import { isPublicPostVisible } from "@/domain/visibility";
import { auditData } from "@/server/audit";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";

const KEY = /^[A-Za-z0-9_-]{8,80}$/;

function requireKey(value: string) {
  if (!KEY.test(value)) throw new HttpError(400, "A chave precisa ter entre 8 e 80 caracteres.");
  return value;
}

function integerCents(value: string): number {
  if (!/^\d+$/.test(value)) throw new HttpError(400, "Valor inválido.");
  const amount = Number(value);
  if (!Number.isInteger(amount)) throw new HttpError(400, "Valor inválido.");
  return amount;
}

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}

async function spentCents(buyerId: string) {
  const rows = await db.order.findMany({
    where: { buyerId, status: { in: ["posted", "hold"] } },
    select: { amountCents: true },
  });
  return rows.reduce((sum, row) => sum + row.amountCents, 0);
}

export async function checkout(input: {
  buyerId: string;
  kind: string;
  creatorId: string;
  postId: string;
  amountCents: string;
  offerText: string;
  note: string;
  chave: string;
}) {
  const chave = requireKey(input.chave);
  const amountCents = integerCents(input.amountCents);
  const buyer = await db.user.findUnique({ where: { id: input.buyerId } });
  const creator = await db.user.findUnique({ where: { id: input.creatorId } });
  if (!buyer || buyer.deletedAt) throw new HttpError(401, "Entre para continuar.");
  if (!creator || creator.deletedAt || creator.creatorStatus !== "approved") {
    throw new HttpError(400, "Esse estúdio não está aberto.");
  }
  if (buyer.id === creator.id) throw new HttpError(400, "A compra fica para outra conta.");

  let postId: string | null = null;
  let offer = "";
  if (input.kind === "subscribe") {
    if (amountCents !== creator.subscriptionPriceCents) throw new HttpError(400, "A oferta mudou. Atualize a página.");
    const current = await db.subscription.findUnique({
      where: { fanId_creatorId: { fanId: buyer.id, creatorId: creator.id } },
    });
    if (current?.status === "active") throw new HttpError(400, "A assinatura já está ativa.");
    offer = describeOffer({ kind: "subscribe", creatorName: creator.displayName, amountCents });
    if (input.offerText !== offer) throw new HttpError(400, "A oferta mudou. Atualize a página.");
  } else if (input.kind === "ppv") {
    const post = await db.post.findUnique({ where: { id: input.postId } });
    if (!post || post.creatorId !== creator.id || !isPublicPostVisible(post.status) || post.priceCents <= 0) {
      throw new HttpError(400, "Esse arquivo não está à venda.");
    }
    if (amountCents !== post.priceCents) throw new HttpError(400, "A oferta mudou. Atualize a página.");
    const already = await db.order.findFirst({
      where: { buyerId: buyer.id, postId: post.id, kind: "ppv", status: "posted" },
    });
    if (already) throw new HttpError(400, "Esse arquivo já foi comprado.");
    postId = post.id;
    offer = describeOffer({
      kind: "ppv",
      creatorName: creator.displayName,
      amountCents,
      title: post.title,
    });
    if (input.offerText !== offer) throw new HttpError(400, "A oferta mudou. Atualize a página.");
  } else if (input.kind === "tip") {
    if (!TIP_AMOUNTS.includes(amountCents as (typeof TIP_AMOUNTS)[number])) {
      throw new HttpError(400, "Escolha um valor de gorjeta.");
    }
    offer = describeOffer({ kind: "tip", creatorName: creator.displayName, amountCents });
  } else if (input.kind === "request") {
    if (!REQUEST_AMOUNTS.includes(amountCents as (typeof REQUEST_AMOUNTS)[number])) {
      throw new HttpError(400, "Escolha um valor de pedido.");
    }
    const note = input.note.trim();
    if (note.length < 8 || note.length > 280) throw new HttpError(400, "Descreva o pedido em até 280 caracteres.");
    offer = describeOffer({ kind: "request", creatorName: creator.displayName, amountCents, note });
  } else {
    throw new HttpError(400, "Tipo de compra inválido.");
  }

  const prior = await db.idempotencyKey.findUnique({
    where: { userId_scope_key: { userId: buyer.id, scope: "checkout", key: chave } },
  });
  if (prior?.orderId) return prior.orderId;

  const decision = spendCapDecision({
    createdAt: buyer.createdAt,
    now: new Date(),
    spentCents: await spentCents(buyer.id),
    nextCents: amountCents,
  });
  if (!decision.allowed) throw new HttpError(400, decision.reason ?? "Limite de gasto.");

  const posted = input.kind !== "request";
  const lines = orderLedger(amountCents, posted);
  if (linesSum(lines) !== 0) throw new HttpError(500, "O lançamento não fecha.");

  try {
    return await db.$transaction(async (tx) => {
      const again = await tx.idempotencyKey.findUnique({
        where: { userId_scope_key: { userId: buyer.id, scope: "checkout", key: chave } },
      });
      if (again?.orderId) return again.orderId;
      const order = await tx.order.create({
        data: {
          buyerId: buyer.id,
          creatorId: creator.id,
          postId,
          kind: input.kind,
          amountCents,
          offerText: offer,
          status: posted ? "posted" : "hold",
        },
      });
      await tx.ledgerEntry.createMany({
        data: lines.map((line) => ({
          orderId: order.id,
          account: line.account,
          ownerId:
            line.account === "buyer_clearing" ? buyer.id : line.account === "creator_payable" ? creator.id : null,
          amountCents: line.amountCents,
          posted: line.posted,
        })),
      });
      await tx.idempotencyKey.create({
        data: { userId: buyer.id, scope: "checkout", key: chave, orderId: order.id },
      });
      if (input.kind === "subscribe") {
        await tx.subscription.upsert({
          where: { fanId_creatorId: { fanId: buyer.id, creatorId: creator.id } },
          create: {
            fanId: buyer.id,
            creatorId: creator.id,
            status: "active",
            priceCents: amountCents,
            endsAt: null,
          },
          update: { status: "active", priceCents: amountCents, endsAt: null },
        });
      }
      return order.id;
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (isUniqueConflict(error)) {
      const saved = await db.idempotencyKey.findUnique({
        where: { userId_scope_key: { userId: buyer.id, scope: "checkout", key: chave } },
      });
      if (saved?.orderId) return saved.orderId;
      throw new HttpError(409, "Esta chave já foi usada.");
    }
    throw error;
  }
}

export async function acceptRequest(creatorId: string, orderId: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { entries: true } });
    if (!order || order.kind !== "request" || order.status !== "hold") {
      throw new HttpError(400, "Esse pedido não está em reserva.");
    }
    if (order.creatorId !== creatorId) throw new HttpError(403, "Só quem publica aceita o pedido.");
    if (linesSum(order.entries) !== 0) throw new HttpError(500, "O lançamento não fecha.");
    await tx.ledgerEntry.updateMany({ where: { orderId: order.id }, data: { posted: true } });
    await tx.order.update({ where: { id: order.id }, data: { status: "posted" } });
    await tx.auditEvent.create({
      data: auditData({
        actorId: creatorId,
        action: "pedido_aceito",
        targetType: "order",
        targetId: order.id,
        reason: "Reserva do pedido sob medida liberada pelo estúdio.",
        before: { status: "hold" },
        after: { status: "posted" },
      }),
    });
  });
}

export async function rejectRequest(creatorId: string, orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.kind !== "request" || order.status !== "hold") {
    throw new HttpError(400, "Esse pedido não está em reserva.");
  }
  if (order.creatorId !== creatorId) throw new HttpError(403, "Só quem publica recusa o pedido.");
  await db.order.update({ where: { id: order.id }, data: { status: "canceled" } });
}

export async function cancelSubscription(fanId: string, creatorId: string) {
  const subscription = await db.subscription.findUnique({
    where: { fanId_creatorId: { fanId, creatorId } },
  });
  if (!subscription || subscription.status !== "active") throw new HttpError(400, "Não há assinatura ativa.");
  await db.subscription.update({
    where: { id: subscription.id },
    data: { status: "canceled", endsAt: new Date() },
  });
}

export async function followCreator(fanId: string, creatorId: string) {
  if (fanId === creatorId) throw new HttpError(400, "O acompanhamento fica para outra conta.");
  const creator = await db.user.findUnique({ where: { id: creatorId } });
  if (!creator || creator.deletedAt || creator.creatorStatus !== "approved") {
    throw new HttpError(400, "Esse estúdio não está aberto.");
  }
  const existing = await db.follow.findUnique({ where: { fanId_creatorId: { fanId, creatorId } } });
  if (existing) return;
  await db.follow.create({ data: { fanId, creatorId } });
}

export async function requestPayout(creatorId: string, amountRaw: string, chaveRaw: string) {
  const chave = requireKey(chaveRaw);
  const amountCents = integerCents(amountRaw);
  if (amountCents < 100) throw new HttpError(400, "O repasse mínimo é de 100 centavos.");
  const existing = await db.idempotencyKey.findUnique({
    where: { userId_scope_key: { userId: creatorId, scope: "payout", key: chave } },
  });
  if (existing) return;
  const lines = payoutHold(amountCents);
  if (linesSum(lines) !== 0) throw new HttpError(500, "O lançamento não fecha.");
  try {
    await db.$transaction(async (tx) => {
      const again = await tx.idempotencyKey.findUnique({
        where: { userId_scope_key: { userId: creatorId, scope: "payout", key: chave } },
      });
      if (again) return;
      const posted = await tx.ledgerEntry.findMany({
        where: { ownerId: creatorId, account: "creator_payable", posted: true },
        select: { amountCents: true },
      });
      const reserved = await tx.ledgerEntry.findMany({
        where: { ownerId: creatorId, account: "creator_payable", posted: false },
        select: { amountCents: true },
      });
      const available =
        posted.reduce((sum, row) => sum + row.amountCents, 0) +
        reserved.reduce((sum, row) => sum + row.amountCents, 0);
      if (amountCents > available) throw new HttpError(400, "O saldo lançado não cobre esse repasse.");
      const payout = await tx.payout.create({ data: { creatorId, amountCents } });
      await tx.ledgerEntry.createMany({
        data: lines.map((line) => ({
          payoutId: payout.id,
          account: line.account,
          ownerId: line.account === "creator_payable" ? creatorId : null,
          amountCents: line.amountCents,
          posted: false,
        })),
      });
      await tx.idempotencyKey.create({
        data: { userId: creatorId, scope: "payout", key: chave },
      });
      await tx.auditEvent.create({
        data: auditData({
          actorId: creatorId,
          action: "repasse_pedido",
          targetType: "payout",
          targetId: payout.id,
          reason: "Pedido de repasse com reserva no livro-caixa.",
          before: { available },
          after: { available: available - amountCents, amountCents },
        }),
      });
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (isUniqueConflict(error)) return;
    throw error;
  }
}

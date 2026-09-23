import "server-only";
import { isCancellationRisk, isNewSubscriber } from "@/domain/crm";
import { isPublicPostVisible } from "@/domain/visibility";
import { db } from "@/server/db";

async function summed(where: { ownerId?: string | null; account: string; posted: boolean }) {
  const rows = await db.ledgerEntry.findMany({ where, select: { amountCents: true } });
  return rows.reduce((sum, row) => sum + row.amountCents, 0);
}

export async function feedPosts() {
  const posts = await db.post.findMany({
    where: { status: "published", creator: { deletedAt: null, creatorStatus: "approved" } },
    include: { creator: true, media: true },
    orderBy: { createdAt: "desc" },
  });
  return posts.filter((post) => isPublicPostVisible(post.status));
}

export async function purchasedPostIds(buyerId: string): Promise<Set<string>> {
  const orders = await db.order.findMany({
    where: { buyerId, kind: "ppv", status: "posted", postId: { not: null } },
    select: { postId: true },
  });
  return new Set(orders.map((order) => order.postId).filter((id): id is string => Boolean(id)));
}

export async function creatorView(viewerId: string, creatorId: string) {
  const creator = await db.user.findUnique({ where: { id: creatorId } });
  if (!creator || creator.deletedAt || creator.creatorStatus !== "approved") return null;
  const posts = await db.post.findMany({
    where: { creatorId, status: "published" },
    include: { media: true },
    orderBy: { createdAt: "desc" },
  });
  const follow = await db.follow.findUnique({ where: { fanId_creatorId: { fanId: viewerId, creatorId } } });
  const subscription = await db.subscription.findUnique({
    where: { fanId_creatorId: { fanId: viewerId, creatorId } },
  });
  const purchases = await db.order.findMany({
    where: { buyerId: viewerId, creatorId, kind: "ppv", status: "posted" },
    select: { postId: true },
  });
  return {
    creator,
    posts: posts.filter((post) => isPublicPostVisible(post.status)),
    following: Boolean(follow),
    subscription,
    purchased: new Set(purchases.map((order) => order.postId).filter((id): id is string => Boolean(id))),
  };
}

export async function studioData(creatorId: string) {
  const [posts, subs, ppvOrders, requests, posted, reserved] = await Promise.all([
    db.post.findMany({
      where: { creatorId },
      include: { media: true, consents: true },
      orderBy: { createdAt: "desc" },
    }),
    db.subscription.findMany({ where: { creatorId } }),
    db.order.findMany({
      where: { creatorId, kind: "ppv", status: { in: ["posted", "hold"] } },
      select: { buyerId: true },
    }),
    db.order.findMany({ where: { creatorId, kind: "request", status: "hold" }, orderBy: { createdAt: "asc" } }),
    summed({ ownerId: creatorId, account: "creator_payable", posted: true }),
    summed({ ownerId: creatorId, account: "creator_payable", posted: false }),
  ]);
  const now = new Date();
  return {
    posts,
    posted,
    reserved,
    newSubscribers: subs.filter((sub) => isNewSubscriber(sub.status, sub.createdAt, now)).length,
    cancellationRisk: subs.filter((sub) => isCancellationRisk(sub.status, sub.endsAt)).length,
    ppvBuyers: new Set(ppvOrders.map((order) => order.buyerId)).size,
    requests,
  };
}

export async function adminQueue() {
  const [posts, creators, platform] = await Promise.all([
    db.post.findMany({
      where: { status: "quarantine" },
      include: { creator: true, consents: true, media: true },
      orderBy: { createdAt: "asc" },
    }),
    db.user.findMany({ where: { creatorStatus: "pending", deletedAt: null }, orderBy: { createdAt: "asc" } }),
    summed({ ownerId: null, account: "platform_fee", posted: true }),
  ]);
  return { posts, creators, platform };
}

export async function inbox(userId: string) {
  const messages = await db.chatMessage.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const ids = new Set<string>();
  for (const message of messages) {
    ids.add(message.senderId === userId ? message.recipientId : message.senderId);
  }
  const people = await db.user.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, displayName: true },
  });
  const names = new Map(people.map((person) => [person.id, person.displayName]));
  return [...ids].map((id) => ({
    id,
    displayName: names.get(id) ?? "Conta",
    last: messages.find((message) => message.senderId === id || message.recipientId === id)?.body ?? "",
  }));
}

export async function thread(userId: string, otherId: string) {
  const other = await db.user.findUnique({
    where: { id: otherId },
    select: { id: true, displayName: true, deletedAt: true },
  });
  if (!other || other.deletedAt) return null;
  const messages = await db.chatMessage.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: otherId },
        { senderId: otherId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return { other, messages };
}

export async function orderFor(userId: string, role: string, orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { entries: true, creator: true },
  });
  if (!order) return null;
  if (order.buyerId !== userId && order.creatorId !== userId && role !== "admin") return null;
  return order;
}

export async function fanMoney(userId: string) {
  const [balance, subscriptions] = await Promise.all([
    summed({ ownerId: userId, account: "buyer_clearing", posted: true }),
    db.subscription.findMany({ where: { fanId: userId }, include: { creator: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return { balance, subscriptions };
}

export async function creatorsToMessage() {
  return db.user.findMany({
    where: { creatorStatus: "approved", deletedAt: null },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" },
  });
}

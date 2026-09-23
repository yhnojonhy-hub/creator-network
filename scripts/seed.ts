import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { linesSum, orderLedger } from "../src/domain/ledger";
import { describeOffer } from "../src/domain/offer";
import { sniffImage } from "../src/domain/sniff";
import { hashPassword } from "../src/server/password";

async function seedAvatar(file: string): Promise<string> {
  const bytes = await readFile(path.join(process.cwd(), "public", "seed", file));
  const output = await sharp(bytes)
    .rotate()
    .resize({ width: 512, height: 512, fit: "cover", position: "attention" })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  const name = `av-${randomBytes(16).toString("hex")}.jpg`;
  await writeFile(path.join(process.cwd(), "storage", name), output);
  return name;
}

async function seedMedia(file: string): Promise<{ storageName: string; mime: string; sourceHash: string }> {
  const bytes = await readFile(path.join(process.cwd(), "public", "seed", file));
  const output = await sharp(bytes)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
  const storageName = `${randomBytes(16).toString("hex")}.jpg`;
  await writeFile(path.join(process.cwd(), "storage", storageName), output);
  return {
    storageName,
    mime: "image/jpeg",
    sourceHash: createHash("sha256").update(output).digest("hex"),
  };
}

if (process.env.NODE_ENV === "production") {
  throw new Error("O seed não roda em produção.");
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Defina ${name}.`);
  return value;
}

const db = new PrismaClient({ adapter: new PrismaPg(process.env.MIGRATE_URL ?? "") });

async function main() {
  const adminPassword = requiredEnv("SEED_ADMIN_PASSWORD");
  const demoPassword = requiredEnv("SEED_DEMO_PASSWORD");
  const probe = await readFile(path.join(process.cwd(), "public", "seed", "caderno.jpg"));
  if (!sniffImage(probe)) throw new Error("Imagem de exemplo inválida.");

  const storageDir = path.join("storage");
  await mkdir(storageDir, { recursive: true });
  for (const name of await readdir(storageDir)) {
    if (/^(av-)?[a-f0-9]{32}\.(png|jpg|webp)$/.test(name)) {
      await rm(path.join(storageDir, name), { force: true });
    }
  }

  await db.ledgerEntry.deleteMany();
  await db.idempotencyKey.deleteMany();
  await db.order.deleteMany();
  await db.payout.deleteMany();
  await db.chatMessage.deleteMany();
  await db.consent.deleteMany();
  await db.media.deleteMany();
  await db.post.deleteMany();
  await db.follow.deleteMany();
  await db.subscription.deleteMany();
  await db.session.deleteMany();
  await db.loginLock.deleteMany();
  await db.auditEvent.deleteMany();
  await db.ageCheck.deleteMany();
  await db.user.deleteMany();

  const adminHash = await hashPassword(adminPassword);
  const demoHash = await hashPassword(demoPassword);

  await db.user.create({
    data: {
      email: "admin@exemplo.local",
      passwordHash: adminHash,
      role: "admin",
      displayName: "Admin",
      ageCheck: { create: { method: "simulada", result: "18+" } },
    },
  });

  const marina = await db.user.create({
    data: {
      email: "marina@exemplo.local",
      passwordHash: demoHash,
      displayName: "Marina",
      bio: "Acompanho estudos de desenho e anotações de ateliê.",
      avatarName: await seedAvatar("marina.jpg"),
      ageCheck: { create: { method: "simulada", result: "18+" } },
    },
  });

  const helena = await db.user.create({
    data: {
      email: "helena@exemplo.local",
      passwordHash: demoHash,
      creatorStatus: "approved",
      displayName: "Helena",
      bio: "Publico estudos de desenho e anotações de ateliê.",
      subscriptionPriceCents: 2000,
      avatarName: await seedAvatar("helena.jpg"),
      ageCheck: { create: { method: "simulada", result: "18+" } },
    },
  });

  const publishedMedia = await seedMedia("caderno.jpg");
  const quarantineMedia = await seedMedia("studio.jpg");

  const published = await db.post.create({
    data: {
      creatorId: helena.id,
      title: "Luz de janela no caderno",
      body: "Um recorte do caderno de desenho, com a luz da tarde na mesa.",
      priceCents: 800,
      status: "published",
      media: {
        create: {
          storageName: publishedMedia.storageName,
          mime: publishedMedia.mime,
          sourceHash: publishedMedia.sourceHash,
          status: "published",
        },
      },
      consents: {
        create: {
          userId: helena.id,
          kind: "self",
          scope: "publicação deste estudo no estúdio",
          revoked: false,
        },
      },
    },
  });

  await db.post.create({
    data: {
      creatorId: helena.id,
      title: "Estudo de grafite ainda fechado",
      body: "Um desenho a grafite que ainda espera revisão humana.",
      priceCents: 0,
      status: "quarantine",
      media: {
        create: {
          storageName: quarantineMedia.storageName,
          mime: quarantineMedia.mime,
          sourceHash: quarantineMedia.sourceHash,
          status: "quarantine",
        },
      },
      consents: {
        create: {
          userId: helena.id,
          kind: "self",
          scope: "publicação deste estudo no estúdio",
          revoked: false,
        },
      },
    },
  });

  await db.follow.create({ data: { fanId: marina.id, creatorId: helena.id } });

  const amountCents = 2000;
  const lines = orderLedger(amountCents, true);
  if (linesSum(lines) !== 0) throw new Error("Seed contábil não fecha.");
  const offerText = describeOffer({
    kind: "subscribe",
    creatorName: helena.displayName,
    amountCents,
  });
  const order = await db.order.create({
    data: {
      buyerId: marina.id,
      creatorId: helena.id,
      kind: "subscribe",
      amountCents,
      offerText,
      status: "posted",
    },
  });
  await db.ledgerEntry.createMany({
    data: lines.map((line) => ({
      orderId: order.id,
      account: line.account,
      ownerId: line.account === "buyer_clearing" ? marina.id : line.account === "creator_payable" ? helena.id : null,
      amountCents: line.amountCents,
      posted: line.posted,
    })),
  });
  await db.subscription.create({
    data: {
      fanId: marina.id,
      creatorId: helena.id,
      status: "active",
      priceCents: amountCents,
    },
  });
  await db.chatMessage.create({
    data: {
      senderId: marina.id,
      recipientId: helena.id,
      body: "Vi o estudo publicado. O traço está claro.",
    },
  });

  console.log("Seed pronto.");
  console.log("Admin: admin@exemplo.local");
  console.log("Fã: marina@exemplo.local");
  console.log("Estúdio: helena@exemplo.local");
  console.log(`Post publicado: ${published.id}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });

import "server-only";
import { ageFromBirthDate } from "@/domain/age";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";
import { hashPassword, verifyPassword } from "@/server/password";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
  birthDate: string;
}) {
  const email = input.email.toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) throw new HttpError(400, "E-mail inválido.");
  if (input.password.length < 8) throw new HttpError(400, "A senha precisa de 8 caracteres.");
  const displayName = input.displayName.trim();
  if (displayName.length < 2 || displayName.length > 80) throw new HttpError(400, "Informe um nome público.");
  const age = ageFromBirthDate(input.birthDate);
  if (age === null || age < 18 || age > 120) {
    throw new HttpError(400, "A data de nascimento não entra neste produto.");
  }
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(400, "Esse e-mail já tem conta.");
  const passwordHash = await hashPassword(input.password);
  return db.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      ageCheck: { create: { method: "simulada", result: "18+" } },
    },
  });
}

export async function loginUser(email: string, password: string) {
  const normalized = email.toLowerCase();
  const lock = await db.loginLock.findUnique({ where: { email: normalized } });
  if (lock?.lockedUntil && lock.lockedUntil > new Date()) {
    throw new HttpError(429, "E-mail ou senha não conferem.");
  }
  const user = await db.user.findUnique({ where: { email: normalized } });
  const valid = user && !user.deletedAt ? await verifyPassword(password, user.passwordHash) : false;
  if (!valid || !user) {
    const failures = (lock?.failures ?? 0) + 1;
    await db.loginLock.upsert({
      where: { email: normalized },
      create: {
        email: normalized,
        failures,
        lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
      update: {
        failures,
        lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    });
    throw new HttpError(401, "E-mail ou senha não conferem.");
  }
  await db.loginLock.deleteMany({ where: { email: normalized } });
  return user;
}

export async function eraseAccount(userId: string) {
  await db.session.deleteMany({ where: { userId } });
  await db.chatMessage.updateMany({ where: { senderId: userId }, data: { body: "" } });
  await db.user.update({
    where: { id: userId },
    data: {
      email: `encerrada-${userId}@local.invalid`,
      passwordHash: "apagada",
      displayName: "Conta encerrada",
      bio: "",
      avatarName: "",
      deletedAt: new Date(),
    },
  });
}

export async function applyAsCreator(userId: string, displayName: string, bio: string) {
  const name = displayName.trim();
  const text = bio.trim();
  if (name.length < 2 || name.length > 80) throw new HttpError(400, "Informe um nome público.");
  if (text.length < 10 || text.length > 500) throw new HttpError(400, "A bio precisa de um parágrafo curto.");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new HttpError(401, "Entre para continuar.");
  if (user.creatorStatus === "approved") throw new HttpError(400, "O estúdio já foi aprovado.");
  if (user.creatorStatus === "pending") throw new HttpError(400, "O pedido já está na fila.");
  return db.user.update({
    where: { id: userId },
    data: { displayName: name, bio: text, creatorStatus: "pending" },
  });
}

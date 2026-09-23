import "server-only";
import { redirect } from "next/navigation";
import { ageGateAllows } from "@/domain/age";
import { HttpError } from "@/server/http";
import { currentUser } from "@/server/session";

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Entre para continuar.");
  if (!ageGateAllows(user.ageCheck)) {
    throw new HttpError(403, "Falta a conferência de idade simulada.");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "A fila é de administração.");
  return user;
}

export async function pageUser() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  if (!ageGateAllows(user.ageCheck)) {
    redirect(`/entrar?erro=${encodeURIComponent("Falta a conferência de idade simulada.")}`);
  }
  return user;
}

export async function pageAdmin() {
  const user = await pageUser();
  if (user.role !== "admin") redirect("/feed");
  return user;
}

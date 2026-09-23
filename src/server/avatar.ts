import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { imageRejection } from "@/domain/sniff";
import { HttpError } from "@/server/http";

const AVATAR_NAME = /^av-[a-f0-9]{32}\.jpg$/;
const dir = () => path.join(process.cwd(), "storage");

// Avatar quadrado de 512px, endireitado pela orientação e sem metadados.
// Diferente dos posts, não passa por quarentena: é a cara pública da conta.
export async function storeAvatar(originalName: string, bytes: Uint8Array, declaredType = ""): Promise<string> {
  if (bytes.length === 0) throw new HttpError(400, "Escolha uma imagem antes de enviar.");
  const reason = imageRejection(path.basename(originalName), bytes, declaredType);
  if (reason) throw new HttpError(400, reason);
  let output: Buffer;
  try {
    output = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 512, height: 512, fit: "cover", position: "attention" })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new HttpError(400, "Não deu para ler essa imagem.");
  }
  const name = `av-${randomBytes(16).toString("hex")}.jpg`;
  await mkdir(dir(), { recursive: true });
  await writeFile(path.join(dir(), name), output);
  return name;
}

export async function removeAvatar(name: string): Promise<void> {
  if (!AVATAR_NAME.test(name)) return;
  await rm(path.join(dir(), name), { force: true });
}

export async function readAvatar(name: string): Promise<Buffer> {
  if (!AVATAR_NAME.test(name)) throw new HttpError(404, "Imagem ausente.");
  try {
    return await readFile(path.join(dir(), name));
  } catch {
    throw new HttpError(404, "Imagem ausente.");
  }
}

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { imageRejection, sniffImage } from "@/domain/sniff";
import { HttpError } from "@/server/http";

const STORAGE_NAME = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

export function storagePath(storageName: string): string {
  if (!STORAGE_NAME.test(storageName)) throw new HttpError(404, "Arquivo ausente.");
  return path.join(process.cwd(), "storage", storageName);
}

export async function storeUpload(originalName: string, bytes: Uint8Array, declaredType = ""): Promise<{
  storageName: string;
  mime: string;
  sourceHash: string;
}> {
  const safeName = path.basename(originalName);
  const reason = imageRejection(safeName, bytes, declaredType);
  if (reason) throw new HttpError(400, reason);
  const sniffed = sniffImage(bytes);
  if (!sniffed) throw new HttpError(400, "Envie jpeg, png ou webp.");
  const storageName = `${randomBytes(16).toString("hex")}.${sniffed.ext}`;
  const dir = path.join(process.cwd(), "storage");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storageName), bytes);
  const sourceHash = createHash("sha256").update(bytes).digest("hex");
  return { storageName, mime: sniffed.mime, sourceHash };
}

export async function renderMarked(storageName: string, viewerId: string): Promise<Buffer> {
  const file = storagePath(storageName);
  const source = await readFile(file);
  const meta = await sharp(source).metadata();
  const width = Math.max(meta.width ?? 64, 64);
  const height = Math.max(meta.height ?? 64, 64);
  const bandHeight = 42;
  const mark = viewerId.slice(-4).replace(/[^\da-f]/gi, "");
  const svg = Buffer.from(
    `<svg width="${width}" height="${bandHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#121417"/><text x="12" y="28" fill="#2F6FED" font-size="20" font-family="sans-serif">${mark}</text></svg>`,
  );
  const prepared = await sharp(source).resize({ width, height, fit: "fill" }).png().toBuffer();
  return sharp(prepared)
    .extend({ bottom: bandHeight, background: "#121417" })
    .composite([{ input: svg, gravity: "south" }])
    .jpeg({ quality: 80 })
    .toBuffer();
}

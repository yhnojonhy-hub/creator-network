import { createHmac, timingSafeEqual } from "node:crypto";

const TEN_MINUTES = 10 * 60 * 1000;

function mediaSecret(): string {
  const value = process.env.MEDIA_SECRET;
  if (!value) throw new Error("MEDIA_SECRET ausente");
  return value;
}

export function signMediaToken(mediaId: string, viewerId: string, now = Date.now()): string {
  const exp = now + TEN_MINUTES;
  const payload = `${mediaId}.${viewerId}.${exp}`;
  const sig = createHmac("sha256", mediaSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyMediaToken(token: string, mediaId: string, now = Date.now()): string | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [id, viewerId, expText, sig] = parts;
  if (!id || !viewerId || !expText || !sig || id !== mediaId) return null;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp < now) return null;
  const expected = createHmac("sha256", mediaSecret()).update(`${id}.${viewerId}.${expText}`).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  return viewerId;
}

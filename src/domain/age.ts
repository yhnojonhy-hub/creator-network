export function ageFromBirthDate(birthDate: string, today = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const born = new Date(Date.UTC(year, month - 1, day));
  if (born.getUTCFullYear() !== year || born.getUTCMonth() !== month - 1 || born.getUTCDate() !== day) {
    return null;
  }
  let age = today.getUTCFullYear() - year;
  const monthDelta = today.getUTCMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < day)) age -= 1;
  return age;
}

export type AgeRecord = {
  method: string;
  result: string;
  checkedAt: Date;
} | null;

export function ageGateAllows(record: AgeRecord): boolean {
  if (!record) return false;
  if (record.method !== "simulada" || record.result !== "18+") return false;
  return record.checkedAt instanceof Date && !Number.isNaN(record.checkedAt.getTime());
}

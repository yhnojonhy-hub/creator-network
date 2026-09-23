const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function isNewSubscriber(status: string, createdAt: Date, now: Date): boolean {
  return status === "active" && now.getTime() - createdAt.getTime() <= WEEK_MS;
}

export function isCancellationRisk(status: string, endsAt: Date | null): boolean {
  return status === "canceled" || endsAt !== null;
}

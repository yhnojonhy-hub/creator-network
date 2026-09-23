export function isPublicPostVisible(status: string): boolean {
  return status === "published";
}

export function hasValidConsent(consents: { revoked: boolean }[]): boolean {
  return consents.some((consent) => !consent.revoked);
}

export function canViewMedia(input: {
  viewerId: string;
  viewerRole: string;
  creatorId: string;
  postStatus: string;
  mediaStatus: string;
  priceCents: number;
  purchased: boolean;
}): boolean {
  if (input.viewerRole === "admin" || input.viewerId === input.creatorId) return true;
  if (!isPublicPostVisible(input.postStatus) || input.mediaStatus !== "published") return false;
  if (input.priceCents === 0) return true;
  return input.purchased;
}

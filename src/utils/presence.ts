import { ONLINE_THRESHOLD_MS } from "@/types/community";

export function isUserOnline(
  lastSeenAt: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!lastSeenAt) {
    return false;
  }

  const seen = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seen)) {
    return false;
  }

  return nowMs - seen <= ONLINE_THRESHOLD_MS;
}

import { ONLINE_THRESHOLD_MS } from "@/types/community";
import { isUserOnline } from "@/utils/presence";

describe("isUserOnline", () => {
  const now = Date.parse("2026-07-30T12:00:00.000Z");

  it("returns false for missing or invalid timestamps", () => {
    expect(isUserOnline(null, now)).toBe(false);
    expect(isUserOnline(undefined, now)).toBe(false);
    expect(isUserOnline("not-a-date", now)).toBe(false);
  });

  it("returns true when last_seen is within the threshold", () => {
    const recent = new Date(now - ONLINE_THRESHOLD_MS + 1000).toISOString();
    expect(isUserOnline(recent, now)).toBe(true);
  });

  it("returns false when last_seen is older than the threshold", () => {
    const stale = new Date(now - ONLINE_THRESHOLD_MS - 1000).toISOString();
    expect(isUserOnline(stale, now)).toBe(false);
  });
});

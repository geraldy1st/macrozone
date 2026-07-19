import { formatRelativeTime } from "@/utils/relativeTime";

describe("formatRelativeTime", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-19T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("formats recent times in English", () => {
    expect(formatRelativeTime("2026-07-19T11:59:30.000Z", "en")).toBe("just now");
    expect(formatRelativeTime("2026-07-19T11:30:00.000Z", "en")).toBe("30m ago");
    expect(formatRelativeTime("2026-07-19T09:00:00.000Z", "en")).toBe("3h ago");
  });

  it("formats in French", () => {
    expect(formatRelativeTime("2026-07-19T11:00:00.000Z", "fr")).toBe("il y a 1 h");
  });
});

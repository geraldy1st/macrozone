import { calculateAge, parseIsoDate, toIsoDate } from "@/utils/age";

describe("calculateAge", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 15));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns age from a valid birth date", () => {
    expect(calculateAge("2000-07-15")).toBe(26);
    expect(calculateAge("2000-07-16")).toBe(25);
  });

  it("returns null for invalid dates", () => {
    expect(calculateAge("")).toBeNull();
    expect(calculateAge("not-a-date")).toBeNull();
    expect(calculateAge("2030-01-01")).toBeNull();
  });
});

describe("toIsoDate / parseIsoDate", () => {
  it("round-trips dates", () => {
    const date = new Date(1995, 0, 15);
    const iso = toIsoDate(date);

    expect(iso).toBe("1995-01-15");
    expect(parseIsoDate(iso)).toEqual(date);
  });
});

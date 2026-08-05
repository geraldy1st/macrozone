import { isPostEdited } from "@/utils/postEdited";

describe("isPostEdited", () => {
  it("returns false when timestamps missing or equal", () => {
    expect(isPostEdited(null, null)).toBe(false);
    expect(isPostEdited("2026-01-01T12:00:00.000Z", "2026-01-01T12:00:00.000Z")).toBe(
      false,
    );
    expect(isPostEdited("2026-01-01T12:00:00.000Z", "2026-01-01T12:00:02.000Z")).toBe(
      false,
    );
  });

  it("returns true when updated_at is after the edit threshold", () => {
    expect(isPostEdited("2026-01-01T12:00:00.000Z", "2026-01-01T12:00:05.000Z")).toBe(
      true,
    );
  });
});

import { getAvatarInitials } from "@/components/ProfileAvatar";

describe("getAvatarInitials", () => {
  it("returns question mark for empty names", () => {
    expect(getAvatarInitials("")).toBe("?");
    expect(getAvatarInitials(null)).toBe("?");
  });

  it("uses first letters of two words", () => {
    expect(getAvatarInitials("Ada Lovelace")).toBe("AL");
  });

  it("uses first two characters of a single word", () => {
    expect(getAvatarInitials("Gerald")).toBe("GE");
  });
});

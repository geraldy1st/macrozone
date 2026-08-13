import { getAvatarInitials } from "@/components/ProfileAvatar";
import { resolveDisplayAvatarUri } from "@/utils/avatar";

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

describe("resolveDisplayAvatarUri", () => {
  it("hides Google-hosted avatars", () => {
    expect(
      resolveDisplayAvatarUri(
        "https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c",
      ),
    ).toBeNull();
  });

  it("keeps custom http avatars", () => {
    expect(
      resolveDisplayAvatarUri(
        "https://fkxyydxupseaontihoss.supabase.co/storage/v1/object/public/meal-posts/abc/profile-avatar.jpg",
      ),
    ).toContain("profile-avatar.jpg");
  });
});

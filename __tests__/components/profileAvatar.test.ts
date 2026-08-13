import { getAvatarInitials } from "@/components/ProfileAvatar";
import {
  isAppProfilePhoto,
  resolveAuthorAvatarUri,
  resolveDisplayAvatarUri,
} from "@/utils/avatar";

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

describe("isAppProfilePhoto", () => {
  it("accepts local files and uploaded profile-avatar URLs", () => {
    expect(isAppProfilePhoto("file:///photo.jpg")).toBe(true);
    expect(
      isAppProfilePhoto(
        "https://example.supabase.co/storage/v1/object/public/meal-posts/abc/profile-avatar.jpg?t=1",
      ),
    ).toBe(true);
  });

  it("rejects Google and other leftover URLs", () => {
    expect(
      isAppProfilePhoto("https://lh3.googleusercontent.com/a/ACg8ocExample"),
    ).toBe(false);
    expect(isAppProfilePhoto("https://cdn.example.com/random.jpg")).toBe(false);
    expect(isAppProfilePhoto(null)).toBe(false);
  });
});

describe("resolveDisplayAvatarUri", () => {
  it("hides Google-hosted avatars", () => {
    expect(
      resolveDisplayAvatarUri("https://lh3.googleusercontent.com/a/ACg8ocExample"),
    ).toBeNull();
  });

  it("keeps uploaded app avatars", () => {
    expect(
      resolveDisplayAvatarUri(
        "https://fkxyydxupseaontihoss.supabase.co/storage/v1/object/public/meal-posts/abc/profile-avatar.jpg",
      ),
    ).toContain("profile-avatar.jpg");
  });
});

describe("resolveAuthorAvatarUri", () => {
  it("TC-AVATAR-01: Profile and Member profile use the same app photo for me", () => {
    const profilePhoto = "file:///data/user/0/com.geraldy.macrozone/avatar.jpg";
    const memberUri = resolveAuthorAvatarUri({
      authorId: "user-1",
      remoteUri: "https://lh3.googleusercontent.com/a/stale-google",
      myUserId: "user-1",
      myAvatarUri: profilePhoto,
    });
    expect(memberUri).toBe(resolveDisplayAvatarUri(profilePhoto));
    expect(memberUri).toBe(profilePhoto);
  });

  it("TC-AVATAR-02/03: no app photo → neither side shows Google", () => {
    expect(resolveDisplayAvatarUri("https://lh3.googleusercontent.com/a/x")).toBeNull();
    expect(
      resolveAuthorAvatarUri({
        authorId: "user-1",
        remoteUri: "https://lh3.googleusercontent.com/a/x",
        myUserId: "user-1",
        myAvatarUri: null,
      }),
    ).toBeNull();
  });

  it("TC-AVATAR-04: other members only show uploaded app photos", () => {
    expect(
      resolveAuthorAvatarUri({
        authorId: "them",
        remoteUri: "https://cdn.example.com/a.jpg",
        myUserId: "me",
        myAvatarUri: "file:///photo.jpg",
      }),
    ).toBeNull();
    expect(
      resolveAuthorAvatarUri({
        authorId: "them",
        remoteUri:
          "https://cdn.example.com/storage/v1/object/public/meal-posts/them/profile-avatar.jpg",
        myUserId: "me",
        myAvatarUri: "file:///photo.jpg",
      }),
    ).toContain("profile-avatar.jpg");
  });
});

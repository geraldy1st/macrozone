import { getUserProfile, setUserProfile } from "@/storage/profile";
import {
  isAppProfilePhoto,
  isLocalImageUri,
} from "@/utils/avatar";
import type { User } from "@supabase/supabase-js";
import { uploadProfileAvatar } from "./avatarUpload";
import { upsertMyProfile } from "./profiles";

function localDisplayName(user: User, localName: string): string {
  if (localName.trim()) {
    return localName.trim();
  }
  const meta = user.user_metadata ?? {};
  if (typeof meta.full_name === "string" && meta.full_name.trim()) {
    return meta.full_name.trim();
  }
  if (typeof meta.name === "string" && meta.name.trim()) {
    return meta.name.trim();
  }
  if (user.email) {
    return user.email.split("@")[0] || "User";
  }
  return "User";
}

/**
 * One photo: Edit profile → upload to storage → same URL on Profile and Member profile.
 * Clears Google / leftover URLs from local + remote.
 */
export async function syncMyCommunityProfile(user: User): Promise<void> {
  const local = await getUserProfile();
  const displayName = localDisplayName(user, local.name);
  const showCommunityPosts = local.showCommunityPosts !== false;
  const bio = local.bio ?? "";
  const countryCode = local.countryCode?.trim() || null;
  const socialLinks = local.socialLinks
    .filter((link) => link.url.trim())
    .map((link) => ({ platform: link.platform, url: link.url.trim() }));

  const photo = local.photoUri?.trim() ?? "";
  let avatarUrl: string | null = null;
  let nextLocalPhoto: string | null = photo && isAppProfilePhoto(photo) ? photo : null;

  if (photo && isLocalImageUri(photo)) {
    try {
      avatarUrl = await uploadProfileAvatar(user.id, photo);
      nextLocalPhoto = avatarUrl;
    } catch (error) {
      console.warn("Profile avatar upload failed:", error);
      // Keep showing the local file on this device; do not push a corrupt remote URL.
      avatarUrl = null;
    }
  } else if (photo && isAppProfilePhoto(photo)) {
    avatarUrl = photo;
    nextLocalPhoto = photo;
  } else {
    avatarUrl = null;
    nextLocalPhoto = null;
  }

  await upsertMyProfile({
    userId: user.id,
    displayName,
    avatarUrl,
    showCommunityPosts,
    bio,
    countryCode,
    socialLinks,
  });

  if ((local.photoUri ?? null) !== nextLocalPhoto) {
    const next = { ...local };
    if (nextLocalPhoto) {
      next.photoUri = nextLocalPhoto;
    } else {
      delete next.photoUri;
    }
    await setUserProfile(next);
  }
}

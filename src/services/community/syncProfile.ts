import { getUserProfile, setUserProfile } from "@/storage/profile";
import type { User } from "@supabase/supabase-js";
import { uploadProfileAvatar } from "./avatarUpload";
import { getProfile, upsertMyProfile } from "./profiles";

function oauthDisplayName(user: User): string {
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

function isLocalImageUri(uri: string): boolean {
  return (
    uri.startsWith("file:") ||
    uri.startsWith("content:") ||
    uri.startsWith("ph:") ||
    uri.startsWith("assets-library:") ||
    uri.startsWith("/")
  );
}

/** Google-hosted avatar URLs (not used for community avatars — A011-3). */
export function isGoogleHostedAvatar(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return (
    /googleusercontent\.com/i.test(url) ||
    /ggpht\.com/i.test(url) ||
    /google\.com\/.*\/photo/i.test(url)
  );
}

/** Uploaded community avatars live under meal-posts/{userId}/profile-avatar.jpg */
function isCustomUploadedAvatar(url: string | null | undefined, userId: string): boolean {
  if (!url) {
    return false;
  }
  return url.includes(`${userId}/profile-avatar`);
}

/**
 * Push local profile to public `profiles`.
 * Avatar policy (A011-3): app profile photo only — never Google OAuth picture.
 * Also syncs show_community_posts, bio, country, social links.
 * After a successful local upload, stores the public URL in local photoUri so
 * Profile and Community display the same image.
 */
export async function syncMyCommunityProfile(user: User): Promise<void> {
  let displayName = oauthDisplayName(user);
  /** `null` clears remote avatar; `undefined` leaves it unchanged only on upload soft-fail of existing custom. */
  let avatarUrl: string | null | undefined = null;
  let showCommunityPosts = true;
  let bio = "";
  let countryCode: string | null = null;
  let socialLinks: { platform: string; url: string }[] = [];
  let persistLocalPhotoUri: string | undefined;

  try {
    const local = await getUserProfile();
    if (local.name.trim()) {
      displayName = local.name.trim();
    }
    showCommunityPosts = local.showCommunityPosts !== false;
    bio = local.bio ?? "";
    countryCode = local.countryCode?.trim() || null;
    socialLinks = local.socialLinks
      .filter((link) => link.url.trim())
      .map((link) => ({ platform: link.platform, url: link.url.trim() }));

    const photo = local.photoUri?.trim() ?? "";

    if (photo && isLocalImageUri(photo)) {
      try {
        avatarUrl = await uploadProfileAvatar(user.id, photo);
        persistLocalPhotoUri = avatarUrl;
      } catch (error) {
        console.warn("Profile avatar upload failed:", error);
        const existing = await getProfile(user.id);
        if (isCustomUploadedAvatar(existing?.avatar_url, user.id)) {
          // Keep existing custom remote; do not fall back to Google
          avatarUrl = undefined;
        } else {
          avatarUrl = null;
        }
      }
    } else if (photo.startsWith("http") && !isGoogleHostedAvatar(photo)) {
      // Already a public custom URL (e.g. previous upload)
      avatarUrl = photo;
    } else {
      // No app photo, or only a Google URL stored locally — clear remote avatar
      avatarUrl = null;
      if (photo && isGoogleHostedAvatar(photo)) {
        persistLocalPhotoUri = ""; // strip Google URL from local profile
      }
    }
  } catch (error) {
    console.warn("syncMyCommunityProfile local read failed:", error);
    avatarUrl = null;
  }

  await upsertMyProfile({
    userId: user.id,
    displayName,
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    showCommunityPosts,
    bio,
    countryCode,
    socialLinks,
  });

  // Unify Profile tab photo with community avatar (public URL, never Google).
  if (persistLocalPhotoUri !== undefined) {
    try {
      const local = await getUserProfile();
      if (persistLocalPhotoUri === "") {
        const next = { ...local };
        delete next.photoUri;
        await setUserProfile(next);
      } else if (local.photoUri !== persistLocalPhotoUri) {
        await setUserProfile({
          ...local,
          photoUri: persistLocalPhotoUri,
        });
      }
    } catch {
      // Non-blocking
    }
  }
}

import { getUserProfile } from "@/storage/profile";
import type { User } from "@supabase/supabase-js";
import { uploadProfileAvatar } from "./avatarUpload";
import { getProfile, upsertMyProfile } from "./profiles";

function oauthAvatarUrl(user: User): string | null {
  const meta = user.user_metadata ?? {};
  if (typeof meta.avatar_url === "string" && meta.avatar_url.startsWith("http")) {
    return meta.avatar_url.trim();
  }
  if (typeof meta.picture === "string" && meta.picture.startsWith("http")) {
    return meta.picture.trim();
  }
  return null;
}

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

/** Uploaded community avatars live under meal-posts/{userId}/profile-avatar.jpg */
function isCustomUploadedAvatar(url: string | null | undefined, userId: string): boolean {
  if (!url) {
    return false;
  }
  return url.includes(`${userId}/profile-avatar`);
}

/**
 * Push local profile + OAuth metadata to public `profiles`.
 * Priority (A010-1): custom local/uploaded photo > existing custom remote > Google > none.
 * Google picture is never used when the user has a custom profile photo.
 * Also syncs show_community_posts (A010-2).
 */
export async function syncMyCommunityProfile(user: User): Promise<void> {
  let displayName = oauthDisplayName(user);
  let avatarUrl: string | null | undefined = undefined;
  let showCommunityPosts: boolean | undefined;

  try {
    const local = await getUserProfile();
    if (local.name.trim()) {
      displayName = local.name.trim();
    }
    showCommunityPosts = local.showCommunityPosts !== false;

    const photo = local.photoUri?.trim() ?? "";

    if (photo.startsWith("http")) {
      // Explicit remote custom URL (or previously uploaded public URL stored locally)
      avatarUrl = photo;
    } else if (photo && isLocalImageUri(photo)) {
      try {
        avatarUrl = await uploadProfileAvatar(user.id, photo);
      } catch (error) {
        console.warn("Profile avatar upload failed:", error);
        // Keep existing custom remote if any; do not fall back to Google over a custom intent
        const existing = await getProfile(user.id);
        if (isCustomUploadedAvatar(existing?.avatar_url, user.id)) {
          avatarUrl = undefined; // leave remote custom as-is
        } else {
          avatarUrl = null;
        }
      }
    } else {
      // No local photo: clear Google if we only had Google, prefer null over wrong photo.
      // If remote is already a custom upload, leave it unless user cleared local intentionally.
      const existing = await getProfile(user.id);
      if (isCustomUploadedAvatar(existing?.avatar_url, user.id)) {
        // User cleared local photo — remove custom community avatar
        avatarUrl = null;
      } else {
        // No custom photo: Google only as last resort
        avatarUrl = oauthAvatarUrl(user);
      }
    }
  } catch {
    const oauth = oauthAvatarUrl(user);
    avatarUrl = oauth;
  }

  await upsertMyProfile({
    userId: user.id,
    displayName,
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    ...(showCommunityPosts !== undefined ? { showCommunityPosts } : {}),
  });
}

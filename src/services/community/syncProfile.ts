import { getUserProfile } from "@/storage/profile";
import type { User } from "@supabase/supabase-js";
import { uploadProfileAvatar } from "./avatarUpload";
import { upsertMyProfile } from "./profiles";

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

/**
 * Push local profile + OAuth metadata to public `profiles` so Community
 * can show display name and avatar for other users (A009-3).
 */
export async function syncMyCommunityProfile(user: User): Promise<void> {
  let displayName = oauthDisplayName(user);
  let avatarUrl: string | null | undefined = undefined;

  try {
    const local = await getUserProfile();
    if (local.name.trim()) {
      displayName = local.name.trim();
    }

    const photo = local.photoUri?.trim() ?? "";
    if (photo.startsWith("http")) {
      avatarUrl = photo;
    } else if (photo && isLocalImageUri(photo)) {
      try {
        avatarUrl = await uploadProfileAvatar(user.id, photo);
      } catch (error) {
        console.warn("Profile avatar upload failed, falling back to OAuth:", error);
        avatarUrl = oauthAvatarUrl(user) ?? undefined;
      }
    } else {
      // No local photo — prefer Google picture if present; do not clear existing.
      const oauth = oauthAvatarUrl(user);
      if (oauth) {
        avatarUrl = oauth;
      }
    }
  } catch {
    const oauth = oauthAvatarUrl(user);
    if (oauth) {
      avatarUrl = oauth;
    }
  }

  await upsertMyProfile({
    userId: user.id,
    displayName,
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
  });
}

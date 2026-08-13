/**
 * One profile photo only: the picture chosen in Edit profile.
 * Anything else (Google OAuth, leftover http URLs) is treated as no photo.
 */

export function isLocalImageUri(url: string): boolean {
  return (
    url.startsWith("file:") ||
    url.startsWith("content:") ||
    url.startsWith("ph:") ||
    url.startsWith("assets-library:") ||
    url.startsWith("/")
  );
}

export function isGoogleHostedAvatar(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return (
    /googleusercontent\.com/i.test(url) ||
    /ggpht\.com/i.test(url) ||
    /lh[0-9]\.google/i.test(url) ||
    /google\.com\/.*\/photo/i.test(url)
  );
}

/** Uploaded app avatars live at …/{userId}/profile-avatar.jpg */
export function isAppProfilePhoto(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  if (!trimmed || isGoogleHostedAvatar(trimmed)) {
    return false;
  }
  if (isLocalImageUri(trimmed)) {
    return true;
  }
  return trimmed.includes("/profile-avatar");
}

/** Only the in-app profile photo may be displayed. */
export function resolveDisplayAvatarUri(
  url: string | null | undefined,
): string | null {
  const trimmed = url?.trim() ?? "";
  if (!isAppProfilePhoto(trimmed)) {
    return null;
  }
  return trimmed;
}

/**
 * Member profile / feed: same photo as the Profile tab.
 * For the signed-in user, prefer the local Profile photo.
 * For others, only a stored app upload (never Google / random URLs).
 */
export function resolveAuthorAvatarUri(options: {
  authorId?: string | null;
  remoteUri?: string | null;
  myUserId?: string | null;
  myAvatarUri?: string | null;
}): string | null {
  if (
    options.myUserId &&
    options.authorId &&
    options.myUserId === options.authorId
  ) {
    return (
      resolveDisplayAvatarUri(options.myAvatarUri) ??
      resolveDisplayAvatarUri(options.remoteUri)
    );
  }
  return resolveDisplayAvatarUri(options.remoteUri);
}

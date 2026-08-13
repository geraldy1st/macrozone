/** Google-hosted avatar URLs — never shown as the app profile photo (A011-3). */
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

/** Displayable app avatar: http(s) that is not a Google OAuth picture. */
export function resolveDisplayAvatarUri(
  url: string | null | undefined,
): string | null {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  if (isGoogleHostedAvatar(trimmed)) {
    return null;
  }
  return trimmed;
}

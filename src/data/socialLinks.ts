import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export const MAX_SOCIAL_LINKS = 6;
export const MAX_NAME_LENGTH = 20;
export const MAX_BIO_LENGTH = 400;

export type SocialPlatform =
  | "instagram"
  | "snapchat"
  | "youtube"
  | "github"
  | "linkedin"
  | "tiktok"
  | "x"
  | "website";

export type SocialLink = {
  platform: SocialPlatform;
  url: string;
};

export const socialPlatforms: {
  id: SocialPlatform;
  labelKey: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  placeholder: string;
}[] = [
  {
    id: "instagram",
    labelKey: "profile.social.instagram",
    icon: "logo-instagram",
    placeholder: "https://instagram.com/username",
  },
  {
    id: "snapchat",
    labelKey: "profile.social.snapchat",
    icon: "logo-snapchat",
    placeholder: "https://snapchat.com/add/username",
  },
  {
    id: "youtube",
    labelKey: "profile.social.youtube",
    icon: "logo-youtube",
    placeholder: "https://youtube.com/@channel",
  },
  {
    id: "github",
    labelKey: "profile.social.github",
    icon: "logo-github",
    placeholder: "https://github.com/username",
  },
  {
    id: "linkedin",
    labelKey: "profile.social.linkedin",
    icon: "logo-linkedin",
    placeholder: "https://linkedin.com/in/username",
  },
  {
    id: "tiktok",
    labelKey: "profile.social.tiktok",
    icon: "logo-tiktok",
    placeholder: "https://tiktok.com/@username",
  },
  {
    id: "x",
    labelKey: "profile.social.x",
    icon: "logo-twitter",
    placeholder: "https://x.com/username",
  },
  {
    id: "website",
    labelKey: "profile.social.website",
    icon: "link-outline",
    placeholder: "https://example.com",
  },
];

export function getSocialPlatform(platform: SocialPlatform) {
  return socialPlatforms.find((item) => item.id === platform);
}

/** Normalize and validate a personal link URL. */
export function normalizeSocialUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    // Prefer https for display/storage
    if (url.protocol === "http:") {
      url.protocol = "https:";
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function formatSocialUrlLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const path = `${parsed.hostname}${parsed.pathname}`.replace(/\/$/, "");
    return path.length > 36 ? `${path.slice(0, 33)}…` : path;
  } catch {
    return url.length > 36 ? `${url.slice(0, 33)}…` : url;
  }
}

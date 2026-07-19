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
  /** Username / handle only (no protocol). Full URL still accepted and normalized. */
  url: string;
};

const baseUrls: Record<SocialPlatform, string> = {
  instagram: "https://instagram.com/",
  snapchat: "https://snapchat.com/add/",
  youtube: "https://youtube.com/@",
  github: "https://github.com/",
  linkedin: "https://linkedin.com/in/",
  tiktok: "https://tiktok.com/@",
  x: "https://x.com/",
  website: "https://",
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
    placeholder: "username",
  },
  {
    id: "snapchat",
    labelKey: "profile.social.snapchat",
    icon: "logo-snapchat",
    placeholder: "username",
  },
  {
    id: "youtube",
    labelKey: "profile.social.youtube",
    icon: "logo-youtube",
    placeholder: "channel",
  },
  {
    id: "github",
    labelKey: "profile.social.github",
    icon: "logo-github",
    placeholder: "username",
  },
  {
    id: "linkedin",
    labelKey: "profile.social.linkedin",
    icon: "logo-linkedin",
    placeholder: "username",
  },
  {
    id: "tiktok",
    labelKey: "profile.social.tiktok",
    icon: "logo-tiktok",
    placeholder: "username",
  },
  {
    id: "x",
    labelKey: "profile.social.x",
    icon: "logo-twitter",
    placeholder: "username",
  },
  {
    id: "website",
    labelKey: "profile.social.website",
    icon: "link-outline",
    placeholder: "example.com",
  },
];

export function getSocialPlatform(platform: SocialPlatform) {
  return socialPlatforms.find((item) => item.id === platform);
}

/**
 * Normalize user input to a clean username / handle (no https://, no @).
 * Also accepts a full URL and extracts the username part.
 */
export function normalizeSocialUsername(
  platform: SocialPlatform,
  raw: string,
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  // Full URL pasted by the user
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes(".")) {
    try {
      const withProtocol = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      const parsed = new URL(withProtocol);

      if (platform === "website") {
        const hostPath = `${parsed.hostname}${parsed.pathname}`.replace(/\/$/, "");
        return hostPath || null;
      }

      const segments = parsed.pathname.split("/").filter(Boolean);
      // youtube.com/@channel → channel, snapchat.com/add/user → user
      let candidate = segments[segments.length - 1] ?? "";
      if (candidate.startsWith("@")) {
        candidate = candidate.slice(1);
      }
      if (segments[0] === "add" && segments[1]) {
        candidate = segments[1];
      }
      if (segments[0] === "in" && segments[1]) {
        candidate = segments[1];
      }
      return candidate || null;
    } catch {
      // fall through to plain handle handling
    }
  }

  let handle = trimmed.replace(/^@+/, "").replace(/^\/+/, "");
  handle = handle.split(/[/?#]/)[0]?.trim() ?? "";

  if (!handle || /\s/.test(handle)) {
    return null;
  }

  if (platform === "website") {
    return handle.replace(/^https?:\/\//i, "").replace(/\/$/, "") || null;
  }

  // Usernames should not look like full host paths for social platforms
  if (handle.includes("://")) {
    return null;
  }

  return handle;
}

/** Build a full openable URL from platform + username. */
export function buildSocialUrl(platform: SocialPlatform, username: string): string {
  const handle = username.replace(/^@+/, "").trim();

  if (platform === "website") {
    if (/^https?:\/\//i.test(handle)) {
      return handle;
    }
    return `https://${handle}`;
  }

  if (platform === "youtube" || platform === "tiktok") {
    return `${baseUrls[platform]}${handle.replace(/^@/, "")}`;
  }

  return `${baseUrls[platform]}${handle}`;
}

/** Label shown on profile: username only, no protocol. */
export function formatSocialUrlLabel(urlOrUsername: string): string {
  const trimmed = urlOrUsername.trim();
  if (!trimmed) {
    return "";
  }

  if (!/^https?:\/\//i.test(trimmed) && !trimmed.includes("/")) {
    return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    const segments = parsed.pathname.split("/").filter(Boolean);
    let candidate = segments[segments.length - 1] ?? parsed.hostname;

    if (segments[0] === "add" && segments[1]) {
      candidate = segments[1];
    }
    if (segments[0] === "in" && segments[1]) {
      candidate = segments[1];
    }
    if (candidate.startsWith("@")) {
      candidate = candidate.slice(1);
    }

    // Website: show host without www
    if (segments.length === 0 || (segments.length === 1 && !segments[0])) {
      return parsed.hostname.replace(/^www\./, "");
    }

    // Prefer username over full path for socials
    if (candidate && candidate !== parsed.hostname) {
      return candidate;
    }

    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").replace(/^@/, "");
  }
}

/** @deprecated Use normalizeSocialUsername + buildSocialUrl */
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
    if (url.protocol === "http:") {
      url.protocol = "https:";
    }
    return url.toString();
  } catch {
    return null;
  }
}

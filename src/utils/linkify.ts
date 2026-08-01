export type TextSegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; url: string };

/**
 * Match http(s) URLs and common bare youtube/instagram hosts.
 * Conservative: stops at whitespace and common trailing punctuation.
 */
const URL_PATTERN =
  /(?:https?:\/\/|www\.)[^\s<>"'`]+|(?:youtube\.com|youtu\.be|instagram\.com)\/[^\s<>"'`]+/gi;

function stripTrailingPunctuation(raw: string): {
  url: string;
  trailing: string;
} {
  let url = raw;
  let trailing = "";
  while (/[.,);:!?]/.test(url.slice(-1))) {
    trailing = url.slice(-1) + trailing;
    url = url.slice(0, -1);
  }
  return { url, trailing };
}

export function normalizeLinkUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function isSupportedMediaLink(url: string): boolean {
  try {
    const host = new URL(normalizeLinkUrl(url)).hostname.replace(/^www\./, "");
    return (
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "m.youtube.com" ||
      host === "instagram.com" ||
      host.endsWith(".youtube.com") ||
      host.endsWith(".instagram.com") ||
      host === "instagram.com"
    );
  } catch {
    return false;
  }
}

/** Split free text into plain segments and tappable links. */
export function parseTextWithLinks(text: string): TextSegment[] {
  if (!text) {
    return [];
  }

  const segments: TextSegment[] = [];
  const pattern = new RegExp(URL_PATTERN.source, URL_PATTERN.flags);
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const start = match.index;
    if (start > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, start) });
    }

    const { url, trailing } = stripTrailingPunctuation(match[0]);
    if (url) {
      segments.push({
        type: "link",
        value: url,
        url: normalizeLinkUrl(url),
      });
    }
    if (trailing) {
      segments.push({ type: "text", value: trailing });
    }

    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

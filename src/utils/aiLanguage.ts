/**
 * Map app i18n language to AI analyze API language (A011-1).
 * Supports en / fr / es; unknown codes fall back to English.
 */
export type AiLanguage = "en" | "fr" | "es";

export function resolveAiLanguage(locale: string | undefined | null): AiLanguage {
  const code = (locale ?? "en").toLowerCase().split("-")[0];
  if (code === "fr") {
    return "fr";
  }
  if (code === "es") {
    return "es";
  }
  return "en";
}

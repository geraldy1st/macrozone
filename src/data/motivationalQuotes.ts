import i18n from "@/i18n";

/**
 * Quotes are primarily name-free. If a string still contains {{name}},
 * it is only substituted when a real name is provided (never a fallback label).
 */
export function getQuotes(name?: string): string[] {
  const quotes = i18n.t("quotes", { returnObjects: true });

  if (!Array.isArray(quotes)) {
    return [];
  }

  const trimmedName = name?.trim() ?? "";

  return quotes
    .filter((quote): quote is string => typeof quote === "string")
    .map((quote) => {
      if (!quote.includes("{{name}}")) {
        return quote;
      }
      if (trimmedName) {
        return quote.replace(/\{\{name\}\}/g, trimmedName);
      }
      // Drop name-dependent quotes when no name is available
      return "";
    })
    .filter((quote) => quote.length > 0);
}

export function getRandomQuote(currentQuote?: string, name?: string): string {
  const quotes = getQuotes(name);

  if (quotes.length === 0) {
    return "";
  }

  const available = currentQuote
    ? quotes.filter((quote) => quote !== currentQuote)
    : quotes;

  if (available.length === 0) {
    return quotes[0];
  }

  return available[Math.floor(Math.random() * available.length)];
}

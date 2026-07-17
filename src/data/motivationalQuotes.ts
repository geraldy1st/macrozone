import i18n from "@/i18n";

export function getQuotes(name?: string): string[] {
  const quotes = i18n.t("quotes", { returnObjects: true });
  const displayName =
    name?.trim() || i18n.t("home.quoteNameFallback");

  if (!Array.isArray(quotes)) {
    return [];
  }

  return quotes
    .filter((quote): quote is string => typeof quote === "string")
    .map((quote) => quote.replace(/\{\{name\}\}/g, displayName));
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

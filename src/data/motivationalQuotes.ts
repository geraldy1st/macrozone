import i18n from "@/i18n";

export function getQuotes(): string[] {
  const quotes = i18n.t("quotes", { returnObjects: true });

  if (!Array.isArray(quotes)) {
    return [];
  }

  return quotes.filter((quote): quote is string => typeof quote === "string");
}

export function getRandomQuote(currentQuote?: string): string {
  const quotes = getQuotes();

  if (quotes.length === 0) {
    return "";
  }

  const available = currentQuote
    ? quotes.filter((quote) => quote !== currentQuote)
    : quotes;

  return available[Math.floor(Math.random() * available.length)];
}
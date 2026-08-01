import { getQuotes, getRandomQuote } from "@/data/motivationalQuotes";

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string, options?: { returnObjects?: boolean }) => {
      if (key === "quotes" && options?.returnObjects) {
        return [
          "Every meal counts.",
          "Stay consistent.",
          "Hello {{name}}, keep going.",
        ];
      }
      if (key === "home.quoteNameFallback") {
        return "friend";
      }
      return key;
    },
  },
}));

describe("motivationalQuotes", () => {
  it("returns name-free quotes without requiring a name", () => {
    const quotes = getQuotes();
    expect(quotes).toContain("Every meal counts.");
    expect(quotes).toContain("Stay consistent.");
    expect(quotes.some((q) => q.includes("{{name}}"))).toBe(false);
    expect(quotes.some((q) => q.includes("friend"))).toBe(false);
  });

  it("substitutes {{name}} only when a real name is provided", () => {
    const withName = getQuotes("Alex");
    expect(withName).toContain("Hello Alex, keep going.");
    expect(withName).not.toContain("{{name}}");
  });

  it("returns a random quote from the pool", () => {
    const quote = getRandomQuote();
    expect(["Every meal counts.", "Stay consistent."]).toContain(quote);
  });
});

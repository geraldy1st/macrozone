import { resolveAiLanguage } from "@/utils/aiLanguage";

describe("resolveAiLanguage", () => {
  it("maps french locales to fr", () => {
    expect(resolveAiLanguage("fr")).toBe("fr");
    expect(resolveAiLanguage("fr-FR")).toBe("fr");
  });

  it("maps spanish locales to es", () => {
    expect(resolveAiLanguage("es")).toBe("es");
    expect(resolveAiLanguage("es-ES")).toBe("es");
  });

  it("defaults unknown locales to en", () => {
    expect(resolveAiLanguage("en")).toBe("en");
    expect(resolveAiLanguage("en-US")).toBe("en");
    expect(resolveAiLanguage("de")).toBe("en");
    expect(resolveAiLanguage(undefined)).toBe("en");
    expect(resolveAiLanguage(null)).toBe("en");
  });
});

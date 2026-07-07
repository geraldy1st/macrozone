import { resolveThemeMode } from "@/styles/themes";

describe("resolveThemeMode", () => {
  it("uses the device theme when system mode is selected", () => {
    expect(resolveThemeMode("system", "light")).toBe("light");
    expect(resolveThemeMode("system", "dark")).toBe("dark");
  });

  it("keeps explicit light and dark preferences", () => {
    expect(resolveThemeMode("light", "dark")).toBe("light");
    expect(resolveThemeMode("dark", "light")).toBe("dark");
  });
});
import {
  DARK_CELEBRATION_PALETTES,
  LIGHT_CELEBRATION_PALETTES,
  pickCelebrationPalette,
} from "@/data/celebrationPalettes";

describe("celebrationPalettes", () => {
  it("exposes light and dark palette pools", () => {
    expect(LIGHT_CELEBRATION_PALETTES.length).toBeGreaterThan(0);
    expect(DARK_CELEBRATION_PALETTES.length).toBeGreaterThan(0);
    for (const palette of [...LIGHT_CELEBRATION_PALETTES, ...DARK_CELEBRATION_PALETTES]) {
      expect(palette.colors.length).toBeGreaterThanOrEqual(2);
      expect(palette.textColor).toMatch(/^#/);
    }
  });

  it("picks from the correct theme pool", () => {
    const light = pickCelebrationPalette(false);
    const dark = pickCelebrationPalette(true);
    expect(LIGHT_CELEBRATION_PALETTES.some((p) => p.id === light.id)).toBe(true);
    expect(DARK_CELEBRATION_PALETTES.some((p) => p.id === dark.id)).toBe(true);
  });

  it("avoids repeating the previous palette when possible", () => {
    const first = LIGHT_CELEBRATION_PALETTES[0];
    const results = new Set(
      Array.from({ length: 20 }, () => pickCelebrationPalette(false, first.id).id),
    );
    // With a large enough sample, we should see at least one other palette
    expect(results.size).toBeGreaterThan(1);
  });
});

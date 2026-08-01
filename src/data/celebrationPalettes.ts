/**
 * Flashy celebration gradients inspired by https://uigradients.com
 * Separate light vs dark sets for theme-aware overlays.
 */

export type CelebrationPalette = {
  id: string;
  colors: [string, string, ...string[]];
  textColor: string;
};

/** Light mode — vivid / flashy (e.g. Whinehouse-adjacent coral + lime) */
export const LIGHT_CELEBRATION_PALETTES: CelebrationPalette[] = [
  { id: "whinehouse", colors: ["#f45f45", "#eea849"], textColor: "#d4fc79" },
  { id: "orange-coral", colors: ["#ff512f", "#dd2476"], textColor: "#fff7ad" },
  { id: "mojito", colors: ["#1d976c", "#93f9b9"], textColor: "#0b3d2e" },
  { id: "sunset", colors: ["#ff6a00", "#ee0979"], textColor: "#fff5e6" },
  { id: "electric", colors: ["#4776e6", "#8e54e9"], textColor: "#e0ff87" },
  { id: "mango", colors: ["#ffe259", "#ffa751"], textColor: "#5c1a00" },
  { id: "aqua", colors: ["#00c6ff", "#0072ff"], textColor: "#f0fff4" },
  { id: "berry", colors: ["#c33764", "#1d2671"], textColor: "#ffe66d" },
];

/** Dark mode — deeper / muted backgrounds, soft light text */
export const DARK_CELEBRATION_PALETTES: CelebrationPalette[] = [
  { id: "dark-ember", colors: ["#794747", "#3d2c2c"], textColor: "#dddddd" },
  { id: "dark-plum", colors: ["#2c1634", "#4a1942"], textColor: "#e8d5f2" },
  { id: "dark-forest", colors: ["#1a3a2a", "#0f2419"], textColor: "#c8e6c9" },
  { id: "dark-navy", colors: ["#1b2838", "#0d1b2a"], textColor: "#b8c5d6" },
  { id: "dark-wine", colors: ["#4a1528", "#2a0f18"], textColor: "#f0c4d0" },
  { id: "dark-slate", colors: ["#2d3436", "#1e272e"], textColor: "#dfe6e9" },
  { id: "dark-teal", colors: ["#0e3d3a", "#0a2523"], textColor: "#b2dfdb" },
  { id: "dark-amber", colors: ["#4a3728", "#2c2118"], textColor: "#ffe0b2" },
];

export function pickCelebrationPalette(
  isDark: boolean,
  previousId?: string,
): CelebrationPalette {
  const pool = isDark ? DARK_CELEBRATION_PALETTES : LIGHT_CELEBRATION_PALETTES;
  const available =
    previousId && pool.length > 1
      ? pool.filter((p) => p.id !== previousId)
      : pool;
  return available[Math.floor(Math.random() * available.length)] ?? pool[0];
}

export const CELEBRATION_DURATION_MS = 4000;

/** Relative time labels using the app language (en | fr | es). */
export function formatRelativeTime(
  isoDate: string,
  language: string,
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const lang = language.startsWith("fr")
    ? "fr"
    : language.startsWith("es")
      ? "es"
      : "en";

  const copy = {
    en: {
      justNow: "just now",
      m: (n: number) => `${n}m ago`,
      h: (n: number) => `${n}h ago`,
      d: (n: number) => `${n}d ago`,
    },
    fr: {
      justNow: "à l'instant",
      m: (n: number) => `il y a ${n} min`,
      h: (n: number) => `il y a ${n} h`,
      d: (n: number) => `il y a ${n} j`,
    },
    es: {
      justNow: "ahora mismo",
      m: (n: number) => `hace ${n} min`,
      h: (n: number) => `hace ${n} h`,
      d: (n: number) => `hace ${n} d`,
    },
  }[lang];

  if (diffSec < 45) {
    return copy.justNow;
  }
  if (diffMin < 60) {
    return copy.m(Math.max(1, diffMin));
  }
  if (diffHour < 24) {
    return copy.h(Math.max(1, diffHour));
  }
  return copy.d(Math.max(1, diffDay));
}

export type CountryOption = {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
};

export const countries: CountryOption[] = [
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", dialCode: "+32" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", dialCode: "+41" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "US", name: "États-Unis", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", dialCode: "+44" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", dialCode: "+49" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", dialCode: "+34" },
  { code: "IT", name: "Italie", flag: "🇮🇹", dialCode: "+39" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", dialCode: "+212" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿", dialCode: "+213" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", dialCode: "+216" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", dialCode: "+221" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", dialCode: "+225" },
];

export function getCountryByCode(code: string) {
  return countries.find((country) => country.code === code);
}

export const defaultCountryCode = "FR";
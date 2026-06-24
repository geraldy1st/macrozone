import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import {
  defaultLanguage,
  getStoredLanguage,
  setStoredLanguage,
  type AppLanguage,
} from "@/storage/settings";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

let initialized = false;

export const initI18n = async (): Promise<void> => {
  if (initialized) {
    return;
  }

  const storedLanguage = await getStoredLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: storedLanguage ?? defaultLanguage,
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: "v4",
  });

  initialized = true;
};

export const changeAppLanguage = async (language: AppLanguage): Promise<void> => {
  await i18n.changeLanguage(language);
  await setStoredLanguage(language);
};

export default i18n;
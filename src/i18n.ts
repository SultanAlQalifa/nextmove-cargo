import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectUserLocale } from "./utils/localeDetection";

import en from "./locales/en/translation.json";
import fr from "./locales/fr/translation.json";
import es from "./locales/es/translation.json";
import zh from "./locales/zh/translation.json";
import ar from "./locales/ar/translation.json";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  zh: { translation: zh },
  ar: { translation: ar },
};

detectUserLocale().then((localeConfig) => {
  i18n.use(initReactI18next).init({
    resources,
    lng: localeConfig.language,
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false,
    },
  });

  // Set initial direction
  document.dir = localeConfig.language === "ar" ? "rtl" : "ltr";
});

// Listen for language changes to update direction
i18n.on("languageChanged", (lng) => {
  document.dir = lng === "ar" ? "rtl" : "ltr";
});

export default i18n;

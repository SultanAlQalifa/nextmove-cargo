import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  detectUserLocale,
  getUserLocale,
  setUserLocale,
  LocaleConfig,
} from "../utils/localeDetection";
import { useTranslation } from "react-i18next";
import { useSettings } from "./SettingsContext";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  countryCode: string;
  setCountryCode: (countryCode: string) => void;
  isLoading: boolean;
  formatPrice: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const { settings, loading: settingsLoading } = useSettings();
  const [currency, setCurrencyState] = useState<string>("XOF");
  const [language, setLanguageState] = useState<string>("fr");
  const [countryCode, setCountryCodeState] = useState<string>("SN");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Wait for settings to load
    if (settingsLoading) return;

    const initializeLocale = async () => {
      try {
        // First try to get saved user preference
        const savedLocale = getUserLocale();

        if (savedLocale) {
          setCurrencyState(savedLocale.currency);
          setLanguageState(savedLocale.language);
          setCountryCodeState(savedLocale.countryCode);
          i18n.changeLanguage(savedLocale.language);
        } else {
          // Force default currency to XOF and language to French
          setCurrencyState("XOF");
          setLanguageState("fr");
          setCountryCodeState("SN");
          i18n.changeLanguage("fr");
          // Also persist this default locale
          setUserLocale({ currency: "XOF", language: "fr", countryCode: "SN" });
        }
      } catch (error) {
        console.error("Error initializing locale:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLocale();
  }, [i18n, settings, settingsLoading]);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    const currentLocale = getUserLocale();
    setUserLocale({ ...currentLocale, currency: newCurrency });
  };

  const setLanguage = (newLanguage: string) => {
    setLanguageState(newLanguage);
    i18n.changeLanguage(newLanguage);
    const currentLocale = getUserLocale();
    setUserLocale({ ...currentLocale, language: newLanguage });
  };

  const setCountryCode = (newCountryCode: string) => {
    setCountryCodeState(newCountryCode);
    const currentLocale = getUserLocale();
    setUserLocale({ ...currentLocale, countryCode: newCountryCode });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(language, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: currency === "XOF" ? 0 : 2,
      maximumFractionDigits: currency === "XOF" ? 0 : 2,
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        language,
        setLanguage,
        countryCode,
        setCountryCode,
        isLoading,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectUserLocale, getUserLocale, setUserLocale, LocaleConfig } from '../utils/localeDetection';
import { useTranslation } from 'react-i18next';
import { useSettings } from './SettingsContext';

interface CurrencyContextType {
    currency: string;
    setCurrency: (currency: string) => void;
    language: string;
    setLanguage: (language: string) => void;
    countryCode: string;
    setCountryCode: (countryCode: string) => void;
    isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const { i18n } = useTranslation();
    const { settings, loading: settingsLoading } = useSettings();
    const [currency, setCurrencyState] = useState<string>('XOF');
    const [language, setLanguageState] = useState<string>('fr');
    const [countryCode, setCountryCodeState] = useState<string>('SN');
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
                    // Fallback to system settings if available, otherwise detect
                    if (settings?.regionalization) {
                        setCurrencyState(settings.regionalization.default_currency);
                        setLanguageState(settings.regionalization.default_language);
                        // We might want to map timezone to country code or just keep default
                        i18n.changeLanguage(settings.regionalization.default_language);
                    } else {
                        const localeConfig = await detectUserLocale();
                        setCurrencyState(localeConfig.currency);
                        setLanguageState(localeConfig.language);
                        setCountryCodeState(localeConfig.countryCode);
                        i18n.changeLanguage(localeConfig.language);
                    }
                }
            } catch (error) {
                console.error('Error initializing locale:', error);
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

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            language,
            setLanguage,
            countryCode,
            setCountryCode,
            isLoading
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}

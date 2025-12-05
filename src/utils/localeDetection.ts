// Utility to detect user's location and set appropriate language and currency

export interface LocaleConfig {
    language: string;
    currency: string;
    countryCode: string;
}

// Mapping of countries to their preferred language and currency
const countryLocaleMap: Record<string, LocaleConfig> = {
    // French-speaking countries (West Africa)
    'SN': { language: 'fr', currency: 'XOF', countryCode: 'SN' }, // Senegal
    'CI': { language: 'fr', currency: 'XOF', countryCode: 'CI' }, // Côte d'Ivoire
    'ML': { language: 'fr', currency: 'XOF', countryCode: 'ML' }, // Mali
    'BF': { language: 'fr', currency: 'XOF', countryCode: 'BF' }, // Burkina Faso
    'BJ': { language: 'fr', currency: 'XOF', countryCode: 'BJ' }, // Benin
    'TG': { language: 'fr', currency: 'XOF', countryCode: 'TG' }, // Togo
    'NE': { language: 'fr', currency: 'XOF', countryCode: 'NE' }, // Niger
    'GN': { language: 'fr', currency: 'GNF', countryCode: 'GN' }, // Guinea
    'FR': { language: 'fr', currency: 'EUR', countryCode: 'FR' }, // France
    'BE': { language: 'fr', currency: 'EUR', countryCode: 'BE' }, // Belgium
    'CH': { language: 'fr', currency: 'CHF', countryCode: 'CH' }, // Switzerland
    'CA': { language: 'fr', currency: 'CAD', countryCode: 'CA' }, // Canada

    // Chinese-speaking countries
    'CN': { language: 'zh', currency: 'CNY', countryCode: 'CN' }, // China
    'TW': { language: 'zh', currency: 'TWD', countryCode: 'TW' }, // Taiwan
    'HK': { language: 'zh', currency: 'HKD', countryCode: 'HK' }, // Hong Kong
    'SG': { language: 'zh', currency: 'SGD', countryCode: 'SG' }, // Singapore

    // Spanish-speaking countries
    'ES': { language: 'es', currency: 'EUR', countryCode: 'ES' }, // Spain
    'MX': { language: 'es', currency: 'MXN', countryCode: 'MX' }, // Mexico
    'AR': { language: 'es', currency: 'ARS', countryCode: 'AR' }, // Argentina
    'CO': { language: 'es', currency: 'COP', countryCode: 'CO' }, // Colombia
    'CL': { language: 'es', currency: 'CLP', countryCode: 'CL' }, // Chile
    'PE': { language: 'es', currency: 'PEN', countryCode: 'PE' }, // Peru
    'VE': { language: 'es', currency: 'VES', countryCode: 'VE' }, // Venezuela

    // English-speaking countries
    'US': { language: 'en', currency: 'USD', countryCode: 'US' }, // United States
    'GB': { language: 'en', currency: 'GBP', countryCode: 'GB' }, // United Kingdom
    'AU': { language: 'en', currency: 'AUD', countryCode: 'AU' }, // Australia
    'NZ': { language: 'en', currency: 'NZD', countryCode: 'NZ' }, // New Zealand
    'ZA': { language: 'en', currency: 'ZAR', countryCode: 'ZA' }, // South Africa
    'NG': { language: 'en', currency: 'NGN', countryCode: 'NG' }, // Nigeria
    'KE': { language: 'en', currency: 'KES', countryCode: 'KE' }, // Kenya
    'GH': { language: 'en', currency: 'GHS', countryCode: 'GH' }, // Ghana
};

// Default fallback
const defaultLocale: LocaleConfig = {
    language: 'fr',
    currency: 'XOF',
    countryCode: 'SN'
};

/**
 * Detect user's location using browser language first, then IP geolocation API
 * Returns language and currency based on detected country
 */
export async function detectUserLocale(): Promise<LocaleConfig> {
    try {
        // Try to get from localStorage first (user preference)
        const savedLocale = localStorage.getItem('userLocale');
        if (savedLocale) {
            return JSON.parse(savedLocale);
        }

        // Detect from browser language (works immediately, no API call)
        const browserLang = navigator.language; // e.g., "fr-FR", "en-US", "zh-CN"
        const langCode = browserLang.split('-')[0]; // Get just "fr", "en", "zh"
        const countryCode = browserLang.split('-')[1]?.toUpperCase(); // Get "FR", "US", "CN"

        // If we have a country code from browser, use it
        if (countryCode && countryLocaleMap[countryCode]) {
            const config = countryLocaleMap[countryCode];
            localStorage.setItem('userLocale', JSON.stringify(config));
            return config;
        }

        // Otherwise, create config based on language
        const languageBasedConfig: LocaleConfig = {
            language: ['fr', 'en', 'es', 'zh'].includes(langCode) ? langCode : 'fr',
            currency: langCode === 'zh' ? 'CNY' : langCode === 'es' ? 'EUR' : langCode === 'en' ? 'USD' : 'XOF',
            countryCode: countryCode || 'SN'
        };

        // Try to enhance with IP geolocation (optional, may fail due to CORS in dev)
        try {
            const response = await fetch('https://ipapi.co/json/', {
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });

            if (response.ok) {
                const data = await response.json();
                const detectedCountry = data.country_code;

                if (detectedCountry && countryLocaleMap[detectedCountry]) {
                    const geoConfig = countryLocaleMap[detectedCountry];
                    localStorage.setItem('userLocale', JSON.stringify(geoConfig));
                    return geoConfig;
                }
            }
        } catch (geoError) {
            // Geolocation failed (CORS, timeout, etc.) - that's okay, use browser language
            // console.log('Geolocation API unavailable, using browser language');
        }

        // Save and return browser-based config
        localStorage.setItem('userLocale', JSON.stringify(languageBasedConfig));
        return languageBasedConfig;

    } catch (error) {
        console.error('Error detecting user locale:', error);
        return defaultLocale;
    }
}

/**
 * Manually set user locale preference
 */
export function setUserLocale(config: LocaleConfig): void {
    localStorage.setItem('userLocale', JSON.stringify(config));
}

/**
 * Get current user locale from localStorage or default
 */
export function getUserLocale(): LocaleConfig {
    try {
        const saved = localStorage.getItem('userLocale');
        return saved ? JSON.parse(saved) : defaultLocale;
    } catch {
        return defaultLocale;
    }
}

/**
 * Clear saved locale preference
 */
export function clearUserLocale(): void {
    localStorage.removeItem('userLocale');
}

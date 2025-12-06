import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ChevronDown } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { setUserLocale, LocaleConfig } from '../utils/localeDetection';

// Popular countries for quick access
const popularCountries: { code: string; name: string; flag: string; language: string; currency: string }[] = [
    // French-speaking (Africa & Europe)
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', language: 'fr', currency: 'XOF' },
    { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', language: 'fr', currency: 'XOF' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', language: 'fr', currency: 'XOF' },
    { code: 'FR', name: 'France', flag: '🇫🇷', language: 'fr', currency: 'EUR' },

    // Chinese-speaking
    { code: 'CN', name: '中国', flag: '🇨🇳', language: 'zh', currency: 'CNY' },
    { code: 'HK', name: '香港', flag: '🇭🇰', language: 'zh', currency: 'HKD' },
    { code: 'TW', name: '台灣', flag: '🇹🇼', language: 'zh', currency: 'TWD' },

    // English-speaking
    { code: 'US', name: 'United States', flag: '🇺🇸', language: 'en', currency: 'USD' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', language: 'en', currency: 'GBP' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', language: 'en', currency: 'NGN' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', language: 'en', currency: 'GHS' },

    // Spanish-speaking
    { code: 'ES', name: 'España', flag: '🇪🇸', language: 'es', currency: 'EUR' },
    { code: 'MX', name: 'México', flag: '🇲🇽', language: 'es', currency: 'MXN' },
];

export default function MobileCountrySelector() {
    const [isOpen, setIsOpen] = useState(false);
    const { language, currency, countryCode, setLanguage, setCurrency, setCountryCode } = useCurrency();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Find current country
    const currentCountry = popularCountries.find(c => c.code === countryCode) || popularCountries[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCountrySelect = (country: typeof popularCountries[0]) => {
        // Update locale configuration
        const newLocale: LocaleConfig = {
            language: country.language,
            currency: country.currency,
            countryCode: country.code
        };
        setUserLocale(newLocale);
        setLanguage(country.language);
        setCurrency(country.currency);
        setCountryCode(country.code);
        setIsOpen(false);
    };

    // Detect mobile view
    const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Select country and language"
            >
                <Globe size={18} className="text-gray-600 dark:text-gray-400" />
                <span className="text-xl">{currentCountry.flag}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">
                    {currency}
                </span>
                <ChevronDown size={16} className={`text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                isMobile ? (
                    // Mobile overlay
                    createPortal(
                        <div className="fixed inset-0 bg-white z-[9999] p-4 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Select Country</h2>
                                <button onClick={() => setIsOpen(false)} className="text-gray-600">✕</button>
                            </div>
                            {popularCountries.map((country) => (
                                <button
                                    key={country.code}
                                    onClick={() => handleCountrySelect(country)}
                                    className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${country.code === countryCode ? 'bg-blue-50' : ''}`}
                                >
                                    <span className="text-2xl">{country.flag}</span>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-gray-900">{country.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {country.language.toUpperCase()} • {country.currency}
                                        </p>
                                    </div>
                                    {country.code === countryCode && (
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>,
                        document.body
                    )
                ) : (
                    // Desktop dropdown
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                        <div className="px-3 py-2 border-b border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Select Country
                            </p>
                        </div>
                        {popularCountries.map((country) => (
                            <button
                                key={country.code}
                                onClick={() => handleCountrySelect(country)}
                                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${country.code === countryCode ? 'bg-blue-50' : ''}`}
                            >
                                <span className="text-2xl">{country.flag}</span>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-gray-900">{country.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {country.language.toUpperCase()} • {country.currency}
                                    </p>
                                </div>
                                {country.code === countryCode && (
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

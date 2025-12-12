import { useState, useEffect } from "react";
import { ChevronDown, Phone } from "lucide-react";

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

const COUNTRY_CODES = [
    { code: "+221", country: "Senegal", flag: "🇸🇳" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+90", country: "Turkey", flag: "🇹🇷" },
    { code: "+225", country: "Côte d'Ivoire", flag: "🇨🇮" },
    { code: "+223", country: "Mali", flag: "🇲🇱" },
    { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
];

export default function PhoneInputWithCountry({ value, onChange, required }: PhoneInputProps) {
    const [countryCode, setCountryCode] = useState("+221");
    const [localNumber, setLocalNumber] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // Parse initial value if provided
    useEffect(() => {
        if (value && value.startsWith("+")) {
            const match = COUNTRY_CODES.find(c => value.startsWith(c.code));
            if (match) {
                setCountryCode(match.code);
                setLocalNumber(value.slice(match.code.length));
            } else {
                // Default fallback if code not found
                setLocalNumber(value);
            }
        }
    }, []); // Only on mount/external update? Just ensure we don't overwrite user typing.

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = e.target.value.replace(/\D/g, ""); // Digits only
        setLocalNumber(num);
        onChange(`${countryCode}${num}`);
    };

    const selectCountry = (code: string) => {
        setCountryCode(code);
        onChange(`${code}${localNumber}`);
        setIsOpen(false);
    };

    const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

    return (
        <div className="relative">
            <div className="flex">
                {/* Country Selector */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 border border-r-0 border-gray-300 rounded-l-xl bg-gray-50 hover:bg-gray-100 transition-colors shrink-0"
                >
                    <span className="text-lg">{selectedCountry.flag}</span>
                    <span className="text-sm font-bold text-gray-700">{selectedCountry.code}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Number Input */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="tel"
                        required={required}
                        value={localNumber}
                        onChange={handleNumberChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-r-xl focus:ring-primary focus:border-primary placeholder-gray-400"
                        placeholder="77 000 00 00"
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {COUNTRY_CODES.map((c) => (
                        <button
                            key={c.code}
                            type="button"
                            onClick={() => selectCountry(c.code)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                            <span className="text-xl">{c.flag}</span>
                            <span className="font-medium text-gray-900">{c.country}</span>
                            <span className="text-gray-500 text-sm ml-auto">{c.code}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

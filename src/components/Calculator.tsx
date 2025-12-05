import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { calculatorService, QuoteResult, CalculationParams } from '../services/calculatorService';
import { forwarderService, ForwarderOption } from '../services/forwarderService';
import { calculateCBM, LengthUnit } from '../utils/volumeCalculator';
import { Search, Ship, Plane, Package, Info, DollarSign, Clock, Check, Star, ShieldCheck, Zap, Box, ClipboardCheck, Calculator as CalculatorIcon, Scale, Truck, AlertCircle, CheckCircle, FileCheck, Warehouse } from 'lucide-react';

import { useCurrency } from '../contexts/CurrencyContext';
import { locationService, Location } from '../services/locationService';

export default function Calculator() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { currency } = useCurrency();
    const [quotes, setQuotes] = useState<QuoteResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [sortBy, setSortBy] = useState<'price' | 'speed' | 'rating'>('price');

    // Forwarder selection state
    const [calculationMode, setCalculationMode] = useState<'platform' | 'compare' | 'specific'>('platform');
    const [selectedForwarder, setSelectedForwarder] = useState<string>('');
    const [forwarders, setForwarders] = useState<ForwarderOption[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [originSearch, setOriginSearch] = useState('');
    const [destSearch, setDestSearch] = useState('');
    const [showOriginDropdown, setShowOriginDropdown] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);

    // Dimension inputs for CBM calculation
    const [dimensionUnit, setDimensionUnit] = useState<LengthUnit>('m');
    const [length, setLength] = useState<string>('');
    const [width, setWidth] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [calculatedCBM, setCalculatedCBM] = useState<number>(0);
    const [selectedServices, setSelectedServices] = useState<{
        insurance: boolean;
        priority: boolean;
        packaging: boolean;
        inspection: boolean;
        customs_clearance: boolean;
        door_to_door: boolean;
        storage: boolean;
    }>({
        insurance: false,
        priority: false,
        packaging: false,
        inspection: false,
        customs_clearance: false,
        door_to_door: false,
        storage: false,
    });

    const { register, handleSubmit, watch, setValue } = useForm<CalculationParams>({
        defaultValues: {
            mode: 'sea',
            type: 'standard',
            origin: 'China',
            destination: 'Senegal'
        }
    });

    const selectedMode = watch('mode');
    const selectedType = watch('type');

    // Load active forwarders on mount
    useEffect(() => {
        async function loadForwarders() {
            try {
                const data = await forwarderService.getAllActiveForwarders();
                setForwarders(data);
            } catch (error) {
                console.error('Error loading forwarders:', error);
            }
        }
        loadForwarders();
        loadLocations();
    }, []);

    // Handle Query Params for Prefill
    useEffect(() => {
        const forwarderId = searchParams.get('forwarder');
        const origin = searchParams.get('origin');
        const destination = searchParams.get('destination');
        const mode = searchParams.get('mode');

        if (forwarderId) {
            setCalculationMode('specific');
            setSelectedForwarder(forwarderId);
        }

        if (origin) {
            setValue('origin', origin);
            setOriginSearch(origin);
        }

        if (destination) {
            setValue('destination', destination);
            setDestSearch(destination);
        }

        if (mode && (mode === 'sea' || mode === 'air')) {
            setValue('mode', mode);
        }

        const type = searchParams.get('type');
        if (type && (type === 'standard' || type === 'express')) {
            setValue('type', type);
        }
    }, [searchParams, setValue]);

    const loadLocations = async () => {
        try {
            const data = await locationService.getLocations();
            setLocations(data);
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    };

    const filteredOrigins = locations.filter(l =>
        l.name.toLowerCase().includes(originSearch.toLowerCase())
    );

    const filteredDestinations = locations.filter(l =>
        l.name.toLowerCase().includes(destSearch.toLowerCase())
    );

    // Calculate CBM automatically when dimensions change
    useEffect(() => {
        if (length && width && height) {
            const cbm = calculateCBM({
                length: parseFloat(length),
                width: parseFloat(width),
                height: parseFloat(height),
                unit: dimensionUnit
            });
            setCalculatedCBM(cbm);
        } else {
            setCalculatedCBM(0);
        }
    }, [length, width, height, dimensionUnit]);

    // Transport mode information
    const TRANSPORT_MODE_INFO = {
        sea: {
            icon: Ship,
            label: t('calculator.sea.label'),
            measurement: t('calculator.sea.measurement'),
            pricing: t('calculator.sea.pricing'),
            duration: t('calculator.sea.duration'),
            conditions: t('calculator.sea.conditions'),
            advantages: [
                t('calculator.sea.advantages.economical'),
                t('calculator.sea.advantages.largeVolumes'),
                t('calculator.sea.advantages.ecological')
            ]
        },
        air: {
            icon: Plane,
            label: t('calculator.air.label'),
            measurement: t('calculator.air.measurement'),
            pricing: t('calculator.air.pricing'),
            duration: t('calculator.air.duration'),
            conditions: t('calculator.air.conditions'),
            advantages: [
                t('calculator.air.advantages.fast'),
                t('calculator.air.advantages.secure'),
                t('calculator.air.advantages.urgent')
            ]
        }
    };

    // Helper to convert price for display
    const formatPrice = (amount: number) => {
        // Simple conversion approximation for display (Service uses exact same rates)
        const rates: Record<string, number> = {
            'EUR': 1,
            'XOF': 655.957,
            'USD': 1.08,
            'CNY': 7.8,
            'GBP': 0.85
        };
        const rate = rates[currency] || 1;
        const converted = amount * rate;

        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(converted);
    };

    // Dynamic Service Type Information based on selected mode
    const getServiceDetails = (type: 'standard' | 'express', mode: string) => {
        const isSea = mode === 'sea';

        if (type === 'standard') {
            const price = isSea ? 80 : 8; // Base EUR prices
            const unit = isSea ? 'CBM' : 'kg';
            return {
                pricing: `${formatPrice(price)} / ${unit}`,
                transitNote: isSea ? `45-60 ${t('calculator.days')}` : `5-7 ${t('calculator.days')}`,
                description: t('calculator.standard.description')
            };
        } else {
            const price = isSea ? 120 : 15; // Base EUR prices
            const unit = isSea ? 'CBM' : 'kg';
            return {
                pricing: `${formatPrice(price)} / ${unit}`,
                transitNote: isSea ? `30-45 ${t('calculator.days')}` : `2-3 ${t('calculator.days')}`,
                description: t('calculator.express.description')
            };
        }
    };

    const standardDetails = getServiceDetails('standard', selectedMode);
    const expressDetails = getServiceDetails('express', selectedMode);

    // Service type information
    const SERVICE_TYPE_INFO = {
        standard: {
            label: t('calculator.standard.label'),
            description: standardDetails.description,
            pricing: standardDetails.pricing,
            features: [
                t('calculator.standard.features.consolidation'),
                t('calculator.standard.features.bestValue'),
                t('calculator.standard.features.normalDelay')
            ],
            transitNote: standardDetails.transitNote
        },
        express: {
            label: t('calculator.express.label'),
            description: expressDetails.description,
            pricing: expressDetails.pricing,
            features: [
                t('calculator.express.features.maxPriority'),
                t('calculator.express.features.directTransit'),
                t('calculator.express.features.fastCustoms')
            ],
            transitNote: expressDetails.transitNote
        }
    };

    const onSubmit = async (data: CalculationParams) => {
        setLoading(true);
        setSearched(true);
        try {
            const params: CalculationParams = {
                ...data,
                volume_cbm: selectedMode === 'sea' ? calculatedCBM : undefined,
                weight_kg: selectedMode === 'air' ? data.weight_kg : undefined,
                calculationMode: calculationMode,
                forwarder_id: calculationMode === 'specific' ? selectedForwarder : undefined,
                targetCurrency: currency,
                additionalServices: selectedServices
            };

            const results = await calculatorService.calculateQuotes(params);
            setQuotes(results);
        } catch (error) {
            console.error('Error calculating quotes:', error);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="max-w-7xl mx-auto">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] overflow-hidden border border-white/20 dark:border-gray-800">
                        <div className="p-8">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Calculation Mode Selection */}
                                <div className="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-slate-100 dark:border-gray-700">
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">
                                        {t('calculator.calculationMode')}
                                    </label>

                                    <div className="space-y-3">
                                        <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl transition-all duration-200 border ${calculationMode === 'platform' ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-md shadow-blue-500/10' : 'border-transparent hover:bg-white dark:hover:bg-gray-800'}`}>
                                            <div className="mt-1">
                                                <input
                                                    type="radio"
                                                    value="platform"
                                                    checked={calculationMode === 'platform'}
                                                    onChange={(e) => setCalculationMode(e.target.value as 'platform')}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-900 dark:text-white text-lg">
                                                    {t('calculator.platformRates')}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    {t('calculator.platformRatesDesc')}
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl transition-all duration-200 border ${calculationMode === 'compare' ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-md shadow-blue-500/10' : 'border-transparent hover:bg-white dark:hover:bg-gray-800'}`}>
                                            <div className="mt-1">
                                                <input
                                                    type="radio"
                                                    value="compare"
                                                    checked={calculationMode === 'compare'}
                                                    onChange={(e) => setCalculationMode(e.target.value as 'compare')}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-900 dark:text-white text-lg">
                                                    {t('calculator.compareForwarders')}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    {t('calculator.compareForwardersDesc')}
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl transition-all duration-200 border ${calculationMode === 'specific' ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-md shadow-blue-500/10' : 'border-transparent hover:bg-white dark:hover:bg-gray-800'}`}>
                                            <div className="mt-1">
                                                <input
                                                    type="radio"
                                                    value="specific"
                                                    checked={calculationMode === 'specific'}
                                                    onChange={(e) => setCalculationMode(e.target.value as 'specific')}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-900 dark:text-white text-lg mb-1">
                                                    {t('calculator.specificForwarder')}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                                    {t('calculator.specificForwarderDesc')}
                                                </div>
                                                {calculationMode === 'specific' && (
                                                    <select
                                                        value={selectedForwarder}
                                                        onChange={(e) => setSelectedForwarder(e.target.value)}
                                                        className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                        required={calculationMode === 'specific'}
                                                    >
                                                        <option value="">{t('calculator.selectForwarder')}</option>
                                                        {forwarders.map(f => (
                                                            <option key={f.id} value={f.id}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('calculator.origin')}</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={originSearch || watch('origin')}
                                                onChange={(e) => {
                                                    setOriginSearch(e.target.value);
                                                    setShowOriginDropdown(true);
                                                }}
                                                onFocus={() => {
                                                    setOriginSearch('');
                                                    setShowOriginDropdown(true);
                                                }}
                                                onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                                                className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 pl-4 pr-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                placeholder="Sélectionner un pays..."
                                            />
                                            {showOriginDropdown && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto">
                                                    {filteredOrigins.map(loc => (
                                                        <button
                                                            key={loc.id}
                                                            type="button"
                                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-gray-700 text-sm text-slate-700 dark:text-slate-300"
                                                            onClick={() => {
                                                                setValue('origin', loc.name);
                                                                setOriginSearch(loc.name);
                                                                setShowOriginDropdown(false);
                                                            }}
                                                        >
                                                            {loc.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('calculator.destination')}</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={destSearch || watch('destination')}
                                                onChange={(e) => {
                                                    setDestSearch(e.target.value);
                                                    setShowDestDropdown(true);
                                                }}
                                                onFocus={() => {
                                                    setDestSearch('');
                                                    setShowDestDropdown(true);
                                                }}
                                                onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                                                className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 pl-4 pr-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                placeholder="Sélectionner un pays..."
                                            />
                                            {showDestDropdown && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto">
                                                    {filteredDestinations.map(loc => (
                                                        <button
                                                            key={loc.id}
                                                            type="button"
                                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-gray-700 text-sm text-slate-700 dark:text-slate-300"
                                                            onClick={() => {
                                                                setValue('destination', loc.name);
                                                                setDestSearch(loc.name);
                                                                setShowDestDropdown(false);
                                                            }}
                                                        >
                                                            {loc.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Transport Mode Section */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">{t('calculator.transportMode')}</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {(Object.keys(TRANSPORT_MODE_INFO) as Array<keyof typeof TRANSPORT_MODE_INFO>).map((mode) => {
                                                const info = TRANSPORT_MODE_INFO[mode];
                                                const Icon = info.icon;
                                                const isSelected = selectedMode === mode;

                                                return (
                                                    <label
                                                        key={mode}
                                                        className={`relative flex flex-col p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${isSelected
                                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10 scale-[1.02]'
                                                            : 'border-slate-100 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-600 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            value={mode}
                                                            {...register('mode')}
                                                            className="sr-only"
                                                        />

                                                        {/* Header with Icon, Title and Selected Badge */}
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-gray-800 text-slate-500'}`}>
                                                                    <Icon size={24} />
                                                                </div>
                                                                <span className={`font-bold text-xl ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-white'}`}>
                                                                    {info.label}
                                                                </span>
                                                            </div>
                                                            {isSelected && (
                                                                <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                                                                    {t('calculator.selected') || 'Sélectionné'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Information Grid with Icons */}
                                                        <div className="space-y-4 mb-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                                    <Package size={16} className="text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <div className="text-sm">
                                                                    <span className="font-semibold text-slate-900 dark:text-white block">{t('calculator.measure')}</span>
                                                                    <span className="text-slate-600 dark:text-slate-400">{info.measurement}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                                    <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                                                                </div>
                                                                <div className="text-sm">
                                                                    <span className="font-semibold text-slate-900 dark:text-white block">{t('calculator.tariff')}</span>
                                                                    <span className="text-slate-600 dark:text-slate-400">{info.pricing}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                                                                    <Clock size={16} className="text-orange-600 dark:text-orange-400" />
                                                                </div>
                                                                <div className="text-sm">
                                                                    <span className="font-semibold text-slate-900 dark:text-white block">{t('calculator.duration')}</span>
                                                                    <span className="text-slate-600 dark:text-slate-400">{info.duration}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Advantages as Green Badges with Checkmarks */}
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            {info.advantages.map((advantage) => (
                                                                <span
                                                                    key={advantage}
                                                                    className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-800"
                                                                >
                                                                    <Check size={12} strokeWidth={3} />
                                                                    {advantage}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Conditions Note with Colored Background */}
                                                        <div className={`text-xs p-4 rounded-xl flex gap-3 leading-relaxed ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' : 'bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-slate-400'
                                                            }`}>
                                                            <Info size={16} className="flex-shrink-0 mt-0.5" />
                                                            {info.conditions}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Service Type Section */}
                                    {/* Service Type Section - Segmented Control */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">{t('calculator.serviceType')}</label>

                                        <div className="bg-slate-100 dark:bg-gray-800 p-1.5 rounded-xl flex mb-6">
                                            {(Object.keys(SERVICE_TYPE_INFO) as Array<keyof typeof SERVICE_TYPE_INFO>).map((type) => {
                                                const isSelected = selectedType === type;
                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setValue('type', type)}
                                                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${isSelected
                                                            ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-md'
                                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                            }`}
                                                    >
                                                        {SERVICE_TYPE_INFO[type].label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Selected Service Details */}
                                        <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700 rounded-2xl p-6 transition-all duration-300">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedType === 'express' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                        <DollarSign size={20} />
                                                    </div>
                                                    <span className={`text-xl font-bold ${selectedType === 'express' ? 'text-orange-600' : 'text-green-600'}`}>
                                                        {SERVICE_TYPE_INFO[selectedType].pricing}
                                                    </span>
                                                </div>
                                                <div className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold ${selectedType === 'express' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    <Clock size={14} />
                                                    {SERVICE_TYPE_INFO[selectedType].transitNote}
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 italic leading-relaxed">
                                                {SERVICE_TYPE_INFO[selectedType].description}
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {SERVICE_TYPE_INFO[selectedType].features.map((feature, idx) => (
                                                    <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                                                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                                                            <Check size={10} className="text-blue-600 dark:text-blue-400" strokeWidth={3} />
                                                        </div>
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Hidden input for form registration */}
                                        <input type="hidden" {...register('type')} />
                                    </div>
                                </div>


                                <div className="bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                                        <Package size={18} className="text-blue-600" /> {t('calculator.cargoDetails')}
                                    </h3>
                                    {selectedMode === 'sea' ? (
                                        <div className="space-y-6">
                                            {/* Unit Selection */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                    {t('calculator.measurementUnit')}
                                                </label>
                                                <select
                                                    value={dimensionUnit}
                                                    onChange={(e) => setDimensionUnit(e.target.value as LengthUnit)}
                                                    className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                >
                                                    <option value="m">{t('calculator.units.meters')} (m)</option>
                                                    <option value="cm">{t('calculator.units.centimeters')} (cm)</option>
                                                    <option value="in">{t('calculator.units.inches')} (in)</option>
                                                </select>
                                            </div>

                                            {/* Dimensions */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                                    {t('calculator.dimensions')}
                                                </label>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                                                            {t('calculator.length')}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={length}
                                                            onChange={(e) => setLength(e.target.value)}
                                                            placeholder="0.00"
                                                            className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                                                            {t('calculator.width')}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={width}
                                                            onChange={(e) => setWidth(e.target.value)}
                                                            placeholder="0.00"
                                                            className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                                                            {t('calculator.height')}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={height}
                                                            onChange={(e) => setHeight(e.target.value)}
                                                            placeholder="0.00"
                                                            className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Calculated CBM Display */}
                                            {calculatedCBM > 0 && (
                                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                                            <Check size={16} className="text-green-600 dark:text-green-400" strokeWidth={3} />
                                                        </div>
                                                        <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                                            {t('calculator.volumeCalculated')}: <strong className="text-lg ml-1">{calculatedCBM} CBM</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('calculator.weightKG')}</label>
                                            <input type="number" step="0.1" {...register('weight_kg')} placeholder="e.g. 50" className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all" />
                                        </div>
                                    )}
                                </div>

                                {/* Additional Services */}
                                <div className="bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">
                                        Services Additionnels
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.insurance
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                            onClick={() => setSelectedServices(prev => ({ ...prev, insurance: !prev.insurance }))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${selectedServices.insurance ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Assurance (Garantie Plateforme)</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Protection complète contre la perte ou les dommages</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.insurance}
                                                        onChange={() => { }} // Handled by parent div click
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.priority
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                            onClick={() => setSelectedServices(prev => ({ ...prev, priority: !prev.priority }))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${selectedServices.priority ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Traitement Prioritaire</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Accélérez le traitement de votre dossier</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.priority}
                                                        onChange={() => { }} // Handled by parent div click
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.packaging
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                            onClick={() => setSelectedServices(prev => ({ ...prev, packaging: !prev.packaging }))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${selectedServices.packaging ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                    <Box className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Emballage Renforcé</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Protection supplémentaire pour vos colis fragiles</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.packaging}
                                                        onChange={() => { }} // Handled by parent div click
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.inspection
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                            onClick={() => setSelectedServices(prev => ({ ...prev, inspection: !prev.inspection }))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${selectedServices.inspection ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                    <ClipboardCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Inspection Qualité</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Vérification de la conformité de la marchandise</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.inspection}
                                                        onChange={() => { }} // Handled by parent div click
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.customs_clearance
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                            onClick={() => setSelectedServices(prev => ({ ...prev, customs_clearance: !prev.customs_clearance }))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${selectedServices.customs_clearance ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                    <FileCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Dédouanement</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Gestion des formalités douanières</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.customs_clearance}
                                                        onChange={() => { }} // Handled by parent div click
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.door_to_door
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                            onClick={() => setSelectedServices(prev => ({ ...prev, door_to_door: !prev.door_to_door }))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${selectedServices.door_to_door ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                    <Truck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Door to Door</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Livraison jusqu'à l'adresse finale</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.door_to_door}
                                                        onChange={() => { }} // Handled by parent div click
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.storage
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                            onClick={() => setSelectedServices(prev => ({ ...prev, storage: !prev.storage }))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${selectedServices.storage ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                    <Warehouse className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Stockage</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Entreposage temporaire</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.storage}
                                                        onChange={() => { }} // Handled by parent div click
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 rounded-xl text-xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {loading ? t('calculator.calculating') : t('calculator.calculate')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-gray-800 sticky top-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('calculator.estimatedCost')}</h2>

                        {/* Sorting Controls (Only for Compare Mode) */}
                        {calculationMode === 'compare' && quotes.length > 0 && (
                            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                <button
                                    onClick={() => setSortBy('price')}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${sortBy === 'price'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                        : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    💰 {t('calculator.sort.price')}
                                </button>
                                <button
                                    onClick={() => setSortBy('speed')}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${sortBy === 'speed'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                        : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    🚀 {t('calculator.sort.speed')}
                                </button>
                                <button
                                    onClick={() => setSortBy('rating')}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${sortBy === 'rating'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                        : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    ⭐ {t('calculator.sort.rating')}
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            </div>
                        ) : quotes.length > 0 ? (
                            <div className="space-y-4">
                                {quotes
                                    .sort((a, b) => {
                                        if (sortBy === 'price') return a.total_cost - b.total_cost;
                                        if (sortBy === 'speed') {
                                            // Extract max days from string "X-Y days"
                                            const getDays = (s: string) => parseInt(s.split('-')[1]) || 0;
                                            return getDays(a.transit_time) - getDays(b.transit_time);
                                        }
                                        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
                                        return 0;
                                    })
                                    .map((quote) => (
                                        <div key={quote.id} className={`border rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${quote.is_platform_rate ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-md shadow-blue-500/10' : 'border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{quote.forwarder_name}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {quote.rating && (
                                                            <div className="flex items-center text-yellow-500 text-xs font-bold bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">
                                                                <Star size={10} fill="currentColor" className="mr-1" />
                                                                {quote.rating.toFixed(1)}
                                                            </div>
                                                        )}
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {quote.transit_time}
                                                        </p>
                                                    </div>
                                                </div>
                                                {quote.is_platform_rate && (
                                                    <span className="bg-blue-600 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold shadow-sm">Officiel</span>
                                                )}
                                            </div>

                                            <div className="space-y-3 my-4 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">Transport ({formatPrice(quote.price_per_unit)}/{quote.unit})</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{formatPrice(quote.base_cost)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">Assurance Trade</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{formatPrice(quote.insurance_cost)}</span>
                                                </div>
                                                <div className="border-t border-slate-100 dark:border-gray-800 pt-2 flex justify-between items-center">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sous-total HT</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{formatPrice(quote.base_cost + quote.insurance_cost)}</span>
                                                </div>
                                                {quote.additional_services_cost > 0 && (
                                                    <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                                                        <span className="text-xs font-medium">Services (+Assurance/Prio)</span>
                                                        <span className="font-bold">{formatPrice(quote.additional_services_cost)}</span>
                                                    </div>
                                                )}
                                                {quote.tax_cost > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">TVA (18%)</span>
                                                        <span className="font-bold text-slate-900 dark:text-white">{formatPrice(quote.tax_cost)}</span>
                                                    </div>
                                                )}
                                                <div className="border-t border-slate-100 dark:border-gray-800 pt-3 flex justify-between items-center">
                                                    <span className="text-blue-600 dark:text-blue-400 font-bold">Total Estimé</span>
                                                    <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{formatPrice(quote.total_cost)}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-5">
                                                <button
                                                    onClick={() => {
                                                        const text = `Devis NextMove Cargo\nTransitaire: ${quote.forwarder_name}\nTotal: ${formatPrice(quote.total_cost)}\nDurée: ${quote.transit_time}`;
                                                        navigator.clipboard.writeText(text);
                                                        // Could add toast here
                                                    }}
                                                    className="px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    Partager
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const state = {
                                                            prefill: {
                                                                origin_port: watch('origin'),
                                                                destination_port: watch('destination'),
                                                                transport_mode: selectedMode,
                                                                service_type: selectedType,
                                                                cargo_details: {
                                                                    length, width, height, weight: watch('weight_kg'), unit: dimensionUnit
                                                                },
                                                                budget: quote.total_cost,
                                                                target_forwarder: quote.forwarder_id,
                                                                quote_details: quote
                                                            }
                                                        };

                                                        if (user) {
                                                            navigate('/dashboard/client/rfq/create', { state });
                                                        } else {
                                                            navigate('/login', { state: { from: '/dashboard/client/rfq/create', ...state } });
                                                        }
                                                    }}
                                                    className="px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors shadow-lg shadow-slate-900/20"
                                                >
                                                    Réserver
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : searched ? (
                            <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <Search size={32} className="text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-slate-900 dark:text-white font-bold mb-2 text-lg">{t('calculator.noQuotesFound')}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto">Essayez de modifier vos critères de recherche pour trouver des offres.</p>
                            </div>
                        ) : (
                            <div className="text-center py-12 flex flex-col items-center justify-center h-full min-h-[400px]">
                                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <CalculatorIcon size={40} className="text-blue-500/50" />
                                </div>
                                <h3 className="text-slate-900 dark:text-white font-bold mb-2 text-xl">{t('calculator.fillForm')}</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto leading-relaxed">
                                    Remplissez le formulaire à gauche pour obtenir une estimation précise et immédiate.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

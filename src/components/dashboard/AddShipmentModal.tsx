
import { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Truck, Package, Anchor, Plane, Check, ChevronDown, Clock, DollarSign, Info, MapPin, Plus } from 'lucide-react';
import { shipmentService } from '../../services/shipmentService';
import { locationService, Location } from '../../services/locationService';
import { packageTypeService, PackageType } from '../../services/packageTypeService';
import { useCurrency } from '../../contexts/CurrencyContext';

interface AddShipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}





const TRANSPORT_MODE_INFO = {
    sea: {
        icon: Anchor,
        label: 'Fret Maritime',
        measurement: 'Volume en CBM (mètres cubes)',
        pricing: 'Prix calculé par CBM',
        duration: '25-35 jours',
        conditions: 'Idéal pour gros volumes, solution économique',
        advantages: ['Économique', 'Gros volumes', 'Écologique']
    },
    air: {
        icon: Plane,
        label: 'Fret Aérien',
        measurement: 'Poids en kilogrammes (kg)',
        pricing: 'Prix calculé par kg',
        duration: '3-7 jours',
        conditions: 'Rapide, idéal pour urgences et petits volumes',
        advantages: ['Rapide', 'Sécurisé', 'Urgences']
    }
};

const SERVICE_TYPE_INFO = {
    standard: {
        label: 'Standard (Économique)',
        description: 'Service standard avec délai normal',
        features: ['Consolidation possible', 'Meilleur rapport qualité/prix', 'Délai normal']
    },
    express: {
        label: 'Express (Le Plus Rapide)',
        description: 'Service prioritaire pour les envois urgents',
        features: ['Priorité maximale', 'Transit direct', 'Douane rapide']
    }
};

export default function AddShipmentModal({ isOpen, onClose, onSuccess }: AddShipmentModalProps) {
    const { currency } = useCurrency();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        tracking_number: `TRK - ${Date.now().toString().slice(-6)} `,
        origin_country: '',
        destination_country: '',
        carrier_name: '',
        transport_mode: 'sea' as 'sea' | 'air',
        service_type: 'standard' as 'standard' | 'express',
        price: 0,
        cargo_types: [] as string[],
        cargo_weight: 0,
        cargo_volume: 76, // Default max for sea
        cargo_packages: 0,
        departure_date: '',
        arrival_estimated_date: '',
        transit_duration: '',

    });

    const [locations, setLocations] = useState<Location[]>([]);
    const [packageTypes, setPackageTypes] = useState<PackageType[]>([]);
    const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
    const [isAddPackageTypeModalOpen, setIsAddPackageTypeModalOpen] = useState(false);
    const [newLocationName, setNewLocationName] = useState('');
    const [newPackageTypeName, setNewPackageTypeName] = useState('');
    const [locationFieldToAdd, setLocationFieldToAdd] = useState<'origin' | 'destination' | null>(null);
    const [searchTermOrigin, setSearchTermOrigin] = useState('');
    const [searchTermDest, setSearchTermDest] = useState('');
    const [showOriginDropdown, setShowOriginDropdown] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);

    useEffect(() => {
        loadLocations();
        loadPackageTypes();
    }, []);

    const loadLocations = async () => {
        const data = await locationService.getLocations();
        setLocations(data);
    };

    const loadPackageTypes = async () => {
        const data = await packageTypeService.getPackageTypes();
        setPackageTypes(data);
    };

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLocationName.trim()) return;

        try {
            const newLoc = await locationService.addLocation(newLocationName, 'country');
            setLocations(prev => [newLoc, ...prev]);

            if (locationFieldToAdd === 'origin') {
                setFormData(prev => ({ ...prev, origin_country: newLoc.name }));
            } else if (locationFieldToAdd === 'destination') {
                setFormData(prev => ({ ...prev, destination_country: newLoc.name }));
            }

            setNewLocationName('');
            setIsAddLocationModalOpen(false);
            setLocationFieldToAdd(null);
        } catch (err) {
            console.error('Error adding location:', err);
        }
    };

    const handleAddPackageType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPackageTypeName.trim()) return;

        try {
            const newType = await packageTypeService.addPackageType(newPackageTypeName);
            setPackageTypes(prev => [newType, ...prev]);

            // Auto-select the new type
            setFormData(prev => ({ ...prev, cargo_types: [...prev.cargo_types, newType.value] }));

            setNewPackageTypeName('');
            setIsAddPackageTypeModalOpen(false);
        } catch (err) {
            console.error('Error adding package type:', err);
        }
    };

    const filteredLocationsOrigin = locations.filter(l =>
        l.name.toLowerCase().includes(searchTermOrigin.toLowerCase())
    );

    const filteredLocationsDest = locations.filter(l =>
        l.name.toLowerCase().includes(searchTermDest.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsTypeDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Calculate transit duration automatically
    useEffect(() => {
        if (formData.departure_date && formData.arrival_estimated_date) {
            const start = new Date(formData.departure_date);
            const end = new Date(formData.arrival_estimated_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (!isNaN(diffDays) && diffDays >= 0) {
                setFormData(prev => ({ ...prev, transit_duration: `${diffDays} jours` }));
            }
        }
    }, [formData.departure_date, formData.arrival_estimated_date]);

    if (!isOpen) return null;

    const toggleType = (value: string) => {
        setFormData(prev => {
            const exists = prev.cargo_types.includes(value);
            if (exists) {
                return { ...prev, cargo_types: prev.cargo_types.filter(t => t !== value) };
            } else {
                return { ...prev, cargo_types: [...prev.cargo_types, value] };
            }
        });
    };

    const toggleAllTypes = () => {
        if (formData.cargo_types.length === packageTypes.length) {
            setFormData(prev => ({ ...prev, cargo_types: [] }));
        } else {
            setFormData(prev => ({ ...prev, cargo_types: packageTypes.map(t => t.value) }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const submissionData = {
                ...formData,
                cargo_type: formData.cargo_types.join(', '), // Join array to string for backend
                origin_port: '',
                destination_port: '',
            };
            // Remove temporary array fields
            const { cargo_types, ...finalData } = submissionData;

            await shipmentService.createShipment(finalData);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating shipment:', err);
            setError(err.message || 'Une erreur est survenue lors de la création de l\'expédition.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Truck className="w-6 h-6 text-primary" />
                                Nouvelle Expédition
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Transport Mode Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Mode de Transport</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(Object.keys(TRANSPORT_MODE_INFO) as Array<keyof typeof TRANSPORT_MODE_INFO>).map((mode) => {
                                        const info = TRANSPORT_MODE_INFO[mode];
                                        const Icon = info.icon;
                                        const isSelected = formData.transport_mode === mode;

                                        return (
                                            <label
                                                key={mode}
                                                className={`relative flex flex-col p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${isSelected
                                                    ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10 scale-[1.02]'
                                                    : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="transport_mode"
                                                    value={mode}
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        const newMode = mode;
                                                        const today = new Date();
                                                        const departureDate = today.toISOString().split('T')[0];

                                                        let arrivalDate = new Date();
                                                        if (newMode === 'air') {
                                                            arrivalDate.setDate(today.getDate() + 5); // Default 5 days (within 3-7)
                                                        } else {
                                                            arrivalDate.setDate(today.getDate() + 30); // Default 30 days (within 25-35)
                                                        }
                                                        const arrivalDateStr = arrivalDate.toISOString().split('T')[0];

                                                        setFormData({
                                                            ...formData,
                                                            transport_mode: newMode,
                                                            cargo_weight: newMode === 'air' ? 1000 : 0,
                                                            cargo_volume: newMode === 'sea' ? 76 : 0,
                                                            departure_date: departureDate,
                                                            arrival_estimated_date: arrivalDateStr
                                                        });
                                                    }}
                                                    className="sr-only"
                                                />

                                                <div className="flex items-center justify-between mb-6">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <span className={`font-bold text-xl ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                        {info.label}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                                                        Sélectionné
                                                    </span>
                                                )}

                                                <div className="space-y-4 mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <Package size={16} className="text-blue-600" />
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="font-semibold text-gray-900 block">Mesure</span>
                                                            <span className="text-gray-600">{info.measurement}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                                            <DollarSign size={16} className="text-green-600" />
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="font-semibold text-gray-900 block">Tarif</span>
                                                            <span className="text-gray-600">{info.pricing}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                                            <Clock size={16} className="text-orange-600" />
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="font-semibold text-gray-900 block">Durée</span>
                                                            <span className="text-gray-600">{info.duration}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {info.advantages.map((advantage) => (
                                                        <span
                                                            key={advantage}
                                                            className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-green-100"
                                                        >
                                                            <Check size={12} strokeWidth={3} />
                                                            {advantage}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className={`text-xs p-4 rounded-xl flex gap-3 leading-relaxed ${isSelected ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-600'
                                                    }`}>
                                                    <Info size={16} className="flex-shrink-0 mt-0.5" />
                                                    {info.conditions}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Service Type Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Type de Service</label>
                                <div className="bg-gray-100 p-1.5 rounded-xl flex mb-6">
                                    {(Object.keys(SERVICE_TYPE_INFO) as Array<keyof typeof SERVICE_TYPE_INFO>).map((type) => {
                                        const isSelected = formData.service_type === type;
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, service_type: type })}
                                                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${isSelected
                                                    ? 'bg-white text-gray-900 shadow-md'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {SERVICE_TYPE_INFO[type].label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 transition-all duration-300">
                                    <p className="text-sm text-gray-600 mb-6 italic leading-relaxed">
                                        {SERVICE_TYPE_INFO[formData.service_type].description}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {SERVICE_TYPE_INFO[formData.service_type].features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2.5 text-sm text-gray-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <Check size={10} className="text-blue-600" strokeWidth={3} />
                                                </div>
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Route & Cargo Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                                        <MapPin className="w-4 h-4 text-blue-600" /> Route & Transport
                                    </h4>
                                    <div className="space-y-4">
                                        {/* Origin Country Dropdown */}
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pays d'Origine</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                                <input
                                                    type="text"
                                                    placeholder="Rechercher ou ajouter..."
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary text-sm transition-all shadow-sm"
                                                    value={showOriginDropdown ? searchTermOrigin : formData.origin_country}
                                                    onChange={e => {
                                                        setSearchTermOrigin(e.target.value);
                                                        if (!showOriginDropdown) setShowOriginDropdown(true);
                                                    }}
                                                    onFocus={() => {
                                                        setSearchTermOrigin('');
                                                        setShowOriginDropdown(true);
                                                    }}
                                                    onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                                                />
                                                {showOriginDropdown && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                                        {filteredLocationsOrigin.map(loc => (
                                                            <button
                                                                key={loc.id}
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, origin_country: loc.name });
                                                                    setShowOriginDropdown(false);
                                                                }}
                                                            >
                                                                {loc.name}
                                                            </button>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-blue-600 font-medium border-t border-gray-100 flex items-center gap-2"
                                                            onClick={() => {
                                                                setLocationFieldToAdd('origin');
                                                                setIsAddLocationModalOpen(true);
                                                                setShowOriginDropdown(false);
                                                            }}
                                                        >
                                                            <Plus className="w-4 h-4" /> Ajouter "{searchTermOrigin}"
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Destination Country Dropdown */}
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pays de Destination</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                                <input
                                                    type="text"
                                                    placeholder="Rechercher ou ajouter..."
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary text-sm transition-all shadow-sm"
                                                    value={showDestDropdown ? searchTermDest : formData.destination_country}
                                                    onChange={e => {
                                                        setSearchTermDest(e.target.value);
                                                        if (!showDestDropdown) setShowDestDropdown(true);
                                                    }}
                                                    onFocus={() => {
                                                        setSearchTermDest('');
                                                        setShowDestDropdown(true);
                                                    }}
                                                    onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                                                />
                                                {showDestDropdown && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                                        {filteredLocationsDest.map(loc => (
                                                            <button
                                                                key={loc.id}
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, destination_country: loc.name });
                                                                    setShowDestDropdown(false);
                                                                }}
                                                            >
                                                                {loc.name}
                                                            </button>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-blue-600 font-medium border-t border-gray-100 flex items-center gap-2"
                                                            onClick={() => {
                                                                setLocationFieldToAdd('destination');
                                                                setIsAddLocationModalOpen(true);
                                                                setShowDestDropdown(false);
                                                            }}
                                                        >
                                                            <Plus className="w-4 h-4" /> Ajouter "{searchTermDest}"
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                                        <Package className="w-4 h-4 text-blue-600" /> Colis
                                    </h4>

                                    {/* Multi-select Dropdown */}
                                    <div className="relative" ref={dropdownRef}>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Type de colis</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <span className="truncate">
                                                {formData.cargo_types.length > 0
                                                    ? formData.cargo_types.join(', ')
                                                    : 'Sélectionner les types...'}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        </button>

                                        {isTypeDropdownOpen && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                                <div className="p-2 border-b border-gray-100">
                                                    <button
                                                        type="button"
                                                        onClick={toggleAllTypes}
                                                        className="text-xs font-bold text-primary hover:text-blue-700 w-full text-left px-2 py-1"
                                                    >
                                                        {formData.cargo_types.length === packageTypes.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                                    </button>
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    {packageTypes.map((type) => (
                                                        <label key={type.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.cargo_types.includes(type.value)
                                                                ? 'bg-primary border-primary text-white'
                                                                : 'border-gray-300 bg-white'
                                                                }`}>
                                                                {formData.cargo_types.includes(type.value) && <Check className="w-3 h-3" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={formData.cargo_types.includes(type.value)}
                                                                onChange={() => toggleType(type.value)}
                                                            />
                                                            <span className="text-sm text-gray-700">{type.label}</span>
                                                        </label>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        className="w-full text-left px-2 py-2 hover:bg-blue-50 text-sm text-blue-600 font-medium border-t border-gray-100 flex items-center gap-2 rounded-lg"
                                                        onClick={() => {
                                                            setIsAddPackageTypeModalOpen(true);
                                                            setIsTypeDropdownOpen(false);
                                                        }}
                                                    >
                                                        <Plus className="w-4 h-4" /> Ajouter un type...
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {formData.transport_mode === 'air' ? (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Poids (kg) - Max 1000kg</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="1000"
                                                    className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary p-2.5 text-sm transition-all"
                                                    value={formData.cargo_weight}
                                                    onChange={e => {
                                                        const val = Number(e.target.value);
                                                        if (val > 1000) return; // Prevent input > 1000
                                                        setFormData({ ...formData, cargo_weight: val });
                                                    }}
                                                />
                                                <p className="text-[10px] text-gray-400 mt-1">Limite: 1000 kg par expédition aérienne</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Volume (cbm) - Max 76 cbm (40 pieds)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="76"
                                                    className="w-full rounded-xl border-gray-200 bg-gray-50 focus:border-primary focus:ring-primary p-2.5 text-sm transition-all"
                                                    value={formData.cargo_volume}
                                                    onChange={e => {
                                                        const val = Number(e.target.value);
                                                        if (val > 76) return; // Prevent input > 76 (approx 40ft HC)
                                                        setFormData({ ...formData, cargo_volume: val });
                                                    }}
                                                />
                                                <p className="text-[10px] text-gray-400 mt-1">Limite: 76 cbm (Équivalent conteneur 40 pieds)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>



                            {/* Pricing */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide mb-4">
                                    <DollarSign className="w-4 h-4 text-blue-600" /> Tarification
                                </h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prix par {formData.transport_mode === 'sea' ? 'CBM' : 'kg'} ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        className="w-full rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary p-2.5 text-sm transition-all shadow-sm"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide mb-4">
                                    <Clock className="w-4 h-4 text-blue-600" /> Planning
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Durée de Transit (jours)</label>
                                        <input
                                            type="text"
                                            readOnly
                                            className="w-full rounded-xl border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed focus:border-gray-200 focus:ring-0 p-2.5 text-sm transition-all shadow-sm"
                                            value={formData.transit_duration}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de Départ</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary p-2.5 text-sm transition-all shadow-sm"
                                            value={formData.departure_date}
                                            onChange={e => setFormData({ ...formData, departure_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date d'Arrivée Estimée</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary p-2.5 text-sm transition-all shadow-sm"
                                            value={formData.arrival_estimated_date}
                                            onChange={e => setFormData({ ...formData, arrival_estimated_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                    onClick={onClose}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Création...' : 'Créer l\'expédition'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* Add Location Modal */}
            {isAddLocationModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Ajouter une nouvelle destination</h3>
                        <form onSubmit={handleAddLocation}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Pays</label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    className="w-full rounded-xl border-gray-200 focus:border-primary focus:ring-primary p-2.5"
                                    value={newLocationName}
                                    onChange={e => setNewLocationName(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Cette destination sera soumise pour validation par les administrateurs.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddLocationModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Add Package Type Modal */}
            {isAddPackageTypeModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Ajouter un Type de Colis</h3>
                        <form onSubmit={handleAddPackageType}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Type</label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    className="w-full rounded-xl border-gray-200 focus:border-primary focus:ring-primary p-2.5"
                                    value={newPackageTypeName}
                                    onChange={e => setNewPackageTypeName(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Ce type sera soumis pour validation par les administrateurs.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddPackageTypeModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { X, Loader2, Anchor, Plane, Calendar, Package, ShieldCheck, Zap, Box, ClipboardCheck, FileCheck, Truck, Warehouse } from 'lucide-react';
import { CreateConsolidationData } from '../../types/consolidation';
import { consolidationService } from '../../services/consolidationService';
import { locationService, Location } from '../../services/locationService';

interface CreateConsolidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mode?: 'create' | 'edit';
    initialData?: Partial<CreateConsolidationData> & { id?: string };
    defaultType?: 'forwarder_offer' | 'client_request';
}

export default function CreateConsolidationModal({
    isOpen,
    onClose,
    onSuccess,
    mode = 'create',
    initialData,
    defaultType = 'forwarder_offer'
}: CreateConsolidationModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreateConsolidationData>({
        defaultValues: {
            type: defaultType,
            currency: 'XOF',
            min_cbm: 1,
            ...initialData
        }
    });

    const [locations, setLocations] = useState<Location[]>([]);
    const [originSearch, setOriginSearch] = useState('');
    const [destSearch, setDestSearch] = useState('');
    const [showOriginDropdown, setShowOriginDropdown] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);

    useEffect(() => {
        const loadLocations = async () => {
            try {
                const data = await locationService.getLocations();
                setLocations(data);
            } catch (error) {
                console.error('Error loading locations:', error);
            }
        };
        loadLocations();
    }, []);

    const filteredOrigins = locations.filter(l =>
        l.name.toLowerCase().includes(originSearch.toLowerCase())
    );

    const filteredDestinations = locations.filter(l =>
        l.name.toLowerCase().includes(destSearch.toLowerCase())
    );

    // Reset form when modal opens/closes or mode changes
    useEffect(() => {
        if (isOpen) {
            reset({
                type: defaultType,
                currency: 'XOF',
                min_cbm: 1,
                ...initialData
            });
        }
    }, [isOpen, mode, initialData, defaultType, reset]);

    const type = watch('type');
    const transportMode = watch('transport_mode');

    const onSubmit = async (data: CreateConsolidationData) => {
        setLoading(true);
        try {
            if (mode === 'edit' && initialData?.id) {
                await consolidationService.updateConsolidation(initialData.id, data);
            } else {
                await consolidationService.createConsolidation(data);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving consolidation:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {mode === 'edit'
                            ? 'Edit Consolidation'
                            : type === 'client_request' ? 'Request Groupage' : 'Create New Consolidation'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                            <input
                                {...register('title', { required: 'Title is required' })}
                                placeholder={type === 'client_request' ? "e.g., Electronics to Paris" : "e.g., Monthly Container to Dakar"}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Origin Port</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={originSearch || watch('origin_port')}
                                        onChange={(e) => {
                                            setOriginSearch(e.target.value);
                                            setShowOriginDropdown(true);
                                            setValue('origin_port', e.target.value);
                                        }}
                                        onFocus={() => {
                                            setOriginSearch('');
                                            setShowOriginDropdown(true);
                                        }}
                                        onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Select origin..."
                                    />
                                    {showOriginDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                                            {filteredOrigins.map(loc => (
                                                <button
                                                    key={loc.id}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-gray-700 text-sm text-slate-700 dark:text-slate-300"
                                                    onClick={() => {
                                                        setValue('origin_port', loc.name);
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
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination Port</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={destSearch || watch('destination_port')}
                                        onChange={(e) => {
                                            setDestSearch(e.target.value);
                                            setShowDestDropdown(true);
                                            setValue('destination_port', e.target.value);
                                        }}
                                        onFocus={() => {
                                            setDestSearch('');
                                            setShowDestDropdown(true);
                                        }}
                                        onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Select destination..."
                                    />
                                    {showDestDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                                            {filteredDestinations.map(loc => (
                                                <button
                                                    key={loc.id}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-gray-700 text-sm text-slate-700 dark:text-slate-300"
                                                    onClick={() => {
                                                        setValue('destination_port', loc.name);
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

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Transport Mode</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition-all ${transportMode === 'sea' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-gray-700'}`}>
                                    <input type="radio" value="sea" {...register('transport_mode', { required: true })} className="sr-only" />
                                    <Anchor className={`h-5 w-5 ${transportMode === 'sea' ? 'text-blue-500' : 'text-slate-400'}`} />
                                    <span className={transportMode === 'sea' ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}>Sea Freight</span>
                                </label>
                                <label className={`cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition-all ${transportMode === 'air' ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-200 dark:border-gray-700'}`}>
                                    <input type="radio" value="air" {...register('transport_mode', { required: true })} className="sr-only" />
                                    <Plane className={`h-5 w-5 ${transportMode === 'air' ? 'text-sky-500' : 'text-slate-400'}`} />
                                    <span className={transportMode === 'air' ? 'font-medium text-sky-700 dark:text-sky-300' : 'text-slate-600 dark:text-slate-400'}>Air Freight</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Capacity & Pricing */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Package className="h-4 w-4" /> Capacity
                            </h3>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Total Capacity (CBM)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('total_capacity_cbm')}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Total Capacity (kg)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('total_capacity_kg')}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {type !== 'client_request' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-lg">💰</span> Pricing
                                </h3>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Price per CBM</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('price_per_cbm')}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Currency</label>
                                    <select
                                        {...register('currency')}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="XOF">XOF (FCFA)</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="CNY">CNY</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>



                    {/* Additional Services */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Additional Services
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { id: 'insurance', label: 'Insurance', desc: 'Full protection', icon: ShieldCheck, color: 'blue' },
                                { id: 'priority', label: 'Priority', desc: 'Fast track processing', icon: Zap, color: 'orange' },
                                { id: 'packaging', label: 'Reinforced Packaging', desc: 'Extra protection', icon: Box, color: 'indigo' },
                                { id: 'inspection', label: 'Quality Inspection', desc: 'Goods verification', icon: ClipboardCheck, color: 'green' },
                                { id: 'customs_clearance', label: 'Customs Clearance', desc: 'Customs formalities', icon: FileCheck, color: 'teal' },
                                { id: 'door_to_door', label: 'Door to Door', desc: 'Final delivery', icon: Truck, color: 'cyan' },
                                { id: 'storage', label: 'Storage', desc: 'Temporary warehousing', icon: Warehouse, color: 'slate' }
                            ].map((service) => {
                                const Icon = service.icon;
                                return (
                                    <label
                                        key={service.id}
                                        className="relative flex items-center p-3 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-gray-800 border-slate-200 dark:border-gray-700"
                                    >
                                        <input
                                            type="checkbox"
                                            value={service.id}
                                            {...register('services_requested')}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                                        />
                                        <div className={`p-1.5 rounded-full mr-3 bg-${service.color}-100 text-${service.color}-600`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-sm text-slate-900 dark:text-white block">
                                                {service.label}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 block">
                                                {service.desc}
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Schedule
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {type !== 'client_request' && (
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Deadline</label>
                                    <input
                                        type="date"
                                        {...register('deadline_date')}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">
                                    {type === 'client_request' ? 'Preferred Departure' : 'Departure'}
                                </label>
                                <input
                                    type="date"
                                    {...register('departure_date', { required: true })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">
                                    {type === 'client_request' ? 'Expected Arrival' : 'Arrival (Est.)'}
                                </label>
                                <input
                                    type="date"
                                    {...register('arrival_date')}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description / Notes</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Additional details about the shipment..."
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-gray-700 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30 flex items-center"
                        >
                            {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                            {mode === 'edit' ? 'Save Changes' : type === 'client_request' ? 'Submit Request' : 'Create Consolidation'}
                        </button>
                    </div>
                </form>
            </div >
        </div >,
        document.body
    );
}

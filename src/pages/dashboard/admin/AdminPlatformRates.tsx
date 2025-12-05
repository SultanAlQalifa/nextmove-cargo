import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { Ship, Plane, Edit2, DollarSign, Clock, ShieldCheck, Save, X, AlertCircle } from 'lucide-react';
import { platformRateService, PlatformRate } from '../../../services/platformRateService';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { formatCurrency, convertCurrency } from '../../../utils/currencyFormatter';

export default function AdminPlatformRates() {
    const { currency: currentCurrency } = useCurrency();
    const [rates, setRates] = useState<PlatformRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRate, setEditingRate] = useState<PlatformRate | null>(null);
    const [formData, setFormData] = useState<Partial<PlatformRate>>({});
    const [editPriceDisplay, setEditPriceDisplay] = useState<string>(''); // For handling input value
    const [error, setError] = useState('');

    const fetchRates = async () => {
        try {
            const data = await platformRateService.getAllRates();
            setRates(data);
        } catch (err) {
            console.error(err);
            setError('Impossible de charger les tarifs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const handleEdit = (rate: PlatformRate) => {
        setEditingRate(rate);
        setFormData(rate);
        // Initialize edit price in current currency
        const converted = convertCurrency(rate.price, rate.currency, currentCurrency);
        setEditPriceDisplay(converted.toFixed(2));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRate) return;

        try {
            // Convert back to base currency for saving
            // We assume editingRate.currency is the base (e.g. EUR)
            const priceInBase = convertCurrency(parseFloat(editPriceDisplay), currentCurrency, editingRate.currency);

            await platformRateService.updateRate(editingRate.id, {
                ...formData,
                price: priceInBase
            });

            fetchRates();
            setEditingRate(null);
        } catch (err) {
            setError('Erreur lors de la mise à jour.');
        }
    };

    const getIcon = (mode: string) => {
        return mode === 'sea' ? <Ship className="w-6 h-6 text-blue-600" /> : <Plane className="w-6 h-6 text-orange-600" />;
    };

    const getModeLabel = (mode: string) => mode === 'sea' ? 'Maritime' : 'Aérien';
    const getTypeLabel = (type: string) => type === 'standard' ? 'Standard' : 'Express';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tarifs de la Plateforme"
                badge="Admin"
                description="Gérez les tarifs de base calculés par l'algorithme."
            />

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rates.map(rate => {
                        const convertedPrice = convertCurrency(rate.price, rate.currency, currentCurrency);
                        return (
                            <div key={rate.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${rate.mode === 'sea' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                            {getIcon(rate.mode)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{getModeLabel(rate.mode)} - {getTypeLabel(rate.type)}</h3>
                                            <span className="text-sm text-gray-500">Délai: {rate.min_days}-{rate.max_days} jours</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleEdit(rate)}
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <DollarSign size={14} />
                                            <span className="text-xs font-semibold uppercase">Prix Base</span>
                                        </div>
                                        <div className="font-mono font-bold text-gray-900">
                                            {formatCurrency(convertedPrice, currentCurrency)}/{rate.unit}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <ShieldCheck size={14} />
                                            <span className="text-xs font-semibold uppercase">Assurance</span>
                                        </div>
                                        <div className="font-mono font-bold text-gray-900">
                                            {(rate.insurance_rate * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <Clock size={14} />
                                            <span className="text-xs font-semibold uppercase">Délai Max</span>
                                        </div>
                                        <div className="font-mono font-bold text-gray-900">
                                            {rate.max_days} j
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {editingRate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Modifier {getModeLabel(editingRate.mode)} {getTypeLabel(editingRate.type)}</h3>
                            <button onClick={() => setEditingRate(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prix ({currentCurrency}/{editingRate.unit})</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editPriceDisplay}
                                    onChange={e => setEditPriceDisplay(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Converti automatiquement en {editingRate.currency} pour le stockage.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Délai Min (jours)</label>
                                    <input
                                        type="number"
                                        value={formData.min_days}
                                        onChange={e => setFormData({ ...formData, min_days: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Délai Max (jours)</label>
                                    <input
                                        type="number"
                                        value={formData.max_days}
                                        onChange={e => setFormData({ ...formData, max_days: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Taux Assurance (ex: 0.05 pour 5%)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={formData.insurance_rate}
                                    onChange={e => setFormData({ ...formData, insurance_rate: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <p className="text-xs text-gray-500 mt-1">Actuel: {(formData.insurance_rate || 0) * 100}%</p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingRate(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

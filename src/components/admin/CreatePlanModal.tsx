import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit2 } from 'lucide-react';
import { CreatePlanData, SubscriptionFeature, BillingCycle } from '../../types/subscription';
import { FEATURE_DEFINITIONS } from '../../constants/subscriptionFeatures';

interface CreatePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreatePlanData) => Promise<void>;
    initialData?: CreatePlanData;
    isEditing?: boolean;
}

export default function CreatePlanModal({ isOpen, onClose, onSubmit, initialData, isEditing = false }: CreatePlanModalProps) {
    const [formData, setFormData] = useState<CreatePlanData>({
        name: '',
        description: '',
        price: 0,
        currency: 'XOF',
        billing_cycle: 'monthly',
        features: []
    });
    const [loading, setLoading] = useState(false);

    // Feature Input State
    const [newFeature, setNewFeature] = useState('');
    const [newFeatureType, setNewFeatureType] = useState<'boolean' | 'limit'>('boolean');
    const [newFeatureValue, setNewFeatureValue] = useState('');
    const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                description: '',
                price: 0,
                currency: 'XOF',
                billing_cycle: 'monthly',
                features: []
            });
        }
        // Reset edit state when modal opens/closes or data changes
        setEditingFeatureId(null);
        setNewFeature('');
        setNewFeatureType('boolean');
        setNewFeatureValue('');
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting plan:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFeature = () => {
        if (!newFeature.trim()) return;

        const featureValue = newFeatureType === 'limit' ? Number(newFeatureValue) || 0 : true;

        if (editingFeatureId) {
            // Update existing feature
            setFormData({
                ...formData,
                features: formData.features.map(f =>
                    f.id === editingFeatureId
                        ? { ...f, name: newFeature, type: newFeatureType, value: featureValue }
                        : f
                )
            });
            setEditingFeatureId(null);
        } else {
            // Add new feature
            const feature: SubscriptionFeature = {
                id: Math.random().toString(36).substr(2, 9),
                name: newFeature,
                type: newFeatureType,
                value: featureValue,
                included: true
            };
            setFormData({ ...formData, features: [...formData.features, feature] });
        }

        // Reset inputs
        setNewFeature('');
        setNewFeatureType('boolean');
        setNewFeatureValue('');
    };

    const editFeature = (feature: SubscriptionFeature) => {
        setNewFeature(feature.name);
        setNewFeatureType(feature.type);
        setNewFeatureValue(feature.type === 'limit' ? String(feature.value) : '');
        setEditingFeatureId(feature.id);
    };

    const removeFeature = (id: string) => {
        setFormData({ ...formData, features: formData.features.filter(f => f.id !== id) });
        if (editingFeatureId === id) {
            setEditingFeatureId(null);
            setNewFeature('');
            setNewFeatureType('boolean');
            setNewFeatureValue('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditing ? 'Modifier le Plan' : 'Nouveau Plan d\'Abonnement'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nom du Plan</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="Ex: Premium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Cycle de Facturation</label>
                            <select
                                value={formData.billing_cycle}
                                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as BillingCycle })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            >
                                <option value="monthly">Mensuel</option>
                                <option value="quarterly">Trimestriel (3 mois)</option>
                                <option value="biannual">Semestriel (6 mois)</option>
                                <option value="yearly">Annuel</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none h-24"
                            placeholder="Description courte du plan..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Prix</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Devise</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            >
                                <option value="XOF">XOF (FCFA)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="USD">USD ($)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-700">Fonctionnalités & Limites</label>

                        <div className={`grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 rounded-xl transition-colors ${editingFeatureId ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50'}`}>
                            <div className="sm:col-span-5 space-y-1">
                                <label className="text-xs text-gray-500">Fonctionnalité</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none pr-8"
                                        placeholder="Ex: Expéditions/mois"
                                        list="feature-suggestions"
                                    />
                                    <datalist id="feature-suggestions">
                                        {FEATURE_DEFINITIONS.map(def => (
                                            <option key={def.id} value={def.name}>{def.description}</option>
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="sm:col-span-3 space-y-1">
                                <label className="text-xs text-gray-500">Type</label>
                                <select
                                    value={newFeatureType}
                                    onChange={(e) => setNewFeatureType(e.target.value as 'boolean' | 'limit')}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none bg-white"
                                    disabled={!!editingFeatureId} // Prevent changing type during edit to avoid confusion, or allow it? Let's allow it but maybe warn. Actually, better to allow.
                                >
                                    <option value="boolean">Inclus/Non</option>
                                    <option value="limit">Limite</option>
                                </select>
                            </div>
                            <div className="sm:col-span-3 space-y-1">
                                <label className="text-xs text-gray-500">Valeur</label>
                                {newFeatureType === 'limit' ? (
                                    <input
                                        type="number"
                                        value={newFeatureValue}
                                        onChange={(e) => setNewFeatureValue(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none"
                                        placeholder="Ex: 50"
                                    />
                                ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500 italic bg-gray-100 rounded-lg border border-gray-200">
                                        Oui/Non
                                    </div>
                                )}
                            </div>
                            <div className="sm:col-span-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Check if selected name matches a definition to auto-set type only if NOT editing
                                        if (!editingFeatureId) {
                                            const def = FEATURE_DEFINITIONS.find(f => f.name === newFeature);
                                            if (def && newFeatureType !== def.type) {
                                                setNewFeatureType(def.type);
                                            }
                                        }
                                        handleSaveFeature();
                                    }}
                                    className={`w-full py-2 text-white rounded-lg transition-colors flex items-center justify-center ${editingFeatureId ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}`}
                                >
                                    {editingFeatureId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {formData.features.map((feature) => (
                                <div key={feature.id} className={`flex items-center justify-between p-3 bg-white border rounded-xl group transition-all ${editingFeatureId === feature.id ? 'border-primary ring-1 ring-primary/20' : 'border-gray-100 hover:border-primary/20'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${feature.type === 'limit' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                            {feature.type === 'limit' ? (
                                                <span className="text-xs font-bold">{feature.value === -1 ? '∞' : feature.value}</span>
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {feature.type === 'limit'
                                                    ? `Limite: ${feature.value === -1 ? 'Illimité' : feature.value}`
                                                    : 'Fonctionnalité incluse'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => editFeature(feature)}
                                            className="text-gray-400 hover:text-primary p-2 hover:bg-primary/5 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeFeature(feature.id)}
                                            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {formData.features.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                    <p className="text-sm text-gray-400">Aucune fonctionnalité ajoutée</p>
                                    <p className="text-xs text-gray-300 mt-1">Utilisez le formulaire ci-dessus pour en ajouter</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer le Plan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

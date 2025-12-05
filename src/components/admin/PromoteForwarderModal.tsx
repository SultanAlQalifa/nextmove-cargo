import { useState } from 'react';
import { X, TrendingUp, DollarSign, Target, Calendar } from 'lucide-react';
import { ForwarderProfile } from '../../services/forwarderService';

interface PromoteForwarderModalProps {
    isOpen: boolean;
    onClose: () => void;
    forwarder: ForwarderProfile | null;
    onConfirm: (id: string, config: any) => Promise<void>;
}

export default function PromoteForwarderModal({ isOpen, onClose, forwarder, onConfirm }: PromoteForwarderModalProps) {
    const [type, setType] = useState('banner');
    const [budget, setBudget] = useState('100');
    const [duration, setDuration] = useState('7d');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !forwarder) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onConfirm(forwarder.id, { type, budget, duration });
            onClose();
        } catch (error) {
            console.error('Error promoting forwarder:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        Promouvoir le transitaire
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-sm text-purple-800">
                            Augmentez la visibilité de <strong>{forwarder.company_name}</strong> grâce à nos options de promotion ciblée.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Target className="w-4 h-4 text-gray-400" />
                            Type de promotion
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'banner', label: 'Bannière Premium', desc: 'Affichage en haut de page' },
                                { id: 'list_top', label: 'Tête de liste', desc: 'Premier dans les résultats' },
                                { id: 'newsletter', label: 'Newsletter', desc: 'Mention dans l\'email hebdo' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setType(opt.id)}
                                    className={`p-3 rounded-xl border text-left transition-all ${type === opt.id
                                            ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-200'
                                            : 'bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
                                        }`}
                                >
                                    <div className={`font-medium ${type === opt.id ? 'text-purple-900' : 'text-gray-900'}`}>
                                        {opt.label}
                                    </div>
                                    <div className={`text-xs ${type === opt.id ? 'text-purple-700' : 'text-gray-500'}`}>
                                        {opt.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                Budget (FCFA)
                            </label>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                Durée
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            >
                                <option value="3d">3 Jours</option>
                                <option value="7d">1 Semaine</option>
                                <option value="14d">2 Semaines</option>
                                <option value="30d">1 Mois</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm shadow-purple-600/20 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Activation...' : 'Lancer la promotion'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

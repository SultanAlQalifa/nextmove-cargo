import { useState } from 'react';
import { X, Star, Calendar, Layout } from 'lucide-react';
import { ForwarderProfile } from '../../services/forwarderService';

interface FeatureForwarderModalProps {
    isOpen: boolean;
    onClose: () => void;
    forwarder: ForwarderProfile | null;
    onConfirm: (id: string, config: any) => Promise<void>;
}

export default function FeatureForwarderModal({ isOpen, onClose, forwarder, onConfirm }: FeatureForwarderModalProps) {
    const [duration, setDuration] = useState('7d');
    const [placement, setPlacement] = useState('home');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !forwarder) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onConfirm(forwarder.id, { duration, placement });
            onClose();
        } catch (error) {
            console.error('Error featuring forwarder:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        Mettre en vedette
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <p className="text-sm text-gray-600">
                        Configurez les paramètres de mise en avant pour <strong>{forwarder.company_name}</strong>.
                    </p>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Durée
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {['7d', '30d', '90d'].map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDuration(d)}
                                    className={`px-3 py-2 text-sm font-medium rounded-xl border transition-all ${duration === d
                                            ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-yellow-200 hover:bg-yellow-50/50'
                                        }`}
                                >
                                    {d === '7d' ? '1 Semaine' : d === '30d' ? '1 Mois' : '3 Mois'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Layout className="w-4 h-4 text-gray-400" />
                            Emplacement
                        </label>
                        <select
                            value={placement}
                            onChange={(e) => setPlacement(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
                        >
                            <option value="home">Page d'accueil</option>
                            <option value="search">Résultats de recherche</option>
                            <option value="sidebar">Barre latérale</option>
                            <option value="all">Tous les emplacements</option>
                        </select>
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
                            className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg shadow-sm shadow-yellow-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Configuration...' : 'Confirmer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

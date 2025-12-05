import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Shield, Globe, TrendingUp, Truck, Hash, X, Loader2, ArrowLeft } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionPlan } from '../types/subscription';
import { FEATURE_DEFINITIONS } from '../constants/subscriptionFeatures';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function UpgradeToPro() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { refreshProfile } = useAuth();
    const { success, error: showError } = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await subscriptionService.getPlans();
                setPlans(data.filter(p => p.is_active));
            } catch (error) {
                console.error('Error fetching plans:', error);
                showError('Erreur lors du chargement des offres');
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleUpgrade = async (planId: string) => {
        setUpgrading(planId);
        try {
            await subscriptionService.upgradeToForwarder(planId);
            await refreshProfile(); // Refresh context to get new role
            success('Félicitations ! Vous êtes maintenant un Partenaire Transitaire.');
            navigate('/dashboard'); // Should redirect to Forwarder Dashboard
        } catch (error) {
            console.error('Upgrade failed:', error);
            showError('Échec de la mise à niveau. Veuillez réessayer.');
        } finally {
            setUpgrading(null);
        }
    };

    // Helper to group definitions
    const definitionsByCategory = FEATURE_DEFINITIONS.reduce((acc, def) => {
        if (!acc[def.category]) acc[def.category] = [];
        acc[def.category].push(def);
        return acc;
    }, {} as Record<string, typeof FEATURE_DEFINITIONS>);

    const categories = [
        { id: 'core', label: 'Fonctionnalités Clés', color: 'text-purple-600 bg-purple-50' },
        { id: 'usage', label: 'Limites & Usage', color: 'text-blue-600 bg-blue-50' },
        { id: 'support', label: 'Support & Service', color: 'text-green-600 bg-green-50' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-500 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Retour
                </button>

                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Passez au niveau supérieur
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Devenez Transitaire Partenaire et accédez à toutes les fonctionnalités professionnelles.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        {plans.map((plan) => {
                            const isPro = plan.name.toLowerCase().includes('pro');
                            const isUpgradingThis = upgrading === plan.id;

                            return (
                                <div key={plan.id} className={`bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border ${isPro ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 dark:border-slate-800'} overflow-hidden flex flex-col hover:-translate-y-2 transition-all duration-300 relative`}>
                                    {isPro && (
                                        <div className="bg-blue-600 text-white text-xs font-bold uppercase tracking-widest py-2 text-center">
                                            Recommandé
                                        </div>
                                    )}

                                    <div className="p-8 flex-1">
                                        <div className="mb-6">
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                            <p className="text-slate-500 dark:text-slate-400 mt-2 min-h-[48px]">{plan.description}</p>
                                        </div>

                                        <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex items-baseline">
                                                <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                                    {new Intl.NumberFormat('fr-XO', { style: 'currency', currency: plan.currency, maximumFractionDigits: 0 }).format(plan.price)}
                                                </span>
                                                <span className="text-slate-500 dark:text-slate-400 ml-2 font-medium">
                                                    /{plan.billing_cycle === 'monthly' ? 'mois' : 'an'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            {categories.map(cat => {
                                                const catDefinitions = definitionsByCategory[cat.id];
                                                if (!catDefinitions || catDefinitions.length === 0) return null;

                                                return (
                                                    <div key={cat.id}>
                                                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{cat.label}</h5>
                                                        <div className="space-y-3">
                                                            {catDefinitions.map((def) => {
                                                                const planFeature = plan.features.find(f => f.name === def.name);
                                                                const isIncluded = !!planFeature;
                                                                const value = planFeature?.value;

                                                                return (
                                                                    <div key={def.id} className={`flex items-start gap-3 ${!isIncluded ? 'opacity-40 grayscale' : ''}`}>
                                                                        <div className={`mt-1 ${isIncluded ? 'text-blue-600' : 'text-slate-300'}`}>
                                                                            {isIncluded ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <span className="text-sm font-medium block text-slate-700 dark:text-slate-300">
                                                                                {def.name}
                                                                            </span>
                                                                            {isIncluded && def.type === 'limit' && (
                                                                                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                                                    {value === -1 ? 'Illimité' : `Limite: ${value}`}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => handleUpgrade(plan.id)}
                                            disabled={upgrading !== null}
                                            className={`w-full py-4 px-6 text-center font-bold rounded-xl transition-all shadow-lg flex items-center justify-center ${isPro
                                                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30'
                                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-slate-900/10'
                                                } ${upgrading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isUpgradingThis ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                    Traitement...
                                                </>
                                            ) : (
                                                'Choisir ce plan'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

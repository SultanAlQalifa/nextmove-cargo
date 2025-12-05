import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Check, AlertTriangle } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { subscriptionService } from '../../../services/subscriptionService';
import { SubscriptionPlan, UserSubscription } from '../../../types/subscription';
import PaymentModal from '../../../components/payment/PaymentModal';

export default function ForwarderSubscription() {
    const { user, refreshProfile } = useAuth();

    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [paymentModal, setPaymentModal] = useState<{
        isOpen: boolean;
        plan: SubscriptionPlan | null;
    }>({
        isOpen: false,
        plan: null
    });

    useEffect(() => {
        if (user) {
            fetchSubscriptionData(user.id);
            // Force refresh profile to ensure subscription status is up to date (syncs DB -> LocalStorage -> Context)
            refreshProfile();
        }
    }, [user]);

    const fetchSubscriptionData = async (userId: string) => {
        setLoading(true);
        try {
            const [fetchedPlans, sub] = await Promise.all([
                subscriptionService.getPlans(),
                subscriptionService.getUserSubscription(userId)
            ]);
            setPlans(fetchedPlans);
            setCurrentSubscription(sub);
        } catch (err) {
            console.error('Error fetching subscription data:', err);
            setError('Impossible de charger les informations d\'abonnement.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!user || !paymentModal.plan) return;
        try {
            setSaving(true);
            // 1. Create Subscription
            await subscriptionService.subscribeToPlan(user.id, paymentModal.plan.id);

            // 2. Refresh Data
            await fetchSubscriptionData(user.id);
            await refreshProfile();

            // Force immediate navigation to dashboard if it was blocked
            // Small delay to ensure React context propagates
            setTimeout(() => {
                window.location.href = '/dashboard/forwarder';
            }, 500);

            setSuccessMessage(`Abonnement ${paymentModal.plan.name} activé avec succès !`);
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err: any) {
            console.error('Error subscribing:', err);
            setError(err.message || "Erreur lors de l'activation de l'abonnement");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Abonnement"
                subtitle="Gérez votre plan et vos paiements"
                action={{
                    label: "Gérer les paiements",
                    onClick: () => { }, // Placeholder for future billing portal
                    icon: CreditCard,
                    disabled: true
                }}
            />

            {successMessage && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
                    <CheckCircle className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Plans Disponibles</h3>
                        <p className="text-sm text-gray-500">Choisissez le plan adapté à vos besoins</p>
                    </div>
                    {currentSubscription && (
                        <div className="px-4 py-2 bg-green-50 text-green-700 rounded-xl font-medium text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Plan {currentSubscription.plan?.name} Actif
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const isCurrent = currentSubscription?.plan_id === plan.id;
                            return (
                                <div
                                    key={plan.id}
                                    className={`relative p-6 rounded-2xl border-2 transition-all ${isCurrent
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-100 hover:border-primary/50 hover:shadow-lg'
                                        }`}
                                >
                                    {isCurrent && (
                                        <div className="absolute top-4 right-4 text-primary">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                    )}

                                    <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-3xl font-bold text-gray-900">{plan.price.toLocaleString()}</span>
                                        <span className="text-gray-500">{plan.currency} / {
                                            plan.billing_cycle === 'monthly' ? 'mois' :
                                                plan.billing_cycle === 'quarterly' ? 'trimestre' :
                                                    plan.billing_cycle === 'biannual' ? 'semestre' : 'an'
                                        }</span>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature: any) => (
                                            <li key={feature.id} className="flex items-start gap-3 text-sm text-gray-600">
                                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>{feature.name}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => setPaymentModal({ isOpen: true, plan })}
                                        disabled={isCurrent}
                                        className={`w-full py-3 rounded-xl font-bold transition-all ${isCurrent
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                                            }`}
                                    >
                                        {isCurrent ? 'Plan Actuel' : 'Choisir ce plan'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {paymentModal.plan && (
                <PaymentModal
                    isOpen={paymentModal.isOpen}
                    onClose={() => setPaymentModal({ isOpen: false, plan: null })}
                    onSuccess={handleSubscribe}
                    planName={paymentModal.plan.name}
                    amount={paymentModal.plan.price}
                    currency={paymentModal.plan.currency}
                    allowedMethods={['wave']}
                />
            )}
        </div>
    );
}

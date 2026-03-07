import { useState, useEffect } from "react";
import { CreditCard, CheckCircle, Check, AlertTriangle, Calendar, RefreshCw } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import { useAuth } from "../../../contexts/AuthContext";
import { subscriptionService } from "../../../services/subscriptionService";
import {
  SubscriptionPlan,
  UserSubscription,
} from "../../../types/subscription";
import PaymentModal from "../../../components/payment/PaymentModal";
import confetti from "canvas-confetti";

export default function ForwarderSubscription() {
  const { user, refreshProfile } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    plan: SubscriptionPlan | null;
  }>({
    isOpen: false,
    plan: null,
  });

  useEffect(() => {
    if (user) {
      fetchSubscriptionData(user.id);
      refreshProfile();
    }
  }, [user]);

  const fetchSubscriptionData = async (userId: string) => {
    setLoading(true);
    try {
      const [fetchedPlans, sub] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getUserSubscription(userId),
      ]);
      // Filter for active plans only
      const activePlans = fetchedPlans.filter((p) => p.is_active);
      setPlans(activePlans);
      setCurrentSubscription(sub);

      // Auto-set billing cycle if user has active sub
      if (sub?.plan) {
        if (
          sub.plan.billing_cycle === "monthly" ||
          sub.plan.billing_cycle === "yearly"
        ) {
          setBillingCycle(sub.plan.billing_cycle);
        }
      }
    } catch (err) {
      console.error("Error fetching subscription data:", err);
      setError("Impossible de charger les informations d'abonnement.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user || !paymentModal.plan) return;
    try {
      setSaving(true);
      // Use renewSubscription if there's an existing subscription, subscribeToPlan for new
      if (currentSubscription) {
        await subscriptionService.renewSubscription(user.id, paymentModal.plan.id);
      } else {
        await subscriptionService.subscribeToPlan(user.id, paymentModal.plan.id);
      }
      await fetchSubscriptionData(user.id);
      await refreshProfile();

      setPaymentModal({ isOpen: false, plan: null });

      setSuccessMessage(
        `Abonnement ${paymentModal.plan.name} activé avec succès !`,
      );
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563EB", "#10B981", "#F59E0B"],
      });

      // Force refresh
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'activation");
    } finally {
      setSaving(false);
    }
  };

  // Group plans by name (assuming distinct names for tiers)
  // We expect canonical names: "Starter", "Pro", "Enterprise"
  const getPlanForTier = (tierName: string) => {
    return plans.find(
      (p) =>
        (p.name === tierName || p.name === `${tierName} Annuel`) &&
        p.billing_cycle === billingCycle,
    );
  };

  const tiers = ["Starter", "Pro", "Elite"];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "--";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return { label: "Actif", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" };
      case "past_due": return { label: "Paiement en retard", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" };
      case "cancelled": return { label: "Annulé", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" };
      case "expired": return { label: "Expiré", color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" };
      default: return { label: status, color: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  };

  const isExpiredByDate = currentSubscription?.end_date
    ? new Date(currentSubscription.end_date) < new Date()
    : false;

  const daysRemaining = currentSubscription?.end_date
    ? Math.max(0, Math.ceil((new Date(currentSubscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Effective status: if end_date has passed, treat as expired regardless of DB status
  const effectiveStatus = isExpiredByDate ? 'expired' : (currentSubscription?.status || 'expired');
  const isAutoRenewEnabled = !!currentSubscription?.auto_renew;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Abonnement"
        subtitle="Choisissez le plan adapté à votre croissance"
        action={{
          label: "Gérer les paiements",
          onClick: () => { },
          icon: CreditCard,
          disabled: true,
        }}
      />

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Current Subscription Info Card */}
      {!loading && currentSubscription && currentSubscription.plan && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Plan {currentSubscription.plan.name}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusLabel(effectiveStatus).color}`}>
                    {getStatusLabel(effectiveStatus).label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {new Intl.NumberFormat("fr-XO").format(currentSubscription.plan.price)} {currentSubscription.plan.currency} / {currentSubscription.plan.billing_cycle === "monthly" ? "mois" : "an"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Début</div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatDate(currentSubscription.start_date)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isExpiredByDate ? 'Expiré le' : 'Prochaine échéance'}</div>
                <div className={`text-sm font-bold ${isExpiredByDate ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {formatDate(currentSubscription.end_date)}
                  {!isExpiredByDate && daysRemaining !== null && daysRemaining <= 7 && (
                    <span className="ml-2 text-xs text-amber-600 font-bold">({daysRemaining}j restants)</span>
                  )}
                  {isExpiredByDate && (
                    <span className="ml-2 text-xs text-red-500 font-bold">(dépassée)</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Renouvellement auto</div>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!currentSubscription) return;
                      try {
                        const newVal = !currentSubscription.auto_renew;
                        await subscriptionService.toggleAutoRenew(currentSubscription.id, newVal);
                        setCurrentSubscription({ ...currentSubscription, auto_renew: newVal });
                        setSuccessMessage(newVal ? "Renouvellement automatique activé" : "Renouvellement automatique désactivé");
                        setTimeout(() => setSuccessMessage(""), 3000);
                      } catch {
                        setError("Impossible de modifier le renouvellement");
                        setTimeout(() => setError(""), 3000);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${currentSubscription.auto_renew
                      ? 'bg-primary'
                      : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    role="switch"
                    aria-checked={isAutoRenewEnabled}
                    aria-label="Activer/désactiver le renouvellement automatique"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${currentSubscription.auto_renew ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                  <span className={`text-sm font-bold ${currentSubscription.auto_renew ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                    {currentSubscription.auto_renew ? "Activé" : "Désactivé"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Renewal Button when expired */}
          {isExpiredByDate && currentSubscription.plan && currentSubscription.plan.is_active && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Abonnement expiré</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    {currentSubscription.auto_renew
                      ? "Le renouvellement automatique n'a pas abouti. Procédez au règlement manuellement."
                      : "Le renouvellement automatique est désactivé. Renouvelez manuellement pour continuer."}
                  </p>
                </div>
                <button
                  onClick={() => setPaymentModal({ isOpen: true, plan: currentSubscription.plan! })}
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 whitespace-nowrap disabled:opacity-50"
                >
                  {saving ? "Traitement..." : "Renouveler maintenant"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plan Deactivated Warning */}
      {!loading && currentSubscription && currentSubscription.plan && !currentSubscription.plan.is_active && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-black text-red-800 dark:text-red-300 text-lg">
              Plan « {currentSubscription.plan.name} » désactivé
            </h4>
          </div>
          <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed ml-[52px]">
            Ce plan n'est plus proposé par la plateforme.
            {isExpiredByDate
              ? <> Votre abonnement a expiré le <strong>{formatDate(currentSubscription.end_date)}</strong>. Veuillez souscrire à l'un des plans actifs ci-dessous pour continuer à utiliser la plateforme.</>
              : <> Votre abonnement reste valide jusqu'au <strong>{formatDate(currentSubscription.end_date)}</strong>. Après cette date, vous devrez souscrire à l'un des plans actifs ci-dessous.</>
            }
          </p>
        </div>
      )}

      {/* Toggle Control */}
      {!loading && (
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex relative">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative z-10 ${billingCycle === "monthly"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative z-10 flex items-center gap-2 ${billingCycle === "yearly"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              Annuel
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${billingCycle === "yearly"
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-100 text-emerald-700"
                  }`}
              >
                -20%
              </span>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {tiers.map((tierName) => {
            const plan = getPlanForTier(tierName);
            const isCurrent = currentSubscription?.plan_id === plan?.id;
            const isElite = tierName === "Elite";
            const isPro = tierName === "Pro";

            if (!plan) return null;

            return (
              <div
                key={plan.id}
                className={`relative p-8 rounded-3xl border transition-all duration-300 flex flex-col h-full group ${isCurrent
                  ? "border-primary bg-blue-50/50 shadow-xl shadow-blue-900/5 scale-105 z-10 ring-4 ring-blue-500/20"
                  : isPro
                    ? "border-slate-200 bg-white shadow-xl shadow-slate-200/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-primary/30 z-0"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg"
                  }`}
              >
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Plan Actuel
                  </div>
                )}
                {isElite && !isCurrent && (
                  <div className="absolute top-0 right-0 p-6">
                    <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-100">
                      Populaire
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-slate-500 min-h-[40px] leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8 pb-8 border-b border-gray-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {new Intl.NumberFormat("fr-XO").format(plan.price)}
                    </span>
                    <span className="text-lg font-bold text-slate-400">
                      XOF
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 font-medium mt-2">
                    par {plan.billing_cycle === "monthly" ? "mois" : "an"}
                    {plan.billing_cycle === "yearly" && (
                      <span className="ml-2 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                        2 mois offerts
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature: any, index: number) => (
                    <li
                      key={feature.id || index}
                      className="flex items-start gap-3 text-sm text-slate-600 group/feature"
                    >
                      <div className="mt-0.5 p-0.5 rounded-full bg-blue-50 text-blue-600 group-hover/feature:bg-blue-600 group-hover/feature:text-white transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="leading-relaxed font-medium">
                        {typeof feature === "string" ? feature : feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setPaymentModal({ isOpen: true, plan })}
                  disabled={isCurrent || saving}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 transform active:scale-95 ${isCurrent
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : saving
                      ? "bg-primary/70 text-white cursor-wait"
                      : "bg-primary text-white hover:bg-blue-800 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                    }`}
                >
                  {isCurrent ? "Votre Plan" : saving ? "Traitement..." : "Choisir " + plan.name}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {paymentModal.plan && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal({ isOpen: false, plan: null })}
          onSuccess={handleSubscribe}
          planName={paymentModal.plan.name}
          amount={paymentModal.plan.price}
          currency={paymentModal.plan.currency}
          allowedMethods={["wave", "wallet", "cinetpay", "paytech"]}
        />
      )}
    </div>
  );
}

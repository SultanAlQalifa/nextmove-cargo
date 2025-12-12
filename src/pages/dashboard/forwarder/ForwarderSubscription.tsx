import { useState, useEffect } from "react";
import { CreditCard, CheckCircle, Check, AlertTriangle } from "lucide-react";
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
      await subscriptionService.subscribeToPlan(user.id, paymentModal.plan.id);
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
      (p) => p.name === tierName && p.billing_cycle === billingCycle,
    );
  };

  const tiers = ["Starter", "Pro", "Enterprise"];

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
            const isEnterprise = tierName === "Enterprise";
            const isPro = tierName === "Pro";

            if (!plan) return null; // Should ideally show a placeholder or handle missing plan

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
                {/* Badges */}
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Plan Actuel
                  </div>
                )}
                {isEnterprise && !isCurrent && (
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
                      <span className="leading-relaxed">
                        {feature.value ? (
                          <>
                            <span className="font-bold text-slate-900">
                              {feature.value}
                            </span>{" "}
                            {feature.name.replace(
                              String(feature.value),
                              "",
                            )}{" "}
                            {/* Heuristic cleanup */}
                          </>
                        ) : (
                          feature.name
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setPaymentModal({ isOpen: true, plan })}
                  disabled={isCurrent}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 transform active:scale-95 ${isCurrent
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-blue-800 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                    }`}
                >
                  {isCurrent ? "Votre Plan" : "Choisir " + plan.name}
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
          allowedMethods={["wave", "wallet"]}
        />
      )}
    </div>
  );
}


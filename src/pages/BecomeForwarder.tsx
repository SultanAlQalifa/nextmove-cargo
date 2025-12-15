import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Shield,
  Globe,
  TrendingUp,
  Truck,
  Zap,
  Hash,
  Layers,
  CheckCircle,
  ArrowRight,
  X,
  Star,
  FileText,
  PenTool,
} from "lucide-react";
import { subscriptionService } from "../services/subscriptionService";
import { emailService } from "../services/emailService";
import { SubscriptionPlan } from "../types/subscription";
import { FEATURE_DEFINITIONS } from "../constants/subscriptionFeatures";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (email: string, name: string) => void;
}

function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consented || !name || !email) return;

    setSubmitting(true);
    try {
      await onAccept(email, name);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Devenir Partenaire Transitaire
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Fermer"
              title="Fermer"
            >
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            <p className="lead text-lg text-slate-600 dark:text-slate-300">
              En rejoignant le réseau NextMove Cargo, vous vous engagez à
              fournir un service d'excellence. Veuillez lire attentivement les
              conditions ci-dessous.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 not-prose space-y-4 my-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Engagements & Responsabilités
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Je certifie posséder les documents requis (registre de
                    commerce, NINEA, carte import-export, carte commerçant,
                    entrepôt local, visa Chine/Dubaï valide ou tout autre pays
                    d'exercice).
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Je certifie posséder les documents requis (registre de
                    commerce, NINEA, carte import-export, carte commerçant,
                    entrepôt local, visa Chine/Dubaï valide ou tout autre pays
                    d'exercice).
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Je m'engage à respecter les délais annoncés et à communiquer
                    proactivement avec les clients.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    J'accepte que NextMove Cargo vérifie mes documents et
                    suspende mon compte en cas de non-conformité.
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Un contrat détaillé vous sera envoyé par email après validation de
              ce formulaire.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 border-t border-slate-100 dark:border-slate-800 pt-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nom Complet (Signature)
                </label>
                <div className="relative">
                  <PenTool className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Votre nom légal"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Email Professionnel
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="contact@transport.com"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors">
              <input
                type="checkbox"
                required
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Je reconnais avoir lu et accepté les conditions ci-dessus. Je
                consens à la signature électronique de cet engagement.
              </span>
            </label>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!consented || !name || !email || submitting}
                className="flex-1 px-6 py-3 font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-95"
              >
                {submitting ? "Traitement..." : "Accepter et Continuer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BecomeForwarder() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await subscriptionService.getPlans();
        const activePlans = data.filter((p) => p.is_active);
        setPlans(activePlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleAcceptTerms = async (email: string, name: string) => {
    try {
      // Send contract email
      await emailService.sendForwarderContractEmail(email, name);

      // Navigate to register with pre-filled data
      navigate(`/register?role=forwarder&email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error("Error sending contract:", error);
      // Still navigate even if email fails, to not block the user
      navigate(`/register?role=forwarder&email=${encodeURIComponent(email)}`);
    }
  };

  // Helper to group all definitions by category
  const definitionsByCategory = FEATURE_DEFINITIONS.reduce(
    (acc, def) => {
      if (!acc[def.category]) acc[def.category] = [];
      acc[def.category].push(def);
      return acc;
    },
    {} as Record<string, typeof FEATURE_DEFINITIONS>,
  );

  const categories = [
    {
      id: "core",
      label: "Fonctionnalités Clés",
      icon: Zap,
      color: "text-purple-600 bg-purple-50",
    },
    {
      id: "usage",
      label: "Limites & Usage",
      icon: Hash,
      color: "text-blue-600 bg-blue-50",
    },
    {
      id: "support",
      label: "Support & Service",
      icon: Shield,
      color: "text-green-600 bg-green-50",
    },
    {
      id: "integration",
      label: "Intégrations",
      icon: Layers,
      color: "text-orange-600 bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TermsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccept={handleAcceptTerms}
      />

      {/* Hero Section */}
      <div className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
            alt="Logistics Professional"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/40" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium text-blue-100 tracking-wide uppercase">
              Rejoignez le réseau leader
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight tracking-tight max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Développez votre activité avec{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              NextMove Cargo
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Rejoignez notre réseau de transitaires certifiés. Accédez à des
            milliers de demandes de cotation, gérez vos expéditions et
            simplifiez votre facturation.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/30 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 hover:-translate-y-1"
            >
              Devenir Partenaire <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#plans"
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 backdrop-blur-sm transition-all flex items-center justify-center hover:-translate-y-1"
            >
              Voir les offres
            </a>
          </div>
        </div>
      </div>

      {/* Stats / Trust Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                500+
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Transitaires Actifs
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                10k+
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Expéditions / Mois
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                98%
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Satisfaction Client
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                24/7
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Support Dédié
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-slate-50 dark:bg-gray-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-4">
              Avantages
            </h2>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Pourquoi nous rejoindre ?
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light">
              Des outils puissants conçus pour les professionnels de la
              logistique moderne.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:-translate-y-2 transition-all duration-300">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Visibilité Mondiale
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                Touchez des clients internationaux et développez votre présence
                sur de nouveaux marchés sans effort marketing supplémentaire.
              </p>
            </div>
            <div className="group bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:-translate-y-2 transition-all duration-300">
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Plus de Business
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                Recevez des demandes de cotation (RFQ) qualifiées directement
                sur votre tableau de bord et répondez-y en quelques clics.
              </p>
            </div>
            <div className="group bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:-translate-y-2 transition-all duration-300">
              <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Truck className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Gestion Simplifiée
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                Un outil tout-en-un pour gérer vos expéditions, votre tracking,
                vos documents et votre facturation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions Section */}
      <div className="py-24 bg-white dark:bg-gray-900 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 dark:bg-gray-800/30 rounded-[3rem] p-8 md:p-16 border border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                  Conditions d'Éligibilité
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  Nous maintenons un standard de qualité élevé pour garantir la
                  confiance de nos clients.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-6 group">
                  <div className="p-4 bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-2">
                      Documents Requis
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Vous devez posséder les documents requis (registre de
                      commerce, NINEA, carte import-export, carte commerçant,
                      entrepôt local, visa Chine/Dubaï valide ou tout autre pays
                      d'exercice).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group">
                  <div className="p-4 bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-2">
                      Assurance Responsabilité Civile
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Une assurance RC Pro couvrant vos activités de transport
                      est fortement recommandée.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group">
                  <div className="p-4 bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-2">
                      Qualité de Service
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Engagement à respecter nos standards de qualité et de
                      réactivité envers les clients.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full lg:w-auto bg-white dark:bg-gray-900 rounded-[2.5rem] p-12 text-center shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 relative z-10">
                Prêt à commencer ?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg relative z-10">
                L'inscription est rapide. Une fois vos documents vérifiés, vous
                pourrez commencer à recevoir des demandes.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all transform hover:-translate-y-1 shadow-lg relative z-10 w-full sm:w-auto"
              >
                Créer mon compte partenaire <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
                potext-slate-500 dark:text-slate-400">
      Choisissez le plan adapté à la taille de votre entreprise
    </p>
          </div >

  {
    loading?(
            <div className = "flex justify-center py-24" >
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
          ) : (
    <>
      {/* Billing Toggle Switch */}
      <div className="flex justify-center mb-16">
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl inline-flex relative shadow-inner">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`relative z-10 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${billingCycle === "monthly"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-none"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`relative z-10 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${billingCycle === "yearly"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-none"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            Annuel
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[10px] font-extrabold uppercase tracking-wide">
              -20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {plans
          .filter((p) => p.billing_cycle === billingCycle)
          .map((plan) => {
            const isPro = plan.name.toLowerCase().includes("pro");
            return (
              <div
                key={plan.id}
                className={`bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border ${isPro ? "border-blue-500 ring-4 ring-blue-500/10" : "border-slate-100 dark:border-slate-800"} overflow-hidden flex flex-col hover:-translate-y-2 transition-all duration-300 relative group`}
              >
                {/* Popular Badge Logic */}
                {isPro && (
                  <div className="bg-blue-600 text-white text-xs font-bold uppercase tracking-widest py-2 text-center">
                    Recommandé
                  </div>
                )}

                <div className="p-10 flex-1">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-3 min-h-[48px] text-lg leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {new Intl.NumberFormat("fr-XO", {
                          style: "currency",
                          currency: plan.currency,
                          maximumFractionDigits: 0,
                        }).format(plan.price)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2 font-medium text-lg">
                        /{plan.billing_cycle === "monthly" ? "mois" : "an"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {categories.map((cat) => {
                      const catDefinitions = definitionsByCategory[cat.id];
                      if (!catDefinitions || catDefinitions.length === 0)
                        return null;

                      return (
                        <div key={cat.id}>
                          <div className="flex items-center gap-3 mb-5">
                            <div
                              className={`p-2 rounded-xl ${cat.color} bg-opacity-10`}
                            >
                              <cat.icon className="w-4 h-4" />
                            </div>
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              {cat.label}
                            </h5>
                          </div>
                          <div className="space-y-4">
                            {catDefinitions.map((def) => {
                              const planFeature = plan.features.find(
                                (f) => f.name === def.name,
                              );
                              const isIncluded = !!planFeature;
                              const value = planFeature?.value;

                              if (!isIncluded) return null;

                              return (
                                <div
                                  key={def.id}
                                  className="flex items-start gap-3"
                                >
                                  <div
                                    className={`mt-1 ${def.type === "limit" ? "text-blue-600" : "text-green-500"}`}
                                  >
                                    {def.type === "limit" ? (
                                      <Hash className="w-5 h-5" />
                                    ) : (
                                      <Check className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-base font-medium block text-slate-700 dark:text-slate-300">
                                      {def.name}
                                    </span>
                                    {def.type === "limit" && (
                                      <span className="text-xs text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full mt-2 inline-block">
                                        {value === -1
                                          ? "Illimité"
                                          : `Limite: ${value}`}
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

                <div className="p-10 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={`block w-full py-5 px-6 text-center font-bold rounded-2xl transition-all shadow-lg transform group-hover:-translate-y-1 ${isPro
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30"
                      : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-slate-900/10"
                      }`}
                  >
                    Choisir ce plan
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div >
    </>
  );
}

export default BecomeForwarder;

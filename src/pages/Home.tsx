import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Globe,
  CheckCircle,
  Star,
  Package,
  Truck,
  ChevronRight,
  Play,
  FileText,
  Box,
  CreditCard,
  Ship,
  Users
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // SEO Update
  useEffect(() => {
    document.title = "NextMove Cargo - La Logistique de Confiance en Afrique";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "NextMove Cargo simplifie vos imports-exports de bout en bout. Création de compte gratuite, paiements sécurisés et suivi en temps réel.");
    }
  }, []);

  const slides = [
    {
      title: "La Logistique Sans Frontières.",
      subtitle: "Simplifiez vos imports-exports avec une expertise logistique de pointe, du point de départ jusqu'à votre porte.",
      badge: "Multimodal",
    },
    {
      title: "Paiements 100% Sécurisés.",
      subtitle: "Notre système Escrow garantit que les prestataires ne sont payés qu'une fois la marchandise confirmée livrée.",
      badge: "Confiance",
    },
    {
      title: "La Route de la Soie Digitale.",
      subtitle: "Gérez vos expéditions depuis la Chine, l'Europe et l'Amérique directement vers l'Afrique sur une seule plateforme.",
      badge: "Global",
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 font-sans selection:bg-orange-500 selection:text-white">

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center overflow-hidden bg-slate-900">
        {/* Abstract Backgrounds */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black"></div>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          {/* Glowing orb */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <div className="space-y-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest backdrop-blur-sm"
              >
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                Lancement Officiel 2026
              </motion.div>

              <div className="min-h-[220px]">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
                    {slides[currentSlide].title.split(" ").map((word, i) => (
                      <span key={i} className={i === 1 || i === 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600" : ""}>
                        {word}{" "}
                      </span>
                    ))}
                  </h1>
                  <p className="text-xl text-slate-400 leading-relaxed font-light max-w-lg">
                    {slides[currentSlide].subtitle}
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-5"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all hover:-translate-y-1"
                >
                  Créer un compte gratuit <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm transition-all hover:-translate-y-1"
                >
                  <Play className="mr-2 w-5 h-5 fill-current" /> Demander une démo
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <div className="pt-8 flex items-center gap-8 border-t border-white/10">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                      U{i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-400 font-medium">
                  Rejoint par plus de <span className="text-white font-bold">129+ entreprises</span>
                </div>
              </div>
            </div>

            {/* Right Visual Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:block relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-[3rem] blur-3xl transform rotate-3 scale-105"></div>
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
                alt="Cargo Global"
                className="relative z-10 w-full rounded-[2rem] border border-white/10 shadow-2xl object-cover h-[600px] brightness-75 contrast-125"
              />

              {/* Floating Badge */}
              <div className="absolute top-10 -left-10 z-20 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-white font-bold">Paiement Garanti</div>
                    <div className="text-orange-400 text-sm">Escrow Sécurisé</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 -right-10 z-20 bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-[85%] h-full bg-orange-500 rounded-full"></div>
                    </div>
                    <div className="text-slate-400 text-xs uppercase tracking-widest font-bold mt-1">Colis Livré</div>
                  </div>
                </div>
              </div>

            </motion.div>

          </div>
        </div>

        {/* Curvy bottom transition */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-30 transform translate-y-[1px]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-12 lg:h-24 filter drop-shadow-sm">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C52.16,112.92,106.67,119.5,159.2,118.91C221.73,118.23,277.9,103.54,321.39,56.44Z" className="fill-slate-50 dark:fill-slate-950"></path>
          </svg>
        </div>
      </div>

      {/* Key Figures Section */}
      <div className="py-20 relative z-40 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {[
              { label: "Utilisateurs Actifs", value: "129+", icon: Users },
              { label: "Pays Couverts", value: "4", icon: Globe },
              { label: "Expéditions en Transit", value: "12,482", icon: Package },
              { label: "Taux de Réussite", value: "99.8%", icon: Star },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center p-6 lg:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-1 transition-transform"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-500 flex items-center justify-center mb-4">
                  <stat.icon size={24} />
                </div>
                <div className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-medium text-sm lg:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Us Section (Avantages) */}
      <div className="py-32 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-orange-600 font-bold uppercase tracking-widest text-sm mb-4">Pourquoi NextMove Cargo ?</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6">Un écosystème conçu pour votre sécurité.</h3>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-light">
              Fini les incertitudes et les paiements risqués. Notre technologie garantit une confiance absolue entre clients et prestataires de fret.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                title: "Paiement Escrow Sécurisé",
                desc: "Votre argent est bloqué en sécurité. Le prestataire n'est payé que lorsque vous confirmez la bonne réception de la marchandise.",
                icon: ShieldCheck,
                color: "text-emerald-500",
                bg: "bg-emerald-50 dark:bg-emerald-950"
              },
              {
                title: "Prestataires Certifiés KYC",
                desc: "Chaque transitaire est rigoureusement vérifié (CNI, RCCM, Fiscalité). Seuls les professionnels certifiés accèdent au marché.",
                icon: CheckCircle,
                color: "text-blue-500",
                bg: "bg-blue-50 dark:bg-blue-950"
              },
              {
                title: "Suivi Multimodal en Direct",
                desc: "Aérien, maritime ou terrestre. Suivez vos colis en temps réel depuis l'entrepôt en Asie/Europe jusqu'à votre livraison en Afrique.",
                icon: Truck,
                color: "text-orange-500",
                bg: "bg-orange-50 dark:bg-orange-950"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 hover:border-orange-500/30 transition-colors group"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${feature.bg} ${feature.color}`}>
                  <feature.icon size={32} />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{feature.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light text-lg">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-32 bg-slate-950 relative overflow-hidden">
        {/* BG elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-4">Le Processus</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-white mb-6">Comment ça marche ?</h3>
            <p className="text-xl text-slate-400 font-light">3 étapes simples pour transformer vos opérations logistiques.</p>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-[60px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-orange-500/20 via-orange-500 to-orange-500/20"></div>

            <div className="grid lg:grid-cols-3 gap-16 lg:gap-8">
              {[
                {
                  step: "01",
                  title: "Créez votre demande (RFQ)",
                  desc: "Indiquez les dimensions, le poids et la destination de votre fret. Les prestataires recevront une alerte instantanée.",
                  icon: FileText
                },
                {
                  step: "02",
                  title: "Comparez & Payez",
                  desc: "Recevez les offres sous 24h. Choisissez le meilleur rapport délai/prix et effectuez un paiement Escrow via Wave, CinetPay ou Virement.",
                  icon: CreditCard
                },
                {
                  step: "03",
                  title: "Acceptez la livraison",
                  desc: "Le prestataire met à jour la progression et dépose l'avis de livraison. Confirmez pour libérer les fonds en toute sécurité.",
                  icon: Box
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="relative text-center"
                >
                  <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-slate-900 border-4 border-slate-800 mb-8 z-10 shadow-2xl">
                    <div className="absolute inset-0 rounded-full border border-orange-500/50 m-2 animate-spin-slow"></div>
                    <item.icon className="w-10 h-10 text-orange-500" />
                    <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-orange-600 border-4 border-slate-950 flex items-center justify-center text-white font-black">
                      {item.step}
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-4">{item.title}</h4>
                  <p className="text-slate-400 font-light leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-32 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6">Ce que disent nos clients</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                text: "Depuis que nous utilisons NextMove, nos importations de Chine vers le Sénégal sont devenues fluides. Le système escrow nous a sauvé de deux litiges.",
                name: "Amadou Diallo",
                company: "Africa Trade",
                role: "Directeur Achats"
              },
              {
                text: "En tant que transitaire, la plateforme m'a permis d'acquérir 15 nouveaux clients B2B le premier mois. Les paiements Wave intégrés sont un pur bonheur.",
                name: "Sarah Kone",
                company: "Kone Logistics",
                role: "Gérante"
              },
              {
                text: "Une transparence totale sur toute la chaîne logistique. La vérification KYC de chaque prestataire me permet de dormir sur mes deux oreilles.",
                name: "Jean Dupont",
                company: "Global Motors",
                role: "CEO"
              }
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2rem] bg-white dark:bg-slate-950 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-5 h-5 text-orange-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 italic mb-8">"{review.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{review.name}</div>
                    <div className="text-sm text-slate-500">{review.role}, {review.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing CTA */}
      <div className="py-32 relative overflow-hidden bg-orange-600">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-8">
            Rejoignez le Futur du Fret
          </h2>
          <p className="text-xl text-orange-100 mb-12 font-light">
            Inscrivez-vous gratuitement en tant que Client ou découvrez nos abonnements Prestataires pros et boostez vos expéditions.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/register"
              className="px-10 py-5 text-lg font-bold rounded-xl text-orange-600 bg-white hover:bg-slate-50 shadow-2xl transition-transform hover:-translate-y-1"
            >
              Ouvrir un compte Gratuit
            </Link>
            <Link
              to="/founder-pack/payment"
              className="px-10 py-5 text-lg font-bold rounded-xl text-white border-2 border-white/30 hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              Voir le Pack Fondateur
            </Link>
          </div>
          <p className="mt-8 text-orange-200 text-sm font-light">
            *Les offres Founder Premium sont limitées.
          </p>
        </div>
      </div>

    </div>
  );
}

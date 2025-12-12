import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Globe,
  Clock,
  CheckCircle,
  Star,
  Package,
  Truck,
  Anchor,
  ChevronRight,
  Play,
  Plane,
  Ship,
  FileText,
  Box,
  Home as HomeIcon,
} from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";
import { formatLargeNumber } from "../utils/currencyFormatter";
import { useBranding } from "../contexts/BrandingContext";
import MarketplaceShowcase from "../components/home/MarketplaceShowcase";
import CEOSection from "../components/home/CEOSection";
import FounderPackModal from "../components/marketing/FounderPackModal";

import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { settings: branding, loading } = useBranding();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect removed to allow access to Landing Page via Logo
  // useEffect(() => {
  //     if (!authLoading && user) {
  //         navigate('/dashboard');
  //     }
  // }, [user, authLoading, navigate]);

  if (loading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      title: branding.features.escrow_title,
      desc: branding.features.escrow_desc,
      icon: ShieldCheck,
      classes:
        "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
    },
    {
      title: branding.features.multimodal_title,
      desc: branding.features.multimodal_desc,
      icon: Package,
      classes:
        "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white",
    },
    {
      title: branding.features.tracking_title,
      desc: branding.features.tracking_desc,
      icon: Truck,
      classes:
        "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white",
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-gray-950 transition-colors duration-300 font-sans">
      <FounderPackModal />
      {/* Pro & Soft Hero Section */}
      <div className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background Image with Soft Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop"
            alt="Logistics Hero"
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/40" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Hero Content */}
            <div className="space-y-10">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
                <span className="text-sm font-medium text-blue-100 tracking-wide uppercase">
                  Leader en Logistique Digitale
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                {branding.hero.title.split(" ").map((word, i) => (
                  <span
                    key={i}
                    className={
                      i === 1
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300"
                        : ""
                    }
                  >
                    {word}{" "}
                  </span>
                ))}
              </h1>

              <p className="text-xl text-slate-300 max-w-xl leading-relaxed font-light">
                {branding.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-5">
                <Link
                  to="/calculator"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-2xl text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:-translate-y-0.5"
                >
                  {branding.hero.cta1}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-2xl text-white border border-white/20 hover:bg-white/10 backdrop-blur-sm transition-all hover:-translate-y-0.5"
                >
                  {branding.hero.cta2}
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-8 border-t border-white/10">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-white font-bold ring-2 ring-slate-900"
                    >
                      {i}k
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-white font-bold text-lg">
                    10k+ Clients
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                    <span className="text-slate-400 ml-1">4.9/5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Glass Tracking Card */}
            <div className="hidden lg:block relative perspective-1000">
              {/* Floating Icons */}
              <div className="absolute -top-12 -right-12 p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 animate-bounce duration-[3000ms]">
                <Plane className="w-8 h-8 text-blue-400" />
              </div>
              <div className="absolute -bottom-8 -left-8 p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 animate-bounce duration-[4000ms]">
                <Ship className="w-8 h-8 text-cyan-400" />
              </div>

              <div className="relative z-10 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl transform rotate-y-12 hover:rotate-y-0 transition-all duration-700">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <div className="text-sm text-slate-400 font-medium mb-1">
                      Statut de l'envoi
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight">
                      En Transit
                    </div>
                  </div>
                  <div className="p-4 bg-blue-500/20 text-blue-400 rounded-2xl">
                    <Truck size={28} />
                  </div>
                </div>

                <div className="space-y-10 relative pl-4">
                  {/* Timeline Line */}
                  <div className="absolute left-[27px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500 via-blue-500/50 to-slate-700"></div>

                  <div className="relative flex gap-6 items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-500 ring-4 ring-blue-500/20 z-10 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                    <div>
                      <div className="text-white font-bold text-lg">
                        Colis Réceptionné
                      </div>
                      <div className="text-sm text-slate-400">
                        Guangzhou, Chine • 09:00 AM
                      </div>
                    </div>
                  </div>

                  <div className="relative flex gap-6 items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-blue-500 z-10"></div>
                    <div>
                      <div className="text-white font-bold text-lg">
                        Départ Navire
                      </div>
                      <div className="text-sm text-slate-400">
                        Port de Shenzhen • En cours
                      </div>
                    </div>
                  </div>

                  <div className="relative flex gap-6 items-center opacity-50">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-600 z-10"></div>
                    <div>
                      <div className="text-white font-bold text-lg">
                        Arrivée Prévue
                      </div>
                      <div className="text-sm text-slate-400">
                        Dakar, Sénégal • 15 Nov
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center">
                  <div className="text-sm text-slate-400">
                    Tracking ID:{" "}
                    <span className="text-white font-mono font-medium ml-2">
                      NMC-882910
                    </span>
                  </div>
                  <button className="text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors flex items-center gap-1">
                    Voir détails <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Clean & Minimal */}
      <div className="bg-white dark:bg-gray-900 py-16 border-b border-gray-100 dark:border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: branding.stats.shipments, value: "10k+", icon: Package },
              {
                label: branding.stats.value,
                value: formatLargeNumber(50000000, currency) + "+",
                icon: Globe,
              },
              { label: branding.stats.forwarders, value: "500+", icon: Truck },
              {
                label: branding.stats.success,
                value: "99.9%",
                icon: CheckCircle,
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
              >
                <div className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors transform group-hover:scale-110 duration-300 inline-block">
                  {stat.value}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                  <stat.icon size={16} className="text-blue-500" /> {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CEO's Word Section */}
      <CEOSection />

      {/* Marketplace Showcase Section */}
      <MarketplaceShowcase />

      {/* Features Section - Soft Cards */}
      <div className="py-32 bg-slate-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-sm mb-4">
              {branding.features.title}
            </h2>
            <p className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
              {branding.features.subtitle}
            </p>
            <p className="max-w-2xl text-xl text-slate-500 dark:text-slate-400 mx-auto leading-relaxed font-light">
              {branding.features.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-10 bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl shadow-blue-500/5 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 border border-slate-100 dark:border-gray-800 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-800/50 rounded-bl-[100px] -mr-10 -mt-10 transition-all group-hover:scale-150 duration-700"></div>

                <div
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-10 transition-all duration-500 ${feature.classes} relative z-10`}
                >
                  <feature.icon className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 relative z-10">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg mb-8 relative z-10">
                  {feature.desc}
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-2 transition-transform duration-300 cursor-pointer relative z-10">
                  En savoir plus <ArrowRight className="ml-2 w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave Payment Highlight Section - Refined */}
      <div className="py-32 bg-sky-50/50 dark:bg-slate-900/50 border-y border-sky-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-100/40 dark:bg-sky-900/10 rounded-full blur-[120px] -mr-60 -mt-60 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-24 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-bold text-sm mb-8">
                <ShieldCheck className="w-4 h-4" /> Recommandé pour l'Afrique
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-8 leading-tight tracking-tight">
                Payez avec <span className="text-[#1DA1F2]">Wave</span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed font-light">
                NextMove Cargo intègre Wave pour offrir une expérience de
                paiement fluide, sécurisée et adaptée aux besoins des
                entreprises africaines.
              </p>

              <div className="space-y-8 mb-12">
                {[
                  {
                    title: "Transactions Instantanées",
                    desc: "Vos paiements sont validés en temps réel.",
                  },
                  {
                    title: "Frais Réduits (1%)",
                    desc: "Profitez des frais les plus bas du marché.",
                  },
                  {
                    title: "Sécurité Maximale",
                    desc: "Vos fonds sont protégés par les standards bancaires.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-5">
                    <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 mt-1">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-1">
                        {item.title}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-2xl text-white bg-[#1DA1F2] hover:bg-[#1a91da] shadow-xl shadow-[#1DA1F2]/20 transition-all transform hover:scale-105"
              >
                Commencer maintenant
              </Link>
            </div>

            <div className="relative group perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#1DA1F2]/20 to-transparent rounded-[3rem] transform rotate-6 scale-95 group-hover:rotate-3 transition-transform duration-700"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl p-12 border border-slate-100 dark:border-slate-700 transform transition-transform duration-500 hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-12 border-b border-slate-100 dark:border-slate-700 pb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-[#1DA1F2] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#1DA1F2]/30 overflow-hidden">
                      <img
                        src="/assets/wave-icon.png"
                        alt="Wave"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-2xl">
                        Wave Money
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Paiement Sécurisé
                      </div>
                    </div>
                  </div>
                  <div className="text-[#1DA1F2] font-bold bg-[#1DA1F2]/10 px-4 py-2 rounded-full">
                    1% Frais
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Montant
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-3xl">
                      500.000 FCFA
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Destinataire
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-lg">
                      NextMove Cargo
                    </span>
                  </div>

                  <div className="py-4">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 mb-4 overflow-hidden">
                      <div className="bg-[#1DA1F2] h-full rounded-full w-3/4 animate-[shimmer_2s_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)]"></div>
                    </div>
                    <div className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Validation sécurisée en cours...
                    </div>
                  </div>

                  <button className="w-full py-6 bg-[#1DA1F2] text-white rounded-3xl font-bold text-xl shadow-xl shadow-[#1DA1F2]/20 hover:shadow-[#1DA1F2]/40 transition-all hover:-translate-y-1">
                    Confirmer le paiement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section - Minimal Steps */}
      <div className="py-32 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-sm mb-4">
              {branding.howItWorks.title}
            </h2>
            <p className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
              {branding.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-24 left-0 w-full h-1 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 -z-10"></div>

            {[
              {
                step: 1,
                title: branding.howItWorks.step1_title,
                desc: branding.howItWorks.step1_desc,
                icon: FileText,
              },
              {
                step: 2,
                title: branding.howItWorks.step2_title,
                desc: branding.howItWorks.step2_desc,
                icon: Box,
              },
              {
                step: 3,
                title: branding.howItWorks.step3_title,
                desc: branding.howItWorks.step3_desc,
                icon: Ship,
              },
              {
                step: 4,
                title: branding.howItWorks.step4_title,
                desc: branding.howItWorks.step4_desc,
                icon: HomeIcon,
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center group relative p-4">
                <div className="w-48 h-48 mx-auto mb-8 relative">
                  <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-2xl shadow-blue-900/5 dark:shadow-none z-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <item.icon className="w-16 h-16 text-slate-300 group-hover:text-blue-500 transition-colors duration-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl border-4 border-white dark:border-gray-900 z-20 shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  {item.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section - Clean Cards */}
      <div className="py-32 bg-slate-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white text-center mb-24">
            {branding.testimonials.title}
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                text: branding.testimonials.review1_text,
                name: branding.testimonials.review1_name,
                role: branding.testimonials.review1_role,
                initial: "A",
              },
              {
                text: branding.testimonials.review2_text,
                name: branding.testimonials.review2_name,
                role: branding.testimonials.review2_role,
                initial: "S",
              },
              {
                text: branding.testimonials.review3_text,
                name: branding.testimonials.review3_name,
                role: branding.testimonials.review3_role,
                initial: "W",
              },
            ].map((review, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative group hover:-translate-y-2 transition-transform duration-500"
              >
                <div className="absolute top-10 right-10 text-slate-100 dark:text-slate-800 text-9xl font-serif opacity-50 group-hover:scale-110 transition-transform duration-500">
                  "
                </div>
                <div className="flex gap-1 mb-8">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-10 italic text-lg leading-relaxed relative z-10 font-light">
                  "{review.text}"
                </p>
                <div className="flex items-center gap-5 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30">
                    {review.initial}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                      {review.name}
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {review.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section - Gradient & Impact */}

      <div className="relative py-40 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 dark:bg-black">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-black/90"></div>
          <div className="absolute -top-1/2 -right-1/2 w-[1000px] h-[1000px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        </div>
        <div className="relative max-w-5xl mx-auto text-center px-4">
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight tracking-tight">
            {branding.cta.title}
          </h2>
          <p className="text-2xl text-blue-100 mb-16 max-w-3xl mx-auto font-light">
            {branding.cta.subtitle}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-12 py-6 text-xl font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-500 transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_rgba(37,99,235,0.7)] border border-blue-400/30"
          >
            {branding.cta.button}
            <ChevronRight className="ml-2 h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}

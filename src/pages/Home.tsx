import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CanBanner from "../components/common/CanBanner";
import {
  ArrowRight,
  ShieldCheck,
  Globe,
  CheckCircle,
  Star,
  Package,
  Truck,
  ChevronRight,
  Plane,
  Ship,
  FileText,
  Box,
  Home as HomeIcon,
  Smartphone,
  Plus,
  Minus,
} from "lucide-react";
import { formatLargeNumber } from "../utils/currencyFormatter";
import { useCurrency } from "../contexts/CurrencyContext";
import { useBranding } from "../contexts/BrandingContext";
import { testimonialService, Testimonial } from "../services/testimonialService";
import { faqService, FAQ } from "../services/faqService";
import MarketplaceShowcase from "../components/home/MarketplaceShowcase";
import CEOSection from "../components/home/CEOSection";
import EcommerceAcademy from "../components/home/EcommerceAcademy";
import FounderPackModal from "../components/marketing/FounderPackModal";

import { motion, AnimatePresence } from "framer-motion";
import InstallGuideModal from "../components/common/InstallGuideModal";

export default function Home() {
  const { currency } = useCurrency();
  const { settings: branding, loading } = useBranding();

  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const slides = [
    {
      title: "Le Hub Mondial du Fret Maritime & Aérien.",
      subtitle: "Simplifiez vos imports-exports entre la Chine et l'Afrique avec une expertise logistique de pointe.",
      badge: "Multimodal",
    },
    {
      title: "L'Infrastructure Digitale du Commerce Africain.",
      subtitle: "Gérez vos expéditions, sécurisez vos paiements et accélérez votre business avec une solution tout-en-un.",
      badge: "Technologie",
    },
    {
      title: "Connectez votre Business au Monde Entier.",
      subtitle: "Une passerelle logistique premium pour importer en toute sérénité depuis tous les continents.",
      badge: "Expansion",
    },
    {
      title: branding?.hero?.title || "La Logistique Sans Frontières",
      subtitle: branding?.hero?.subtitle || "Maritime, Aérien, Routier : Votre partenaire stratégique en Afrique.",
      badge: "Premium",
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    // ... existing content loading logic ...
    const loadDynamicContent = async () => {
      try {
        const [testimonialsData, faqsData] = await Promise.all([
          testimonialService.getActive(),
          faqService.getActive(),
        ]);
        setTestimonials(testimonialsData);
        setFaqs(faqsData);
      } catch (error) {
        console.error("Error loading dynamic content:", error);
      }
    };
    loadDynamicContent();
  }, []);

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
      <div className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image with High-End Overlay */}
        <div className="absolute inset-0 z-0 bg-slate-950">
          <img
            src="/assets/hero-nexus.png"
            alt="Logistics Nexus - Sea & Air Synergy"
            className="w-full h-full object-cover object-right opacity-80 dark:opacity-60 transition-opacity duration-1000"
          />
          {/* Deep desaturated blue/slate gradients for corporate authority and readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-32">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Hero Content */}
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border-white/10 group cursor-default"
              >
                <div className="flex h-2.5 w-2.5 relative">
                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></div>
                  <div className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></div>
                </div>
                <span className="text-xs font-bold text-blue-100 tracking-[0.2em] uppercase">
                  L'Infrastructure du Futur
                </span>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition-transform" />
              </motion.div>

              <div className="min-h-[280px] flex flex-col justify-start">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    exit={{ opacity: 0, filter: "blur(10px)", y: -20 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-8"
                  >
                    <div className="inline-block px-4 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 backdrop-blur-sm">
                      {slides[currentSlide].badge}
                    </div>

                    <h1 className="text-6xl lg:text-[5.5rem] font-black text-white leading-[1] tracking-tight">
                      {slides[currentSlide].title.split(" ").map((word, i) => (
                        <span
                          key={i}
                          className={
                            i === 1 || (currentSlide !== 3 && i === 2)
                              ? "text-gradient block lg:inline"
                              : ""
                          }
                        >
                          {word}{" "}
                        </span>
                      ))}
                    </h1>

                    <p className="text-xl text-slate-300 max-w-xl leading-relaxed font-light">
                      {slides[currentSlide].subtitle}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Custom Slide Indicators */}
                <div className="flex gap-4 mt-12">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      aria-label={`Aller à la slide ${i + 1}`}
                      className="group relative py-2"
                    >
                      <div className={`h-[3px] rounded-full transition-all duration-700 ${currentSlide === i ? "w-12 bg-blue-500" : "w-6 bg-white/10 group-hover:bg-white/30"
                        }`} />
                    </button>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-6 pt-4"
              >
                <Link
                  to="/calculator"
                  className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-2xl text-white overflow-hidden transition-all hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-blue-600 group-hover:bg-blue-500 transition-colors" />
                  <div className="absolute inset-0 animate-shimmer opacity-30" />
                  <span className="relative z-10 flex items-center">
                    {branding.hero.cta1}
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1.5 transition-transform" />
                  </span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-2xl text-white glass hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
                >
                  {branding.hero.cta2}
                </Link>
              </motion.div>

              <div className="flex items-center gap-10 pt-10 border-t border-white/5">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-11 h-11 rounded-full border-2 border-slate-900 glass flex items-center justify-center group overflow-hidden"
                    >
                      <div className="p-2 text-[10px] font-black text-blue-400 group-hover:scale-125 transition-transform">NMC</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-white font-black text-xl tracking-tight">
                    10,000+ <span className="text-slate-500 font-light">Partenaires</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} fill="currentColor" className="drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                    ))}
                    <span className="text-slate-400 text-xs font-bold ml-2">CONFiance TOTALE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Component Showcase */}
            <div className="hidden lg:block relative perspective-1000">
              <motion.div
                initial={{ opacity: 0, rotateY: 20, x: 50 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative z-10 glass-card rounded-[3rem] p-10 transform-gpu shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-white/5"
              >
                {/* Floating Elements on Card */}
                <div className="absolute -top-6 -right-6 glass p-5 rounded-[2rem] border-white/10 animate-float shadow-2xl z-20">
                  <div className="p-3 bg-blue-500 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                    <Plane className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="flex justify-between items-start mb-14">
                  <div>
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Live Insight</div>
                    <h3 className="text-3xl font-black text-white tracking-tight">Global Logistics</h3>
                    <p className="text-slate-400 text-sm mt-1">Optimization Engine v4.0</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center group">
                      <Truck className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
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
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* CAN Support Banner */}
      <div className="w-full sticky top-16 z-30">
        <CanBanner />
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
      {/* Marketplace Showcase Section */}
      <MarketplaceShowcase />

      {/* Solutions Section - REDESIGNED PREMIUM FEATURES */}
      <div className="py-40 bg-white dark:bg-gray-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-blue-600 dark:text-blue-400 font-black tracking-[0.4em] uppercase text-[10px]">
                {branding.features.title}
              </h2>
              <p className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">
                Solutions <span className="text-gradient">Intelligentes</span>.
              </p>
              <p className="max-w-3xl text-xl text-slate-500 dark:text-slate-400 mx-auto leading-relaxed font-light">
                {branding.features.description}
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative p-12 bg-white dark:bg-gray-900/40 rounded-[3rem] border border-slate-100 dark:border-white/5 hover:border-blue-500/30 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div className="relative z-10">
                  <div
                    className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-12 transition-all duration-700 shadow-lg group-hover:scale-110 group-hover:rotate-6 ${feature.classes}`}
                  >
                    <feature.icon className="h-10 w-10" />
                  </div>

                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                    {feature.title}
                  </h3>

                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg mb-12 font-light">
                    {feature.desc}
                  </p>

                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all duration-300">
                    Découvrir l'offre <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section - REDESIGNED PREMIUM TIMELINE */}
      <div className="py-40 bg-white dark:bg-gray-950 relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-0 w-full h-[600px] -translate-y-1/2 pointer-events-none opacity-10 dark:opacity-20 flex justify-center items-center">
          <img
            src="/assets/cargo-ship-abstract.png"
            alt="Cargo Ship Abstract"
            className="w-full h-full object-cover grayscale"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-blue-600 dark:text-blue-400 font-black tracking-[0.4em] uppercase text-[10px]">
                {branding.howItWorks.title}
              </h2>
              <p className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
                Le Processus <span className="text-gradient">NextMove</span>.
              </p>
            </motion.div>
          </div>

          <div className="relative">
            {/* Central Vertical Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/0 via-blue-500/30 to-blue-500/0 -translate-x-1/2"></div>

            <div className="space-y-32 lg:space-y-48">
              {[
                {
                  step: 1,
                  title: branding.howItWorks.step1_title,
                  desc: branding.howItWorks.step1_desc,
                  icon: FileText,
                  align: 'left'
                },
                {
                  step: 2,
                  title: branding.howItWorks.step2_title,
                  desc: branding.howItWorks.step2_desc,
                  icon: Box,
                  align: 'right'
                },
                {
                  step: 3,
                  title: branding.howItWorks.step3_title,
                  desc: branding.howItWorks.step3_desc,
                  icon: Ship,
                  align: 'left'
                },
                {
                  step: 4,
                  title: branding.howItWorks.step4_title,
                  desc: branding.howItWorks.step4_desc,
                  icon: HomeIcon,
                  align: 'right'
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: item.align === 'left' ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-0 ${item.align === 'right' ? 'lg:flex-row-reverse' : ''}`}
                >
                  {/* Content Side */}
                  <div className={`flex-1 w-full lg:w-auto text-center ${item.align === 'left' ? 'lg:text-right lg:pr-24' : 'lg:text-left lg:pl-24'}`}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-6 lg:mb-8 text-blue-500 ${item.align === 'right' ? 'lg:ml-0' : 'lg:mr-0'}`}>
                      <item.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-md mx-auto lg:max-w-none">
                      {item.desc}
                    </p>
                  </div>

                  {/* Indicator Section */}
                  <div className="relative flex items-center justify-center lg:w-24">
                    <div className="hidden lg:block w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-500/20 z-10 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                    <div className="lg:hidden w-12 h-12 rounded-full glass flex items-center justify-center font-black text-blue-500 text-xl">
                      {item.step}
                    </div>
                  </div>

                  {/* Spacer Side */}
                  <div className="hidden lg:block flex-1"></div>
                </motion.div>
              ))}
            </div>
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
            {(testimonials.length > 0 ? testimonials : [
              {
                content: branding.testimonials.review1_text,
                name: branding.testimonials.review1_name,
                role: branding.testimonials.review1_role,
                rating: 5,
              },
              {
                content: branding.testimonials.review2_text,
                name: branding.testimonials.review2_name,
                role: branding.testimonials.review2_role,
                rating: 5,
              },
              {
                content: branding.testimonials.review3_text,
                name: branding.testimonials.review3_name,
                role: branding.testimonials.review3_role,
                rating: 5,
              },
            ]).map((review, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative group hover:-translate-y-2 transition-transform duration-500"
              >
                <div className="absolute top-10 right-10 text-slate-100 dark:text-slate-800 text-9xl font-serif opacity-50 group-hover:scale-110 transition-transform duration-500 line-height-1">
                  "
                </div>
                <div className="flex gap-1 mb-8">
                  {[...Array(review.rating || 5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-10 italic text-lg leading-relaxed relative z-10 font-light">
                  "{review.content}"
                </p>
                <div className="flex items-center gap-5 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30 overflow-hidden">
                    {"avatar_url" in review && review.avatar_url ? (
                      <img src={review.avatar_url} alt={review.name} className="w-full h-full object-cover" />
                    ) : (
                      review.name.charAt(0)
                    )}
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

      {/* Global Network Section - NEW PREMIUM SECTION */}
      <div className="py-32 bg-slate-900 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
                Expansion Globale
              </div>
              <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                Connecter <span className="text-gradient">l'Afrique</span> au Reste du Monde.
              </h2>
              <p className="text-xl text-slate-400 font-light leading-relaxed">
                Notre infrastructure ne se limite pas aux ports. Nous créons des ponts numériques sécurisés entre les plus grands centres de production mondiaux et vos marchés locaux.
              </p>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-black text-white mb-2">24/7</div>
                  <div className="text-sm text-slate-500 uppercase tracking-widest font-bold">Surveillance Live</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white mb-2">15+</div>
                  <div className="text-sm text-slate-500 uppercase tracking-widest font-bold">Hubs Logistiques</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <img
                src="/assets/network-map.png"
                alt="Global Network Map"
                className="relative z-10 w-full rounded-[3rem] border border-white/10 shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-700"
              />
              {/* Trust badges overlay */}
              <div className="absolute -bottom-10 -left-10 glass p-6 rounded-3xl border border-white/10 z-20 shadow-2xl backdrop-blur-3xl">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">CN</div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">SN</div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">CI</div>
                  </div>
                  <div className="text-xs font-bold text-white uppercase tracking-widest">Axe Stratégique</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Wave Payment Highlight Section - Refined */}
      <div className="py-32 bg-sky-50/50 dark:bg-slate-900/50 border-y border-sky-100 dark:border-slate-800 relative overflow-hidden">
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

      {/* Ecommerce Academy Section */}
      <EcommerceAcademy />

      {/* Mobile App Section - NEW */}
      <div className="py-32 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative flex justify-center">
              <img
                src="/nextmove-mobile.png"
                alt="NextMove Mobile"
                className="relative z-10 transform hover:scale-105 transition-all duration-700 w-full max-w-[320px] lg:max-w-[400px] mx-auto"
              />
              <div className="absolute -bottom-10 -right-10 p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 z-20 animate-bounce-subtle">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                    <Smartphone className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">Capacitor Native</div>
                    <div className="text-sm text-gray-500">iOS & Android</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Emportez le <span className="text-primary">Cargo</span> dans votre poche
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                Gérez vos expéditions, suivez vos colis en temps réel et communiquez avec vos transitaires directement depuis votre smartphone. Une expérience fluide et rapide.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Notifications Push</h4>
                    <p className="text-sm text-gray-500">Restez informé de chaque changement de statut.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Mode Hors-ligne</h4>
                    <p className="text-sm text-gray-500">Consultez vos documents même sans internet.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-10">
                <a
                  href="#"
                  className="transition-transform hover:scale-105 active:scale-95 duration-200"
                  title="Comment installer sur iPhone"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowInstallGuide(true);
                  }}
                >
                  <img
                    src="/assets/app-store-badge.svg"
                    alt="Installer sur iPhone"
                    className="h-[52px] w-auto"
                  />
                </a>
                <a
                  href="https://dkbnmnpxoesvkbnwuyle.supabase.co/storage/v1/object/public/apks/latest/nextmove-cargo.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105 active:scale-95 duration-200"
                  title="Télécharger l'APK pour Android"
                >
                  <img
                    src="/assets/google-play-badge.svg"
                    alt="Télécharger pour Android (APK)"
                    className="h-[52px] w-auto"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CEO's Word Section Header */}
      <div className="bg-slate-50 dark:bg-gray-950 pt-20">
        <CEOSection />
      </div>

      {/* Referral Program Section - NEW PREMIUM SECTION (Light Version) */}
      <div className="py-32 relative overflow-hidden bg-white dark:bg-gray-900 border-y border-slate-100 dark:border-slate-800">
        {/* Abstract Background - Light */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="relative z-10 glass-card p-10 rounded-[3rem] border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl rotate-12 flex items-center justify-center shadow-2xl z-20 animate-float">
                  <Star className="w-10 h-10 text-white fill-white" />
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">Nouvelle Commission</div>
                      <div className="text-slate-400 text-sm">Il y a 2 minutes</div>
                    </div>
                    <div className="ml-auto text-green-400 font-bold text-xl">+ 15.000 F</div>
                  </div>

                  <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/10 opacity-60">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">Nouvelle Commission</div>
                      <div className="text-slate-400 text-sm">Il y a 2 heures</div>
                    </div>
                    <div className="ml-auto text-green-400 font-bold text-xl">+ 25.000 F</div>
                  </div>

                  <div className="p-6 bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-xl mt-8 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="text-white/90 text-sm font-bold uppercase tracking-widest mb-1">Gains Totaux</div>
                    <div className="text-4xl font-black text-white">450.000 FCFA</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
                Programme Partenaire
              </div>
              <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight">
                Gagnez avec <span className="text-primary">NextMove</span> <span className="text-secondary">Cargo</span>.
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                Rejoignez notre programme d'affiliation exclusif. Recommandez NextMove Cargo à votre réseau et touchez des commissions sur chaque opération.
              </p>

              <div className="space-y-6 pt-4">
                {[
                  { title: "Lien Unique", desc: "Partagez votre lien de parrainage.", icon: Globe },
                  { title: "Suivi en Temps Réel", desc: "Suivez vos filleuls et vos gains depuis votre dashboard.", icon: Smartphone },
                  { title: "Retraits Rapides", desc: "Récupérez vos gains par Wave, Orange Money ou virement.", icon: CheckCircle }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-slate-900 dark:text-white font-bold text-lg">{item.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8">
                <Link
                  to="/register?role=partner"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-100 transition-all transform hover:scale-105 shadow-xl hover:shadow-blue-500/25"
                >
                  Devenir Partenaire
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section - Premium Accordion */}
      {
        faqs.length > 0 && (
          <div className="py-32 bg-slate-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-20">
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                  Questions Fréquentes
                </h2>
                <p className="text-xl text-slate-500 dark:text-slate-400 font-light">
                  Tout ce que vous devez savoir pour expédier en toute sérénité.
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between p-8 text-left group"
                    >
                      <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {faq.question}
                      </span>
                      <div className={`p-2 rounded-xl transition-all duration-300 ${activeFaq === faq.id ? 'bg-primary text-white rotate-180' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                        {activeFaq === faq.id ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </div>
                    </button>
                    <div
                      className={`transition-all duration-300 ease-in-out ${activeFaq === faq.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="p-8 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800 mt-0">
                        <p className="whitespace-pre-wrap">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      <div className="relative py-40 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 dark:bg-black">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-black/90"></div>
        </div>
        <div className="relative max-w-5xl mx-auto text-center px-4">
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight tracking-tight">
            {branding?.cta?.title || "Prêt à Expédier ?"}
          </h2>
          <p className="text-2xl text-blue-100 mb-16 max-w-3xl mx-auto font-light">
            {branding?.cta?.subtitle || "Rejoignez la révolution de la logistique digitale en Afrique."}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-12 py-6 text-xl font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-500 transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_rgba(37,99,235,0.7)] border border-blue-400/30"
          >
            {branding?.cta?.button || "Commencer l'Aventure"}
            <ChevronRight className="ml-2 h-6 w-6" />
          </Link>
        </div>
      </div>

      <InstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />
    </div >
  );
}
